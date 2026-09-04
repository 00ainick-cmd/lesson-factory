import { z } from "zod";
import { requireWorkspace } from "@/server/auth/rbac";
import { handle, json, readJson, type Params } from "@/server/api";
import { updateMemberRole } from "@/server/services/workspaces";

export const PATCH = handle(async (req: Request, { params }: Params<"memberId">) => {
  const { memberId } = await params;
  const body = await readJson(req, z.object({ workspaceId: z.string().uuid(), role: z.enum(["admin", "author", "reviewer"]) }));
  const { user } = await requireWorkspace(body.workspaceId, "workspace.manage");
  return json({ member: await updateMemberRole(body.workspaceId, memberId, body.role, user.id) });
});
