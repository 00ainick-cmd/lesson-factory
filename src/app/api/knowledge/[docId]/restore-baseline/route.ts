import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { knowledgeDocuments } from "@/server/db/schema";
import { requireWorkspace } from "@/server/auth/rbac";
import { ApiError, handle, json, type Params } from "@/server/api";
import { restoreBaseline } from "@/server/services/knowledge";

export const POST = handle(async (_req: Request, { params }: Params<"docId">) => {
  const { docId } = await params;
  const [d] = await db.select({ ws: knowledgeDocuments.workspaceId }).from(knowledgeDocuments).where(eq(knowledgeDocuments.id, docId)).limit(1);
  if (!d) throw new ApiError(404, "Document not found");
  const { user } = await requireWorkspace(d.ws, "knowledge.write");
  return json(await restoreBaseline({ workspaceId: d.ws, docId, userId: user.id }));
});
