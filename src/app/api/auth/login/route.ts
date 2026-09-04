import { z } from "zod";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { verifyPassword } from "@/server/auth/password";
import { createSession, requestMeta, SESSION_COOKIE, encodeSessionCookie, sessionCookieOptions } from "@/server/auth/session";
import { ApiError, handle, json, readJson } from "@/server/api";
import { recordActivity } from "@/server/activity";
import { logger } from "@/server/log";

const Body = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });
const attempts = new Map<string, { n: number; until: number }>();

export const POST = handle(async (req: Request) => {
  const body = await readJson(req, Body);
  const meta = await requestMeta();
  const key = `${meta.ip ?? "?"}:${body.email.toLowerCase()}`;
  const a = attempts.get(key);
  if (a && a.n >= 8 && a.until > Date.now()) throw new ApiError(429, "Too many attempts; try again in a few minutes");
  const [user] = await db.select().from(users).where(eq(users.email, body.email.toLowerCase())).limit(1);
  const ok = user ? await verifyPassword(user.passwordHash, body.password) : false;
  if (!ok || !user) {
    attempts.set(key, { n: (a?.n ?? 0) + 1, until: Date.now() + 10 * 60_000 });
    logger.warn("auth_failed", { email: body.email.toLowerCase(), ip: meta.ip });
    throw new ApiError(401, "Invalid email or password");
  }
  attempts.delete(key);
  const session = await createSession(user.id, meta);
  (await cookies()).set(SESSION_COOKIE, encodeSessionCookie(session.id), sessionCookieOptions(session.expiresAt));
  await recordActivity({ userId: user.id, action: "auth.login", targetType: "user", targetId: user.id, ip: meta.ip });
  return json({ user: { id: user.id, email: user.email, name: user.name, isPlatformAdmin: user.isPlatformAdmin } });
});
