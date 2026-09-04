import { z } from "zod";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { createSession, getCurrentUser, requestMeta, SESSION_COOKIE, encodeSessionCookie, sessionCookieOptions } from "@/server/auth/session";
import { ApiError, handle, json, readJson, type Params } from "@/server/api";
import { acceptInvite, getInviteByToken } from "@/server/services/workspaces";

export const GET = handle(async (_req: Request, { params }: Params<"token">) => {
  const { token } = await params;
  const row = await getInviteByToken(token);
  if (!row) throw new ApiError(410, "Invite is invalid or expired");
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, row.inv.email)).limit(1);
  return json({ email: row.inv.email, role: row.inv.role, workspace: { id: row.ws.id, name: row.ws.name }, hasAccount: Boolean(existing), signedIn: Boolean(await getCurrentUser()) });
});

/** Accept an invite: creates the account if needed (name+password), signs in, and adds membership. */
export const POST = handle(async (req: Request, { params }: Params<"token">) => {
  const { token } = await params;
  const row = await getInviteByToken(token);
  if (!row) throw new ApiError(410, "Invite is invalid or expired");
  const body = await readJson(req, z.object({ name: z.string().min(1).max(120).optional(), password: z.string().min(10).max(200).optional() }));
  let user = await getCurrentUser();
  if (user && user.email !== row.inv.email) throw new ApiError(403, `This invite is for ${row.inv.email}; sign out first`);
  if (!user) {
    const [existing] = await db.select().from(users).where(eq(users.email, row.inv.email)).limit(1);
    if (existing) throw new ApiError(401, "Account exists; sign in first, then open the invite link again");
    if (!body.name || !body.password) throw new ApiError(400, "Name and password are required to create your account");
    const [created] = await db.insert(users).values({ email: row.inv.email, name: body.name, passwordHash: await hashPassword(body.password) }).returning();
    user = { id: created!.id, email: created!.email, name: created!.name, isPlatformAdmin: false };
    const session = await createSession(user.id, await requestMeta());
    (await cookies()).set(SESSION_COOKIE, encodeSessionCookie(session.id), sessionCookieOptions(session.expiresAt));
  }
  const ws = await acceptInvite(token, user.id);
  return json({ workspace: ws });
});
