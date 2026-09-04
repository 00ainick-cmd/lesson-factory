import { requireProject } from "@/server/auth/rbac";
import { handle, json, type Params } from "@/server/api";
import { listActivity } from "@/server/services/workspaces";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { project } = await requireProject(id, "project.read");
  return json({ activity: await listActivity(project.workspaceId, { projectId: id, limit: 100 }) });
});
