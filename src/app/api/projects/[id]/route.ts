import { requireProject } from "@/server/auth/rbac";
import { handle, json, type Params } from "@/server/api";
import { deleteProject, getProjectFull } from "@/server/services/projects";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { role } = await requireProject(id, "project.read");
  return json({ ...(await getProjectFull(id)), role });
});

export const DELETE = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { user } = await requireProject(id, "project.delete");
  await deleteProject(id, user.id);
  return json({ ok: true });
});
