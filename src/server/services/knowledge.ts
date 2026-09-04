import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { beatTypes, knowledgeDocumentVersions, knowledgeDocuments, objectives, qualityRules, themeTokens } from "@/server/db/schema";
import { reindexDocument } from "@/server/knowledge/seed";
import { sha256 } from "@/server/storage";
import { recordActivity } from "@/server/activity";
import { ApiError } from "@/server/api";

export async function listDocuments(workspaceId: string) {
  return db
    .select({
      id: knowledgeDocuments.id,
      slug: knowledgeDocuments.slug,
      title: knowledgeDocuments.title,
      category: knowledgeDocuments.category,
      roles: knowledgeDocuments.roles,
      seedPath: knowledgeDocuments.seedPath,
      seedCommit: knowledgeDocuments.seedCommit,
      currentVersion: knowledgeDocuments.currentVersion,
      active: knowledgeDocuments.active,
      updatedAt: knowledgeDocuments.updatedAt,
      drifted: sql<boolean>`${knowledgeDocuments.baselineSha256} is distinct from ${knowledgeDocuments.contentSha256}`,
      words: sql<number>`array_length(regexp_split_to_array(${knowledgeDocuments.content}, '\\s+'), 1)`,
    })
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.workspaceId, workspaceId))
    .orderBy(asc(knowledgeDocuments.category), asc(knowledgeDocuments.title));
}

export async function getDocument(workspaceId: string, docId: string) {
  const [d] = await db.select().from(knowledgeDocuments).where(and(eq(knowledgeDocuments.id, docId), eq(knowledgeDocuments.workspaceId, workspaceId))).limit(1);
  if (!d) throw new ApiError(404, "Document not found");
  const versions = await db
    .select({ id: knowledgeDocumentVersions.id, number: knowledgeDocumentVersions.number, contentSha256: knowledgeDocumentVersions.contentSha256, isBaseline: knowledgeDocumentVersions.isBaseline, note: knowledgeDocumentVersions.note, createdAt: knowledgeDocumentVersions.createdAt, createdBy: knowledgeDocumentVersions.createdBy })
    .from(knowledgeDocumentVersions)
    .where(eq(knowledgeDocumentVersions.documentId, docId))
    .orderBy(desc(knowledgeDocumentVersions.number));
  return { document: d, versions, drifted: d.baselineSha256 !== d.contentSha256 };
}

export async function getDocumentVersion(docId: string, versionId: string) {
  const [v] = await db.select().from(knowledgeDocumentVersions).where(and(eq(knowledgeDocumentVersions.id, versionId), eq(knowledgeDocumentVersions.documentId, docId))).limit(1);
  if (!v) throw new ApiError(404, "Version not found");
  return v;
}

/** Save a new document version (content immutable per version) and reindex retrieval chunks. */
export async function saveDocument(input: { workspaceId: string; docId: string; userId: string; content: string; note?: string; roles?: string[]; active?: boolean; expectedVersion?: number }) {
  const { document } = await getDocument(input.workspaceId, input.docId);
  if (input.expectedVersion !== undefined && input.expectedVersion !== document.currentVersion) throw new ApiError(409, `Document changed (v${document.currentVersion}); reload before saving`, { currentVersion: document.currentVersion });
  const hash = sha256(input.content);
  const unchanged = hash === document.contentSha256 && (!input.roles || JSON.stringify(input.roles) === JSON.stringify(document.roles)) && (input.active === undefined || input.active === document.active);
  if (unchanged) return { document, changed: false };
  const number = hash === document.contentSha256 ? document.currentVersion : document.currentVersion + 1;
  const roles = input.roles ?? document.roles;
  if (number !== document.currentVersion) {
    await db.insert(knowledgeDocumentVersions).values({ documentId: document.id, number, content: input.content, contentSha256: hash, isBaseline: false, note: input.note ?? null, createdBy: input.userId });
  }
  const [updated] = await db
    .update(knowledgeDocuments)
    .set({ content: input.content, contentSha256: hash, currentVersion: number, roles, active: input.active ?? document.active, updatedAt: new Date() })
    .where(eq(knowledgeDocuments.id, document.id))
    .returning();
  await reindexDocument(document.id, input.workspaceId, input.content, document.category, roles);
  await recordActivity({ workspaceId: input.workspaceId, userId: input.userId, action: "knowledge.save", targetType: "knowledge_document", targetId: document.id, details: { version: number, note: input.note ?? null, roles, active: updated!.active } });
  return { document: updated!, changed: true };
}

export async function restoreBaseline(input: { workspaceId: string; docId: string; userId: string }) {
  const [base] = await db.select().from(knowledgeDocumentVersions).where(and(eq(knowledgeDocumentVersions.documentId, input.docId), eq(knowledgeDocumentVersions.isBaseline, true))).limit(1);
  if (!base) throw new ApiError(404, "No baseline version recorded");
  return saveDocument({ ...input, content: base.content, note: "Restored seed-kit baseline" });
}

export async function listObjectives(workspaceId: string) {
  return db.select().from(objectives).where(eq(objectives.workspaceId, workspaceId)).orderBy(asc(objectives.code));
}
export async function listBeatTypes(workspaceId: string) {
  return db.select().from(beatTypes).where(eq(beatTypes.workspaceId, workspaceId)).orderBy(asc(beatTypes.ordinal));
}
export async function listRules(workspaceId: string) {
  return db.select().from(qualityRules).where(eq(qualityRules.workspaceId, workspaceId)).orderBy(asc(qualityRules.category), asc(qualityRules.key));
}
export async function listTokens(workspaceId: string) {
  return db.select().from(themeTokens).where(eq(themeTokens.workspaceId, workspaceId)).orderBy(asc(themeTokens.family), asc(themeTokens.name));
}

export async function updateRule(input: { workspaceId: string; ruleId: string; userId: string; active?: boolean; severity?: "info" | "warning" | "error" | "blocker"; params?: Record<string, unknown> }) {
  const [rule] = await db.select().from(qualityRules).where(and(eq(qualityRules.id, input.ruleId), eq(qualityRules.workspaceId, input.workspaceId))).limit(1);
  if (!rule) throw new ApiError(404, "Rule not found");
  const paramsChanged = input.params !== undefined && JSON.stringify(input.params) !== JSON.stringify(rule.params);
  const [updated] = await db
    .update(qualityRules)
    .set({
      active: input.active ?? rule.active,
      severity: input.severity ?? rule.severity,
      params: input.params ?? rule.params,
      version: paramsChanged ? rule.version + 1 : rule.version, // findings cite rule version, so param edits bump it
      updatedAt: new Date(),
    })
    .where(eq(qualityRules.id, rule.id))
    .returning();
  await recordActivity({ workspaceId: input.workspaceId, userId: input.userId, action: "rule.update", targetType: "quality_rule", targetId: rule.id, details: { key: rule.key, from: { active: rule.active, severity: rule.severity, params: rule.params, version: rule.version }, to: { active: updated!.active, severity: updated!.severity, params: updated!.params, version: updated!.version } } });
  return updated!;
}
