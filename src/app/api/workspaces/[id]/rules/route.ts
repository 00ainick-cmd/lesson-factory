import { requireWorkspace } from "@/server/auth/rbac";
import { handle, json, type Params } from "@/server/api";
import { listRules } from "@/server/services/knowledge";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireWorkspace(id, "knowledge.read");
  return json({ rules: await listRules(id) });
});
