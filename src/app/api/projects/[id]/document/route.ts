import { z } from "zod";
import { requireProject } from "@/server/auth/rbac";
import { handle, json, readJson, type Params } from "@/server/api";
import { getWorkingDocument, saveWorkingDocument } from "@/server/services/projects";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireProject(id, "project.read");
  const { doc, revision } = await getWorkingDocument(id);
  return json({ document: doc, revision });
});

/** Full-document save with optimistic concurrency (client applies ops locally, then persists). */
export const PUT = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { user } = await requireProject(id, "project.write");
  const body = await readJson(req, z.object({ baseRevision: z.number().int().min(0), document: z.unknown(), opTypes: z.array(z.string()).optional() }));
  return json(await saveWorkingDocument({ projectId: id, userId: user.id, ...body }));
});
