import { requireProject } from "@/server/auth/rbac";
import { ApiError, handle, type Params } from "@/server/api";
import { readArtifactForProject } from "@/server/services/projects";

/** Download the immutable original upload. Served as an attachment so it never executes in the app origin. */
export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { project } = await requireProject(id, "project.read");
  if (!project.originalArtifactId) throw new ApiError(404, "No original file");
  const { row, body } = await readArtifactForProject(id, project.originalArtifactId);
  return new Response(new Uint8Array(body), {
    headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${row.filename.replace(/[^\w.-]+/g, "_")}"`, "X-Content-SHA256": row.sha256, "Cache-Control": "private, no-store" },
  });
});
