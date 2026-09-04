import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { beatTypes, knowledgeChunks, knowledgeDocuments, knowledgeDocumentVersions, objectives, qualityRules, themeTokens } from "@/server/db/schema";
import { parseObjectiveRegistry } from "./parsers/objectives";
import { parseBeatTypes } from "./parsers/beat-types";
import { parseQualityGate } from "./parsers/quality-gate";
import { parseTokensCss } from "./parsers/tokens";
import { chunkMarkdown } from "./chunk";

export const SEED_KIT_DIR = path.resolve(process.cwd(), "seed-kit/lesson-factory");

/**
 * Role map: which kit documents feed which Copilot use (see docs/copilot-provenance.md).
 * Roles are stored per document so retrieval can filter without loading the whole library.
 */
export const KIT_DOCUMENTS: { path: string; category: string; roles: string[]; title?: string }[] = [
  { path: "START.md", category: "process", roles: ["process"] },
  { path: "MANIFEST.md", category: "process", roles: ["process"] },
  { path: "PIPELINE.md", category: "process", roles: ["process", "design"] },
  { path: "PROMPTS.md", category: "process", roles: ["process"] },
  { path: "SPEC-TEMPLATE.md", category: "process", roles: ["design", "process"] },
  { path: "NOTES-TEMPLATE.md", category: "process", roles: ["process"] },
  { path: "SKILLS-POLICY.md", category: "process", roles: ["process"] },
  { path: "QUALITY-BAR.md", category: "quality", roles: ["audit", "export"] },
  { path: "ship/SHIP.md", category: "shipping", roles: ["export"] },
  { path: "chassis/chassis.md", category: "chassis", roles: ["design", "audit"] },
  { path: "chassis/BEAT-TYPES.md", category: "pedagogy", roles: ["design", "alignment", "audit"] },
  { path: "chassis/BEAT-TYPES-REVIEW.md", category: "pedagogy", roles: ["design"] },
  { path: "chassis/beat-recipes.md", category: "chassis", roles: ["design"] },
  { path: "chassis/lesson-chassis-notes.md", category: "chassis", roles: ["design"] },
  { path: "chassis/player-face-snippets.md", category: "chassis", roles: ["design", "export"] },
  { path: "identity/ELECTRIC-INK-LOCK.md", category: "identity", roles: ["design", "audit"] },
  { path: "identity/families.md", category: "identity", roles: ["design"] },
  { path: "identity/tokens.css", category: "identity", roles: ["design"], title: "AERO design tokens (tokens.css)" },
  { path: "content/caet-lo-registry.md", category: "objectives", roles: ["alignment", "audit"] },
  { path: "content/objectives.md", category: "objectives", roles: ["alignment"] },
  { path: "content/dc-course-router.md", category: "objectives", roles: ["alignment", "design"] },
  { path: "assessment/ASSESSMENT.md", category: "assessment", roles: ["checks", "audit"] },
  { path: "pedagogy/README.md", category: "pedagogy", roles: ["design"] },
  { path: "pedagogy/01-cognitive-goals.md", category: "pedagogy", roles: ["design", "alignment"] },
  { path: "pedagogy/03-frameworks.md", category: "pedagogy", roles: ["design"] },
  { path: "pedagogy/04-research-foundations.md", category: "pedagogy", roles: ["design"] },
  { path: "pedagogy/05-craft-principles.md", category: "pedagogy", roles: ["design", "phrasing"] },
  { path: "pedagogy/07-vocabulary.md", category: "pedagogy", roles: ["design", "phrasing"] },
  { path: "voice/NICK-VOICE-STYLE-GUIDE.md", category: "voice", roles: ["phrasing", "audit"] },
  { path: "voice/NICK-AET-CERT-BOOK.md", category: "voice", roles: ["phrasing"] },
  { path: "voice/nick-aet-voice.md", category: "voice", roles: ["phrasing"] },
  { path: "voice/voice-examples.md", category: "voice", roles: ["phrasing"] },
  { path: "gold/GOLD-TEARDOWN.md", category: "quality", roles: ["design", "audit"] },
  { path: "tools/quality-gate.py", category: "quality", roles: ["audit"], title: "quality-gate.py (reference gate script)" },
];

function sha(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function titleFromMarkdown(md: string, fallback: string) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1]!.trim() : fallback;
}

export async function readKitFile(rel: string): Promise<string> {
  return fs.readFile(path.join(SEED_KIT_DIR, rel), "utf8");
}

