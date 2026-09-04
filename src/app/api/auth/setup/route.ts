import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { createSession, requestMeta, SESSION_COOKIE, encodeSessionCookie, sessionCookieOptions } from "@/server/auth/session";
import { createWorkspace, userCount } from "@/server/services/workspaces";
import { ApiError, handle, json, readJson } from "@/server/api";
import { recordActivity } from "@/server/activity";

const Body = z.object({ name: z.string().min(1).max(120), email: z.string().email(), password: z.string().min(10).max(200), workspaceName: z.string().min(1).max(120) });

/** First-run bootstrap: only works while the users table is empty. Creates the platform admin + first workspace. */
export const GET = handle(async () => json({ needsSetup: (await userCount()) === 0 }));

export const POST = handle(async (req: Request) => {
  if ((await userCount()) > 0) throw new ApiError(403, "Setup already completed");
  const body = await readJson(req, Body);
  const [user] = await db.insert(users).values({ email: body.email.toLowerCase(), name: body.name, passwordHash: await hashPassword(body.password), isPlatformAdmin: true }).returning();
  const { workspace, seed } = await createWorkspace({ name: body.workspaceName, userId: user!.id });
  const session = await createSession(user!.id, await requestMeta());
  (await cookies()).set(SESSION_COOKIE, encodeSessionCookie(session.id), sessionCookieOptions(session.expiresAt));
  await recordActivity({ workspaceId: workspace.id, userId: user!.id, action: "auth.setup", targetType: "user", targetId: user!.id });
  return json({ user: { id: user!.id, email: user!.email, name: user!.name }, workspace, seed });
});
