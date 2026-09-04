import { createTwoFilesPatch } from "diff";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { projects, proposals } from "@/server/db/schema";
import { compileLesson, renderBlock } from "@/server/lesson/compile";
import { LessonDocumentSchema, findBlock, type LessonDocument } from "@/server/lesson/model";
import { applyOps, OpSchema, type Op } from "@/server/lesson/ops";
import { recordActivity } from "@/server/activity";
import { ApiError } from "@/server/api";
import { z } from "zod";
import { assertProposalRevision, StaleProposalError } from "./proposal-revision";

/**
 * A proposal is a set of canonical ops plus a unified diff of the affected region's HTML so a reviewer
 * can see exactly what would change. Nothing is applied until a human accepts (principle 7).
 */
export function buildProposalDiff(before: LessonDocument, ops: Op[]): { after: LessonDocument; diff: string; previewHtml: string } {
  const after = applyOps(before, ops);
  const targetIds = new Set<string>();
  for (const op of ops) if ("blockId" in op) targetIds.add(op.blockId);
  let beforeHtml: string;
  let afterHtml: string;
  if (targetIds.size) {
    beforeHtml = [...targetIds].map((id) => blockHtml(before, id)).join("\n");
    afterHtml = [...targetIds].map((id) => blockHtml(after, id)).join("\n");
  } else {
    beforeHtml = compileLesson(before, { mode: "export" });
    afterHtml = compileLesson(after, { mode: "export" });
  }
  const diff = createTwoFilesPatch("before.html", "after.html", beforeHtml, afterHtml, "", "", { context: 3 });
  return { after, diff, previewHtml: afterHtml };
}

function blockHtml(doc: LessonDocument, blockId: string): string {
  const hit = findBlock(doc, blockId);
  if (!hit) return "";
  return renderBlock(hit.block, { mode: "export" });
}

export const ProposalDecision = z.object({ decision: z.enum(["accept", "reject", "ignore"]), editedOps: z.array(OpSchema).optional() });

/**
 * Apply a proposal to the project's working document with optimistic concurrency. The user may edit the
 * ops before accepting (editedOps); the stored proposal keeps the original for provenance.
 */
export async function decideProposal(input: { proposalId: string; projectId: string; userId: string; decision: "accept" | "reject" | "ignore"; editedOps?: Op[] }) {
  const [prop] = await db.select().from(proposals).where(and(eq(proposals.id, input.proposalId), eq(proposals.projectId, input.projectId))).limit(1);
  if (!prop) throw new Error("Proposal not found");
  if (prop.status !== "open") throw new Error(`Proposal already ${prop.status}`);
  const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
  if (!project) throw new Error("Project not found");
  let newRevision = project.workingRevision;
  if (input.decision === "accept") {
    try {
      assertProposalRevision(prop.baseRevision, project.workingRevision);
    } catch (error) {
      if (error instanceof StaleProposalError) throw new ApiError(409, error.message, { revision: project.workingRevision });
      throw error;
    }
    const doc = LessonDocumentSchema.parse(project.workingDocument);
    const ops = input.editedOps ?? (prop.patch as Op[]);
    const provenance = { origin: "copilot" as const, proposalId: prop.id, copilotRunId: prop.copilotRunId ?? undefined, userId: input.userId, at: new Date().toISOString() };
    const next = applyOps(doc, ops, { provenance });
    const updated = await db
      .update(projects)
      .set({ workingDocument: next, workingRevision: project.workingRevision + 1, updatedAt: new Date() })
      .where(and(eq(projects.id, project.id), eq(projects.workingRevision, project.workingRevision)))
      .returning({ workingRevision: projects.workingRevision });
    if (!updated[0]) throw new Error("Working document changed while accepting; reload and retry");
    newRevision = updated[0].workingRevision;
  }
  const status = input.decision === "accept" ? "accepted" : input.decision === "reject" ? "rejected" : "ignored";
  await db.update(proposals).set({ status, decidedBy: input.userId, decidedAt: new Date(), ...(input.editedOps ? { patch: input.editedOps } : {}) }).where(eq(proposals.id, prop.id));
  await recordActivity({ workspaceId: project.workspaceId, projectId: project.id, userId: input.userId, action: `proposal.${input.decision}`, targetType: "proposal", targetId: prop.id, details: { ruleKey: prop.ruleKey, edited: Boolean(input.editedOps), workingRevision: newRevision } });
  return { status, workingRevision: newRevision };
}
