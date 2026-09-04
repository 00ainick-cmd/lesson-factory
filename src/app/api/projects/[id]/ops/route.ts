import { z } from "zod";
import { requireProject } from "@/server/auth/rbac";
import { handle, json, readJson, type Params } from "@/server/api";
import { OpSchema } from "@/server/lesson/ops";
import { applyProjectOps } from "@/server/services/projects";

/** Server-side op application (used by scripted clients and tests; the editor uses PUT /document). */
export const POST = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { user } = await requireProject(id, "project.write");
  const body = await readJson(req, z.object({ baseRevision: z.number().int().min(0), ops: z.array(OpSchema).min(1).max(200) }));
  return json(await applyProjectOps({ projectId: id, userId: user.id, ...body }));
});
