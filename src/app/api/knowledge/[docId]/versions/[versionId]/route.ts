import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { knowledgeDocuments } from "@/server/db/schema";
import { requireWorkspace } from "@/server/auth/rbac";
import { ApiError, handle, json, type Params } from "@/server/api";
import { getDocumentVersion } from "@/server/services/knowledge";

export const GET = handle(async (_req: Request, { params }: Params<"docId" | "versionId">) => {
  const { docId, versionId } = await params;
  const [d] = await db.select({ ws: knowledgeDocuments.workspaceId }).from(knowledgeDocuments).where(eq(knowledgeDocuments.id, docId)).limit(1);
  if (!d) throw new ApiError(404, "Document not found");
  await requireWorkspace(d.ws, "knowledge.read");
  return json({ version: await getDocumentVersion(docId, versionId) });
});
