import { requireProject } from "@/server/auth/rbac";
import { ApiError, handle, type Params } from "@/server/api";
import { getExport, readArtifactForProject } from "@/server/services/projects";

export const GET = handle(async (_req: Request, { params }: Params<"id" | "exportId">) => {
  const { id, exportId } = await params;
  await requireProject(id, "project.read");
  const exp = await getExport(id, exportId);
  if (!exp.artifactId) throw new ApiError(409, `Export is ${exp.status}; nothing to download yet`);
  const { row, body } = await readArtifactForProject(id, exp.artifactId);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${row.filename.replace(/[^\w.-]+/g, "_")}"`,
      "Content-Length": String(body.length),
      "X-Content-SHA256": row.sha256,
      "Cache-Control": "private, no-store",
    },
  });
});
