import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { assets, projects } from "@/server/db/schema";
import { readArtifact } from "@/server/artifacts";
import { importHtml } from "@/server/lesson/import";
import { recordActivity } from "@/server/activity";
import { enqueueJob } from "@/server/jobs/queue";
import type { JobHandler } from "./index";

const Payload = z.object({ projectId: z.string().uuid(), artifactId: z.string().uuid(), userId: z.string().uuid().nullable().optional(), allowedHosts: z.array(z.string()).optional() });

/**
 * lesson.import: read the immutable original artifact, build the canonical model, and store the
 * working document + import report + source map + asset manifest on the project.
 * The original artifact is never modified (principle 1); we only read it.
 */
export const importHandler: JobHandler = async (raw) => {
  const p = Payload.parse(raw);
  const [project] = await db.select().from(projects).where(eq(projects.id, p.projectId)).limit(1);
  if (!project) throw new Error("Project not found");
  const { row: artifact, body } = await readArtifact(p.artifactId);
  const src = body.toString("utf8");
  const started = Date.now();
  const { document, report } = importHtml(src, { sourceSha256: artifact.sha256, title: project.title, allowedHosts: p.allowedHosts, docId: project.id });
  const sourceMap = buildSourceMap(document);
  await db
    .update(projects)
    .set({
      workingDocument: document,
      workingRevision: sql`${projects.workingRevision} + 1`,
      importReport: report,
      sourceMap,
      assetManifest: report.assets,
      status: "draft",
      updatedAt: new Date(),
    })
    .where(eq(projects.id, project.id));
  await db.delete(assets).where(eq(assets.projectId, project.id));
  if (report.assets.length) {
    await db.insert(assets).values(
      report.assets.map((a) => ({ projectId: project.id, path: a.path, kind: a.kind, status: a.status, url: a.status === "external" ? a.path : null })),
    );
  }
  await recordActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    userId: p.userId ?? null,
    action: "project.import",
    targetType: "artifact",
    targetId: artifact.id,
    details: { sha256: artifact.sha256, beats: report.counts.beats, blocks: report.counts.blocks, warnings: report.warnings.length, ms: Date.now() - started },
  });
  // Import audit follows automatically so the Copilot panel has findings when the editor opens.
  await enqueueJob({ type: "copilot.audit", payload: { projectId: project.id, kind: "import_audit", userId: p.userId ?? null }, workspaceId: project.workspaceId, projectId: project.id, createdBy: p.userId ?? null });
  return { beats: report.counts.beats, blocks: report.counts.blocks, warnings: report.warnings.length };
};

import type { LessonDocument, SourceRef } from "@/server/lesson/model";
import { iterateBlocks } from "@/server/lesson/model";

export type SourceMapEntry = {
  id: string;
  kind: "beat" | "block";
  blockKind?: string;
  classification?: string;
  beatId: string;
  domPath?: string;
  elementId?: string;
  tag?: string;
  classes?: string[];
  lineStart?: number;
  lineEnd?: number;
  startOffset?: number;
  endOffset?: number;
  relatedScripts?: number;
  confidence: number;
};

function fromRef(ref: SourceRef | undefined): Partial<SourceMapEntry> {
  if (!ref) return { confidence: 0 };
  return { domPath: ref.domPath, elementId: ref.elementId, tag: ref.tag, classes: ref.classes, lineStart: ref.lineStart, lineEnd: ref.lineEnd, startOffset: ref.startOffset, endOffset: ref.endOffset, relatedScripts: ref.relatedScripts.length, confidence: ref.confidence };
}

/** Flatten source references from the canonical document into a lookup table (visual <-> source navigation). */
export function buildSourceMap(doc: LessonDocument): SourceMapEntry[] {
  const out: SourceMapEntry[] = [];
  for (const beat of doc.beats) {
    out.push({ id: beat.id, kind: "beat", beatId: beat.id, confidence: 1, ...fromRef(beat.source) });
  }
  for (const { beat, block } of iterateBlocks(doc)) {
    out.push({ id: block.id, kind: "block", blockKind: block.kind, classification: block.classification, beatId: beat.id, confidence: 1, ...fromRef(block.source) });
  }
  return out;
}
