import { cookies } from "next/headers";
import { decodeSessionCookie, destroySession, SESSION_COOKIE } from "@/server/auth/session";
import { handle, json } from "@/server/api";

export const POST = handle(async () => {
  const jar = await cookies();
  const id = decodeSessionCookie(jar.get(SESSION_COOKIE)?.value);
  if (id) await destroySession(id);
  jar.delete(SESSION_COOKIE);
  return json({ ok: true });
});
