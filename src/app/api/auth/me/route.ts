import { getCurrentUser } from "@/server/auth/session";
import { handle, json } from "@/server/api";
import { listWorkspacesForUser } from "@/server/services/workspaces";

export const GET = handle(async () => {
  const user = await getCurrentUser();
  if (!user) return json({ user: null, workspaces: [] });
  return json({ user, workspaces: await listWorkspacesForUser(user.id, user.isPlatformAdmin) });
});
