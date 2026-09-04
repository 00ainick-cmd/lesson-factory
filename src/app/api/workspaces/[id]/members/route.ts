import { requireWorkspace } from "@/server/auth/rbac";
import { handle, json, type Params } from "@/server/api";
import { listMembers } from "@/server/services/workspaces";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireWorkspace(id, "project.read");
  return json({ members: await listMembers(id) });
});
