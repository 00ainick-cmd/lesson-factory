import { requireWorkspace } from "@/server/auth/rbac";
import { ApiError, handle, json, type Params } from "@/server/api";
import { createImportProject, listProjects } from "@/server/services/projects";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireWorkspace(id, "project.read");
  return json({ projects: await listProjects(id) });
});

/** multipart/form-data: title, file (.html). Stores the original immutably and queues the import. */
export const POST = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { user } = await requireWorkspace(id, "project.write");
  const form = await req.formData().catch(() => null);
  if (!form) throw new ApiError(400, "Expected multipart form data");
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "Missing file");
  const title = String(form.get("title") ?? "").trim() || file.name.replace(/\.html?$/i, "");
  const body = Buffer.from(await file.arrayBuffer());
  const result = await createImportProject({ workspaceId: id, userId: user.id, title, filename: file.name, body });
  return json({ project: result.project, artifact: { id: result.artifact.id, sha256: result.artifact.sha256, sizeBytes: result.artifact.sizeBytes }, job: result.job }, { status: 201 });
});
