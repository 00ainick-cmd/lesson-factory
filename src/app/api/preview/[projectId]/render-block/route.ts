import { z } from "zod";
import { requireProject } from "@/server/auth/rbac";
import { handle, json, readJson } from "@/server/api";
import type { Params } from "@/server/api";
import { renderBlock } from "@/server/lesson/compile";
import { BlockSchema } from "@/server/lesson/model";

/**
 * Stateless preview renderer for one block. The editor posts its (possibly unsaved) block and
 * receives the exact preview-mode HTML the compiler would emit, then patches it into the
 * sandboxed iframe without a full reload. Nothing is persisted here.
 */
export const POST = handle(async (req: Request, { params }: Params<"projectId">) => {
  const { projectId } = await params;
  await requireProject(projectId, "project.read");
  const body = await readJson(req, z.object({ block: BlockSchema }));
  return json({ html: renderBlock(body.block, { mode: "preview", authorMode: true }) });
});
