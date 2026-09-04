import { z } from "zod";
import { requireWorkspace } from "@/server/auth/rbac";
import { handle, json, readJson, type Params } from "@/server/api";
import { createInvite, listInvites } from "@/server/services/workspaces";
import { env } from "@/server/env";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireWorkspace(id, "workspace.invite");
  return json({ invites: await listInvites(id) });
});

export const POST = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { user } = await requireWorkspace(id, "workspace.invite");
  const body = await readJson(req, z.object({ email: z.string().email(), role: z.enum(["admin", "author", "reviewer"]).default("author") }));
  const { invite, token } = await createInvite({ workspaceId: id, email: body.email, role: body.role, invitedBy: user.id });
  return json({ invite, link: `${env().APP_ORIGIN}/invite/${token}` }, { status: 201 });
});
