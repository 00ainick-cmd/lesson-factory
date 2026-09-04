import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { qualityRules } from "@/server/db/schema";
import { requireWorkspace } from "@/server/auth/rbac";
import { ApiError, handle, json, readJson, type Params } from "@/server/api";
import { updateRule } from "@/server/services/knowledge";

export const PATCH = handle(async (req: Request, { params }: Params<"ruleId">) => {
  const { ruleId } = await params;
  const [r] = await db.select({ ws: qualityRules.workspaceId }).from(qualityRules).where(eq(qualityRules.id, ruleId)).limit(1);
  if (!r) throw new ApiError(404, "Rule not found");
  const { user } = await requireWorkspace(r.ws, "rules.write");
  const body = await readJson(req, z.object({ active: z.boolean().optional(), severity: z.enum(["info", "warning", "error", "blocker"]).optional(), params: z.record(z.string(), z.unknown()).optional() }));
  return json({ rule: await updateRule({ workspaceId: r.ws, ruleId, userId: user.id, ...body }) });
});
