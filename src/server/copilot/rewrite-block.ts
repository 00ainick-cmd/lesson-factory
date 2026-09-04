import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/server/db/client";
import { copilotRuns, proposals } from "@/server/db/schema";
import { env } from "@/server/env";
import { ApiError } from "@/server/api";
import { recordActivity } from "@/server/activity";
import { findBlock, type LessonDocument } from "@/server/lesson/model";
import { applyOps } from "@/server/lesson/ops";
import { buildProposalDiff } from "./proposals";
import {
  buildRewriteOps,
  collectRewriteUnits,
  mockNoAiSlopRewrite,
  NO_AI_SLOP,
  NO_AI_SLOP_SYSTEM_PROMPT,
  validateRewriteOutput,
  type RewriteOutput,
  type RewriteUnit,
} from "./no-ai-slop";
import { logger } from "@/server/log";

const ModelOutput = z.object({
  rewrites: z.array(z.object({ id: z.string(), content: z.string().max(50_000) })).max(100),
  summary: z.string().min(1).max(800),
});

function parseModelJson(text: string): RewriteOutput {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return ModelOutput.parse(JSON.parse(cleaned));
}

async function callModel(units: RewriteUnit[]): Promise<{ output: RewriteOutput; model: string }> {
  const e = env();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, baseURL: process.env.ANTHROPIC_BASE_URL });
  const response = await client.messages.create({
    model: e.AI_MODEL,
    max_tokens: 3000,
    system: NO_AI_SLOP_SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify({ units }) }],
  });
  const text = response.content.map((item) => (item.type === "text" ? item.text : "")).join("");
  return { output: validateRewriteOutput(units, parseModelJson(text)), model: e.AI_MODEL };
}

export async function createNoAiSlopProposal(input: {
  projectId: string;
  workspaceId: string;
  userId: string;
  doc: LessonDocument;
  workingRevision: number;
  blockId: string;
}) {
  const started = Date.now();
  const location = findBlock(input.doc, input.blockId);
  if (!location) throw new ApiError(404, "Block not found");
  const units = collectRewriteUnits(location.block);
  if (!units.length) throw new ApiError(422, "This block has no safely editable text");

  let provider = env().AI_PROVIDER;
  let model = env().AI_MODEL;
  const assumptions: string[] = [];
  let output: RewriteOutput;
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    try {
      ({ output, model } = await callModel(units));
    } catch (error) {
      logger.warn("no_ai_slop_model_failed", { blockId: input.blockId, error: String(error) });
      provider = "mock";
      model = "rules";
      assumptions.push("Model call failed; used the deterministic no-ai-slop rules.");
      output = mockNoAiSlopRewrite(units);
    }
  } else {
    provider = "mock";
    model = "rules";
    assumptions.push("No model key configured; used the deterministic no-ai-slop rules.");
    output = mockNoAiSlopRewrite(units);
  }

  const { ops, changedUnits } = buildRewriteOps(location.block, units, output);
  const [run] = await db
    .insert(copilotRuns)
    .values({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      userId: input.userId,
      task: "rewrite_block",
      promptVersion: NO_AI_SLOP.promptVersion,
      provider,
      model,
      categories: ["phrasing"],
      sourceChunkIds: [],
      input: { blockId: input.blockId, blockKind: location.block.kind, unitIds: units.map((unit) => unit.id), workingRevision: input.workingRevision, skill: NO_AI_SLOP },
      output: { summary: output.summary, changedUnits },
      assumptions,
      latencyMs: Date.now() - started,
    })
    .returning({ id: copilotRuns.id });

  if (!ops.length) {
    return { created: false as const, message: "No obvious AI-slop patterns were found in this block.", provider, model };
  }

  applyOps(input.doc, ops);
  const { diff } = buildProposalDiff(input.doc, ops);
  const [proposal] = await db
    .insert(proposals)
    .values({
      projectId: input.projectId,
      copilotRunId: run!.id,
      kind: "rewrite",
      title: `De-slop ${location.block.kind} in ${location.beat.label}`,
      explanation: `${output.summary} Review the compiled HTML diff before accepting.`,
      severity: "info",
      ruleKey: "writing.no-ai-slop",
      ruleVersion: 1,
      evidence: {
        blockId: input.blockId,
        beatId: location.beat.id,
        changedUnits,
        skill: NO_AI_SLOP,
        safeguards: ["meaning preserved", "no facts added", "HTML structure preserved", "human acceptance required"],
        provider,
        model,
      },
      patch: ops,
      diff,
      baseRevision: input.workingRevision,
    })
    .returning();

  await recordActivity({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    action: "proposal.create",
    targetType: "proposal",
    targetId: proposal!.id,
    details: { blockId: input.blockId, ruleKey: "writing.no-ai-slop", skillVersion: NO_AI_SLOP.version },
  });

  return {
    created: true as const,
    proposal: { id: proposal!.id, title: proposal!.title, explanation: proposal!.explanation },
    provider,
    model,
  };
}
