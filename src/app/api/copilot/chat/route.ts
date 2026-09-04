import { z } from "zod";
import { requireProject, requireWorkspace } from "@/server/auth/rbac";
import { handle, json, readJson } from "@/server/api";
import { copilotChat } from "@/server/copilot/chat";
import { getWorkingDocument } from "@/server/services/projects";

const Body = z.object({
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid().nullable().default(null),
  message: z.string().min(1).max(4000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) })).max(20).default([]),
  selection: z.object({ beatId: z.string().optional(), blockId: z.string().optional() }).optional(),
});

export const POST = handle(async (req: Request) => {
  const body = await readJson(req, Body);
  const { user } = body.projectId ? await requireProject(body.projectId, "copilot.use") : await requireWorkspace(body.workspaceId, "copilot.use");
  let doc = null;
  let rev = 0;
  if (body.projectId) {
    const w = await getWorkingDocument(body.projectId).catch(() => null);
    if (w) ({ doc: doc, revision: rev } = w);
  }
  return json(await copilotChat({ workspaceId: body.workspaceId, projectId: body.projectId, userId: user.id, message: body.message, history: body.history, doc, workingRevision: rev, selection: body.selection }));
});
