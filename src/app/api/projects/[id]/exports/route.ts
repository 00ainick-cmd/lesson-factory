import { z } from "zod";
import { requireProject } from "@/server/auth/rbac";
import { handle, json, readJson, type Params } from "@/server/api";
import { listExports, requestExport } from "@/server/services/projects";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireProject(id, "project.read");
  return json({ exports: await listExports(id) });
});

export const POST = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { user, project } = await requireProject(id, "project.export");
  const body = await readJson(req, z.object({ format: z.enum(["standalone_html"]).default("standalone_html"), versionId: z.string().uuid().optional(), validate: z.boolean().default(true), standaloneShim: z.boolean().optional() }));
  return json(await requestExport({ projectId: id, workspaceId: project.workspaceId, userId: user.id, ...body }), { status: 202 });
});
