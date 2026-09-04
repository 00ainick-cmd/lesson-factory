import { requireWorkspace } from "@/server/auth/rbac";
import { handle, json, type Params } from "@/server/api";
import { getWorkspace, listMembers } from "@/server/services/workspaces";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { role } = await requireWorkspace(id, "project.read");
  return json({ workspace: await getWorkspace(id), role, members: await listMembers(id) });
});
