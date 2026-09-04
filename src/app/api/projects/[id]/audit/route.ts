import { z } from "zod";
import { requireProject } from "@/server/auth/rbac";
import { handle, json, readJson, type Params } from "@/server/api";
import { latestAudit, requestAudit } from "@/server/services/projects";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireProject(id, "project.read");
  return json(await latestAudit(id));
});

export const POST = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { user, project } = await requireProject(id, "copilot.use");
  const body = await readJson(req, z.object({ kind: z.enum(["quality_audit", "writing_check", "export_preflight", "import_audit"]).default("quality_audit") }).optional().default({ kind: "quality_audit" }));
  return json({ job: await requestAudit({ projectId: id, workspaceId: project.workspaceId, userId: user.id, kind: body.kind }) }, { status: 202 });
});
