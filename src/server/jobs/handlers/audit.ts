import { z } from "zod";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/server/db/client";
import { auditFindings, auditRuns, projects, proposals } from "@/server/db/schema";
import { LessonDocumentSchema } from "@/server/lesson/model";
import type { ImportReport } from "@/server/lesson/import";
import { auditDocument } from "@/server/copilot/audit";
import { buildNoAiSlopAudit } from "@/server/copilot/no-ai-slop";
import { buildProposalDiff } from "@/server/copilot/proposals";
import { recordActivity } from "@/server/activity";
import { logger } from "@/server/log";
import type { JobHandler } from "./index";

const Payload = z.object({ projectId: z.string().uuid(), kind: z.enum(["import_audit", "quality_audit", "writing_check", "export_preflight"]).default("quality_audit"), userId: z.string().uuid().nullable().optional() });

/**
 * copilot.audit: evaluate the workspace's active quality rules against the working document, store an
 * audit run with findings (evidence + rule version), and open one proposal per finding that carries a
 * structured repair. Prior open proposals from earlier runs for the same rule+target are superseded so
 * the list does not accumulate duplicates.
 */
export const auditHandler: JobHandler = async (raw) => {
  const p = Payload.parse(raw);
  const [project] = await db.select().from(projects).where(eq(projects.id, p.projectId)).limit(1);
  if (!project?.workingDocument) throw new Error("Project has no working document");
  const doc = LessonDocumentSchema.parse(project.workingDocument);
  const { findings, summary } = p.kind === "writing_check"
    ? buildNoAiSlopAudit(doc)
    : await auditDocument(project.workspaceId, doc, (project.importReport as ImportReport | null) ?? null);
  const [run] = await db.insert(auditRuns).values({ projectId: project.id, workingRevision: project.workingRevision, kind: p.kind, summary }).returning();

  // Close open proposals from previous audit runs as ignored-by-rerun; still-relevant ones are re-created below.
  const sameAuditFamily = p.kind === "writing_check"
    ? eq(proposals.ruleKey, "writing.no-ai-slop")
    : and(isNotNull(proposals.findingId), ne(proposals.ruleKey, "writing.no-ai-slop"));
  await db.update(proposals).set({ status: "ignored", decidedAt: new Date() }).where(and(eq(proposals.projectId, project.id), eq(proposals.status, "open"), sameAuditFamily));

  let proposalCount = 0;
  for (const f of findings) {
    const [row] = await db
      .insert(auditFindings)
      .values({ runId: run!.id, projectId: project.id, ruleKey: f.ruleKey, ruleVersion: f.ruleVersion, severity: f.severity, title: f.title, message: f.message, evidence: f.evidence, beatId: f.beatId ?? null, blockId: f.blockId ?? null })
      .returning();
    if (!f.proposal) continue;
    try {
      const { diff } = buildProposalDiff(doc, f.proposal.ops);
      await db.insert(proposals).values({
        projectId: project.id,
        findingId: row!.id,
        kind: f.proposal.kind,
        title: f.proposal.title,
        explanation: f.proposal.explanation,
        severity: f.severity,
        ruleKey: f.ruleKey,
        ruleVersion: f.ruleVersion,
        evidence: f.evidence,
        patch: f.proposal.ops,
        diff,
        baseRevision: project.workingRevision,
      });
      proposalCount++;
    } catch (e) {
      logger.warn("proposal_build_failed", { ruleKey: f.ruleKey, error: String(e) });
    }
  }
  await recordActivity({ workspaceId: project.workspaceId, projectId: project.id, userId: p.userId ?? null, action: "audit.run", targetType: "audit_run", targetId: run!.id, details: { kind: p.kind, ...summary.counts, proposals: proposalCount } });
  return { runId: run!.id, findings: findings.length, proposals: proposalCount, summary };
};
