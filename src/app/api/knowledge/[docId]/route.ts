import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { knowledgeDocuments } from "@/server/db/schema";
import { requireWorkspace } from "@/server/auth/rbac";
import { ApiError, handle, json, readJson, type Params } from "@/server/api";
import { getDocument, saveDocument } from "@/server/services/knowledge";

async function wsOf(docId: string) {
  const [d] = await db.select({ ws: knowledgeDocuments.workspaceId }).from(knowledgeDocuments).where(eq(knowledgeDocuments.id, docId)).limit(1);
  if (!d) throw new ApiError(404, "Document not found");
  return d.ws;
}

export const GET = handle(async (_req: Request, { params }: Params<"docId">) => {
  const { docId } = await params;
  const ws = await wsOf(docId);
  await requireWorkspace(ws, "knowledge.read");
  return json(await getDocument(ws, docId));
});

export const PUT = handle(async (req: Request, { params }: Params<"docId">) => {
  const { docId } = await params;
  const ws = await wsOf(docId);
  const { user } = await requireWorkspace(ws, "knowledge.write");
  const body = await readJson(req, z.object({ content: z.string().max(400_000), note: z.string().max(300).optional(), roles: z.array(z.string()).optional(), active: z.boolean().optional(), expectedVersion: z.number().int().optional() }));
  return json(await saveDocument({ workspaceId: ws, docId, userId: user.id, ...body }));
});
