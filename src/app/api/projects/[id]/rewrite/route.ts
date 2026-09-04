import { z } from "zod";
import { requireProject } from "@/server/auth/rbac";
import { handle, json, readJson, type Params } from "@/server/api";
import { getWorkingDocument } from "@/server/services/projects";
import { createNoAiSlopProposal } from "@/server/copilot/rewrite-block";

export const POST = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { user, project } = await requireProject(id, "copilot.use");
  const body = await readJson(req, z.object({ blockId: z.string().min(1), baseRevision: z.number().int().min(0) }));
  const { doc, revision } = await getWorkingDocument(id);
  if (revision !== body.baseRevision) {
    return json({ error: "The lesson changed before the rewrite started. Wait for autosave, then try again.", details: { revision } }, { status: 409 });
  }
  return json(
    await createNoAiSlopProposal({
      projectId: id,
      workspaceId: project.workspaceId,
      userId: user.id,
      doc,
      workingRevision: revision,
      blockId: body.blockId,
    }),
  );
});
