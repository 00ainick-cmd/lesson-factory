import { requireWorkspace } from "@/server/auth/rbac";
import { handle, json, type Params } from "@/server/api";
import { listActivity } from "@/server/services/workspaces";

export const GET = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireWorkspace(id, "project.read");
  const url = new URL(req.url);
  return json({ activity: await listActivity(id, { projectId: url.searchParams.get("projectId") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 100) }) });
});
