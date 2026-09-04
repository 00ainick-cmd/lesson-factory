import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { knowledgeChunks, knowledgeDocuments } from "@/server/db/schema";

export type CopilotRole = "design" | "phrasing" | "alignment" | "checks" | "audit" | "export" | "process";

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  seedPath: string | null;
  documentVersion: number;
  heading: string | null;
  content: string;
  rank: number;
};

/**
 * Role-aware retrieval (principle 6): only chunks from active workspace documents tagged with the
 * requested role(s) are candidates; Postgres full-text ranking picks the top-k for the query.
 * Every returned chunk carries document id + version so Copilot output can cite provenance.
 */
export async function retrieveChunks(opts: { workspaceId: string; roles: CopilotRole[]; query: string; limit?: number }): Promise<RetrievedChunk[]> {
  const limit = opts.limit ?? 8;
  const rolesJson = JSON.stringify(opts.roles);
  // OR the terms so a query about several concepts still finds partial matches; ts_rank orders by overlap.
  const terms = opts.query.replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter((w) => w.length > 1);
  const tsq = terms.length ? sql`websearch_to_tsquery('english', ${terms.join(" OR ")})` : null;
  const rank = tsq ? sql<number>`ts_rank(to_tsvector('english', ${knowledgeChunks.content}), ${tsq})` : sql<number>`0`;
  const rows = await db
    .select({
      chunkId: knowledgeChunks.id,
      documentId: knowledgeChunks.documentId,
      documentTitle: knowledgeDocuments.title,
      seedPath: knowledgeDocuments.seedPath,
      documentVersion: knowledgeDocuments.currentVersion,
      heading: knowledgeChunks.heading,
      content: knowledgeChunks.content,
      rank,
    })
    .from(knowledgeChunks)
    .innerJoin(knowledgeDocuments, eq(knowledgeDocuments.id, knowledgeChunks.documentId))
    .where(
      and(
        eq(knowledgeChunks.workspaceId, opts.workspaceId),
        eq(knowledgeDocuments.active, true),
        sql`${knowledgeChunks.roles} ?| array(select jsonb_array_elements_text(${rolesJson}::jsonb))`,
        tsq ? sql`to_tsvector('english', ${knowledgeChunks.content}) @@ ${tsq}` : sql`true`,
      ),
    )
    .orderBy(sql`${rank} desc`, knowledgeChunks.ordinal)
    .limit(limit);
  return rows;
}
