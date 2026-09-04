import { z } from "zod";
import { requireUser } from "@/server/auth/rbac";
import { handle, json, readJson } from "@/server/api";
import { createWorkspace, listWorkspacesForUser } from "@/server/services/workspaces";

export const GET = handle(async () => {
  const user = await requireUser();
  return json({ workspaces: await listWorkspacesForUser(user.id, user.isPlatformAdmin) });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await readJson(req, z.object({ name: z.string().min(1).max(120) }));
  return json(await createWorkspace({ name: body.name, userId: user.id }), { status: 201 });
});
