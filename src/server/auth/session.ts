import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";
import { env } from "@/server/env";

export const SESSION_COOKIE = "lfs_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function sign(value: string): string {
  return createHmac("sha256", env().SESSION_SECRET).update(value).digest("base64url");
}

export function encodeSessionCookie(sessionId: string): string {
  return `${sessionId}.${sign(sessionId)}`;
}

export function decodeSessionCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx <= 0) return null;
  const id = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  const expected = sign(id);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

export async function createSession(userId: string, meta: { userAgent?: string; ip?: string; visitorId?: string } = {}) {
  const id = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id, userId, expiresAt, userAgent: meta.userAgent, ip: meta.ip, visitorId: meta.visitorId ?? null });
  return { id, expiresAt };
}

/**
 * Resolve the current session id. Primary: signed httpOnly cookie. Fallback (opt-in, hosted preview
 * only): the reverse proxy's X-Visitor-Id header, which the sandboxed preview iframe cannot forge
 * because sandbox ports are reachable only through that proxy. Never enable on a public deployment.
 */
export async function currentSessionId(): Promise<string | null> {
  const jar = await cookies();
  const fromCookie = decodeSessionCookie(jar.get(SESSION_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  if (env().AUTH_VISITOR_HEADER !== "true") return null;
  const visitorId = (await headers()).get("x-visitor-id");
  if (!visitorId) return null;
  const rows = await db.select({ id: sessions.id }).from(sessions).where(and(eq(sessions.visitorId, visitorId), gt(sessions.expiresAt, new Date()))).orderBy(desc(sessions.createdAt)).limit(1);
  return rows[0]?.id ?? null;
}

export async function destroySession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export type CurrentUser = { id: string; email: string; name: string; isPlatformAdmin: boolean };

export async function getUserBySessionId(sessionId: string): Promise<CurrentUser | null> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isPlatformAdmin: users.isPlatformAdmin,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const id = await currentSessionId();
  if (!id) return null;
  return getUserBySessionId(id);
}

export async function requestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent") ?? undefined,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    visitorId: env().AUTH_VISITOR_HEADER === "true" ? (h.get("x-visitor-id") ?? undefined) : undefined,
  };
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}
