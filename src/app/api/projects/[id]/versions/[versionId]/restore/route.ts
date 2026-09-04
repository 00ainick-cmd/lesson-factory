import { requireProject } from "@/server/auth/rbac";
import { handle, json, type Params } from "@/server/api";
import { restoreVersion } from "@/server/services/projects";

export const POST = handle(async (_req: Request, { params }: Params<"id" | "versionId">) => {
  const { id, versionId } = await params;
  const { user } = await requireProject(id, "project.write");
  return json(await restoreVersion({ projectId: id, userId: user.id, versionId }));
});