export async function kitCommit(): Promise<string> {
  try {
    const src = await fs.readFile(path.join(process.cwd(), "seed-kit/SOURCE.md"), "utf8");
    return src.match(/commit[:\s`]+([0-9a-f]{7,40})/i)?.[1] ?? "unknown";
  } catch {
    return "unknown";
  }
}

export type SeedSummary = { documents: number; objectives: number; beatTypes: number; qualityRules: number; themeTokens: number };

/** Seed a workspace's Knowledge Library from the vendored kit. Idempotent: existing docs are left alone. */
export async function seedWorkspaceKnowledge(workspaceId: string, userId: string | null): Promise<SeedSummary> {
  const commit = await kitCommit();
  let documents = 0;
  for (const spec of KIT_DOCUMENTS) {
    const existing = await db
      .select({ id: knowledgeDocuments.id })
      .from(knowledgeDocuments)
      .where(and(eq(knowledgeDocuments.workspaceId, workspaceId), eq(knowledgeDocuments.seedPath, spec.path)))
      .limit(1);
    if (existing[0]) continue;
    let content: string;
    try {
      content = await readKitFile(spec.path);
    } catch {
      continue;
    }
    const title = spec.title ?? titleFromMarkdown(content, spec.path);
    const hash = sha(content);
    const [doc] = await db
      .insert(knowledgeDocuments)
      .values({
        workspaceId,
        slug: spec.path.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
        title,
        category: spec.category,
        roles: spec.roles,
        seedPath: spec.path,
        seedCommit: commit,
        baselineSha256: hash,
        currentVersion: 1,
        content,
        contentSha256: hash,
      })
      .returning();
    await db.insert(knowledgeDocumentVersions).values({
      documentId: doc!.id,
      number: 1,
      content,
      contentSha256: hash,
      isBaseline: true,
      note: `Seeded from lesson-factory kit @ ${commit}`,
      createdBy: userId,
    });
    await reindexDocument(doc!.id, workspaceId, content, spec.category, spec.roles);
    documents++;
  }

  // Structured extracts (objectives, beat types, quality rules, theme tokens)
  const docRows = await db.select({ id: knowledgeDocuments.id, seedPath: knowledgeDocuments.seedPath }).from(knowledgeDocuments).where(eq(knowledgeDocuments.workspaceId, workspaceId));
  const docIds = new Map(docRows.filter((d) => d.seedPath).map((d) => [d.seedPath!, d.id]));
  let objCount = 0;
  const registry = await safeRead("content/caet-lo-registry.md");
  if (registry) {
    const parsed = parseObjectiveRegistry(registry);
    for (const o of parsed) {
      const exists = await db.select({ id: objectives.id }).from(objectives).where(and(eq(objectives.workspaceId, workspaceId), eq(objectives.code, o.code))).limit(1);
      if (exists[0]) continue;
      await db.insert(objectives).values({ workspaceId, code: o.code, category: o.category, wording: o.wording, studyGuide: o.studyGuide, bankItems: o.bankItems, sourceDocumentId: docIds.get("content/caet-lo-registry.md") });
      objCount++;
    }
  }

  let btCount = 0;
  const beatTypesMd = await safeRead("chassis/BEAT-TYPES.md");
  if (beatTypesMd) {
    for (const t of parseBeatTypes(beatTypesMd)) {
      const exists = await db.select({ id: beatTypes.id }).from(beatTypes).where(and(eq(beatTypes.workspaceId, workspaceId), eq(beatTypes.key, t.key))).limit(1);
      if (exists[0]) continue;
      await db.insert(beatTypes).values({ workspaceId, ...t, sourceDocumentId: docIds.get("chassis/BEAT-TYPES.md") });
      btCount++;
    }
  }

  let ruleCount = 0;
  const gate = await safeRead("tools/quality-gate.py");
  const rules = parseQualityGate(gate ?? "");
  for (const r of rules) {
    const exists = await db.select({ id: qualityRules.id }).from(qualityRules).where(and(eq(qualityRules.workspaceId, workspaceId), eq(qualityRules.key, r.key))).limit(1);
    if (exists[0]) continue;
    await db.insert(qualityRules).values({ workspaceId, ...r });
    ruleCount++;
  }

  let tokenCount = 0;
  const tokensCss = await safeRead("identity/tokens.css");
  if (tokensCss) {
    for (const t of parseTokensCss(tokensCss)) {
      const exists = await db.select({ id: themeTokens.id }).from(themeTokens).where(and(eq(themeTokens.workspaceId, workspaceId), eq(themeTokens.family, t.family))).limit(1);
      if (exists[0]) continue;
      await db.insert(themeTokens).values({ workspaceId, ...t, sourceRef: "identity/tokens.css" });
      tokenCount++;
    }
  }
  return { documents, objectives: objCount, beatTypes: btCount, qualityRules: ruleCount, themeTokens: tokenCount };
}

async function safeRead(rel: string): Promise<string | null> {
  try {
    return await readKitFile(rel);
  } catch {
    return null;
  }
}

/** Replace the FTS chunks for a document (called on seed and on every new version). */
export async function reindexDocument(documentId: string, workspaceId: string, content: string, category: string, roles: string[]) {
  await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));
  const chunks = chunkMarkdown(content);
  if (!chunks.length) return;
  await db.insert(knowledgeChunks).values(chunks.map((c, i) => ({ documentId, workspaceId, category, roles, ordinal: i, heading: c.heading, content: c.content })));
}
