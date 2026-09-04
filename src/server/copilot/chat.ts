/**
 * ID Copilot chat: server-side only, role-aware retrieval, proposal-only edits.
 * The model never writes to the lesson. It may emit ```lfs-proposal JSON blocks that are validated
 * against OpSchema, diffed against the working document, and stored as OPEN proposals for a human.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/server/db/client";
import { copilotRuns, proposals } from "@/server/db/schema";
import { env } from "@/server/env";
import { retrieveChunks, type CopilotRole, type RetrievedChunk } from "@/server/knowledge/retrieval";
import { findBlock, type LessonDocument } from "@/server/lesson/model";
import { OpSchema, applyOps, type Op } from "@/server/lesson/ops";
import { buildProposalDiff } from "./proposals";
import { visibleText } from "./audit";
import { logger } from "@/server/log";

export const PROMPT_VERSION = "id-copilot/1.0.0";

const ROLE_HINTS: { roles: CopilotRole[]; re: RegExp }[] = [
  { roles: ["phrasing"], re: /\b(rewrite|reword|phrase|wording|tone|voice|sentence|paragraph|plain|shorter|tighten|banned|em.?dash|word)\b/i },
  { roles: ["alignment"], re: /\b(objective|caet|align|outcome|cover|coverage|learning goal|lo\b|2\.\d|7\.\d)/i },
  { roles: ["checks"], re: /\b(question|quiz|check|item|assessment|distractor|feedback|score|mastery|pass)\b/i },
  { roles: ["audit"], re: /\b(audit|quality|gate|finding|rule|readiness|accessib|alt text|contrast|a11y)\b/i },
  { roles: ["export"], re: /\b(export|scorm|lms|package|zip|ship|standalone|runtime|bundle)\b/i },
  { roles: ["design"], re: /\b(beat|structure|flow|sequence|layout|theme|token|color|chassis|design|interaction|simulation|lab|frame|deliver|apply|verify|close)\b/i },
];

export function inferRoles(message: string): CopilotRole[] {
  const roles = new Set<CopilotRole>();
  for (const h of ROLE_HINTS) if (h.re.test(message)) h.roles.forEach((r) => roles.add(r));
  if (roles.size === 0) roles.add("design").add("phrasing");
  return [...roles].slice(0, 3); // principle 6: narrow retrieval, never the whole library
}

const ProposalBlock = z.object({ title: z.string().min(1).max(160), explanation: z.string().min(1).max(2000), kind: z.enum(["rewrite", "draft", "structure", "style", "accessibility", "repair"]).default("rewrite"), ops: z.array(OpSchema).min(1).max(20) });

export type ChatInput = {
  workspaceId: string;
  projectId: string | null;
  userId: string;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  doc: LessonDocument | null;
  workingRevision: number;
  selection?: { beatId?: string; blockId?: string };
};

export type ChatResult = {
  runId: string;
  reply: string;
  roles: CopilotRole[];
  sources: { documentId: string; title: string; seedPath: string | null; version: number; heading: string | null }[];
  proposals: { id: string; title: string; explanation: string; kind: string; diff: string }[];
  provider: string;
  model: string;
  assumptions: string[];
};

function contextSummary(doc: LessonDocument | null, selection?: ChatInput["selection"]) {
  if (!doc) return "No lesson is open. Answer from the workspace guidance only.";
  const beats = doc.beats.map((b, i) => `${i + 1}. ${b.label} [${b.typeKey ?? "?"}${b.hidden ? ", hidden" : ""}] blocks=${b.blocks.length}${b.objectiveCodes.length ? " obj=" + b.objectiveCodes.join(",") : ""}`).join("\n");
  let sel = "";
  if (selection?.blockId) {
    const loc = findBlock(doc, selection.blockId);
    if (loc) {
      const b = loc.block;
      const text = b.kind === "heading" || b.kind === "richtext" || b.kind === "callout" ? visibleText(b.html).slice(0, 1200) : b.kind === "image" ? `alt="${b.alt}"` : b.kind === "table" ? b.rows.map((r) => r.cells.map((c) => visibleText(c.html)).join(" | ")).join("\n").slice(0, 1200) : b.kind === "custom" ? `(wrapped custom interaction "${b.label}"; only leaf text/alt edits allowed via leaf-edit ops)` : `(${b.kind})`;
      sel = `\nSELECTED BLOCK id=${b.id} kind=${b.kind} in beat "${loc.beat.label}" (id=${loc.beat.id}):\n${text}`;
    }
  } else if (selection?.beatId) {
    const beat = doc.beats.find((b) => b.id === selection.beatId);
    if (beat) sel = `\nSELECTED BEAT id=${beat.id} "${beat.label}" type=${beat.typeKey} purpose=${beat.purpose ?? "(none)"} objectives=${beat.objectiveCodes.join(",") || "(none)"}`;
  }
  return `LESSON "${doc.title}" (${doc.beats.length} beats, objectives ${doc.objectives.map((o) => o.code).join(", ") || "none"}). Beats:\n${beats}${sel}`;
}

function systemPrompt(sources: RetrievedChunk[], ctx: string) {
  const src = sources.map((s, i) => `[S${i + 1}] ${s.documentTitle} v${s.documentVersion}${s.heading ? " › " + s.heading : ""}\n${s.content}`).join("\n\n");
  return `You are ID Copilot, the instructional-design assistant inside Lesson Factory Studio, an authoring tool for AERO avionics lessons (CAET-aligned, aviation maintenance technicians). Voice: a calm avionics service technician on the hangar floor: direct, concrete, short sentences, no hype, no em dashes, no emojis.

Rules you must follow:
1. You are draft-first and proposal-based. You never change the lesson yourself. When the author wants a change to lesson text, structure, alt text, or headings, produce a PROPOSAL block (format below) and explain it in plain English. The author accepts or rejects it.
2. Ground guidance in the workspace sources below. Cite them inline as [S1], [S2]. If the sources do not cover something, say so and mark it as an assumption.
3. Respect the AERO craft bar in the sources (beat structure FRAME, DELIVER, APPLY, VERIFY, CLOSE; banned phrases; word density; gates; assessment item rules).
4. Keep replies under 250 words unless asked for a plan.
5. Never invent objective codes; use only codes present in the lesson or the sources.

PROPOSAL FORMAT (only when a concrete lesson edit is requested and you know the exact block or beat id). Emit one fenced block per proposal:
\`\`\`lfs-proposal
{"title":"...", "kind":"rewrite|draft|structure|style|accessibility|repair", "explanation":"why, tied to a source", "ops":[ ... ]}
\`\`\`
Allowed ops (JSON): {"type":"update-block","blockId":"...","patch":{"html":"<p>...</p>"}} | {"type":"update-block","blockId":"...","patch":{"alt":"..."}} | {"type":"update-block","blockId":"...","patch":{"level":2}} | {"type":"update-block","blockId":"...","patch":{"label":"..."}} | {"type":"update-beat","beatId":"...","patch":{"purpose":"...","learnerAction":"...","objectiveCodes":["2.4"]}} | {"type":"leaf-edit","blockId":"...","leafIndex":0,"html":"..."} | {"type":"set-block-hidden","blockId":"...","hidden":true} | {"type":"move-block","blockId":"...","direction":"up|down"} | {"type":"set-runtime","standaloneShim":true}
For richtext/callout html keep the same outer tag structure as the original and only change wording.

WORKSPACE SOURCES:
${src || "(no matching sources)"}

CURRENT CONTEXT:
${ctx}`;
}

function extractProposals(text: string): { clean: string; drafts: z.infer<typeof ProposalBlock>[]; errors: string[] } {
  const drafts: z.infer<typeof ProposalBlock>[] = [];
  const errors: string[] = [];
  const clean = text.replace(/```lfs-proposal\s*([\s\S]*?)```/g, (_m, body: string) => {
    try {
      drafts.push(ProposalBlock.parse(JSON.parse(body.trim())));
      return `\n(Proposal drafted; review it in the Proposals list.)\n`;
    } catch (e) {
      errors.push(e instanceof Error ? e.message.split("\n")[0]! : String(e));
      return "\n(A proposal could not be parsed and was discarded.)\n";
    }
  });
  return { clean: clean.trim(), drafts, errors };
}

/** Deterministic offline provider so the product works without an API key. */
function mockReply(input: ChatInput, sources: RetrievedChunk[], roles: CopilotRole[]): string {
  const cite = sources.slice(0, 3).map((_, i) => `[S${i + 1}]`).join(" ");
  const lines: string[] = [];
  const sel = input.selection?.blockId && input.doc ? findBlock(input.doc, input.selection.blockId) : null;
  const wantsRewrite = /\b(rewrite|reword|tighten|shorter|plain|fix)\b/i.test(input.message);
  if (sel && wantsRewrite && (sel.block.kind === "richtext" || sel.block.kind === "callout" || sel.block.kind === "heading")) {
    const html = sel.block.html;
    const next = html.replace(/\s*[—–]\s*/g, ". ").replace(/\. \./g, ".").replace(/\bsimply\b/gi, "").replace(/\s{2,}/g, " ");
    lines.push(`Offline mode: no model key is configured, so this is a rules-based draft ${cite}. I removed dashes and filler and kept the sentence order. Review the diff before accepting.`);
    lines.push("```lfs-proposal\n" + JSON.stringify({ title: `Tighten wording in ${sel.beat.label}`, kind: "rewrite", explanation: "Applies the voice guide: short declarative sentences, no dashes, no filler. Same meaning, same tag structure.", ops: [{ type: "update-block", blockId: sel.block.id, patch: { html: next } }] }) + "\n```");
    return lines.join("\n\n");
  }
  if (sel?.block.kind === "image" && /\balt\b/i.test(input.message)) {
    lines.push(`Offline mode draft ${cite}. Alt text should state what the technician needs to see, not "image of".`);
    lines.push("```lfs-proposal\n" + JSON.stringify({ title: "Draft alt text", kind: "accessibility", explanation: "Describes the component and what to notice, per the accessibility rules.", ops: [{ type: "update-block", blockId: sel.block.id, patch: { alt: `${sel.beat.label}: ${sel.block.alt || "component photo"}. Describe the part and the detail the learner should notice.` } }] }) + "\n```");
    return lines.join("\n\n");
  }
  lines.push(`Offline mode: no model key is configured, so I am answering from the retrieved workspace sources only (${roles.join(", ")}).`);
  for (const [i, s] of sources.slice(0, 3).entries()) lines.push(`[S${i + 1}] ${s.documentTitle}${s.heading ? " › " + s.heading : ""}: ${s.content.replace(/\s+/g, " ").slice(0, 260)}…`);
  if (input.doc) lines.push(`The open lesson "${input.doc.title}" has ${input.doc.beats.length} beats. Select a block in the preview and ask me to rewrite it, draft alt text, or explain a finding, and I will return a proposal you can accept or reject.`);
  return lines.join("\n\n");
}

async function callModel(system: string, history: ChatInput["history"], message: string): Promise<{ text: string; model: string }> {
  const e = env();
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("no-key");
  const client = new Anthropic({ apiKey: key, baseURL: process.env.ANTHROPIC_BASE_URL });
  const msgs = [...history.slice(-8).map((h) => ({ role: h.role, content: h.content })), { role: "user" as const, content: message }];
  const res = await client.messages.create({ model: e.AI_MODEL, max_tokens: 1400, system, messages: msgs });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  return { text, model: e.AI_MODEL };
}

export async function copilotChat(input: ChatInput): Promise<ChatResult> {
  const started = Date.now();
  const roles = inferRoles(input.message);
  const sources = await retrieveChunks({ workspaceId: input.workspaceId, roles, query: input.message, limit: 6 });
  const ctx = contextSummary(input.doc, input.selection);
  const system = systemPrompt(sources, ctx);
  const assumptions: string[] = [];
  let provider = env().AI_PROVIDER;
  let model = env().AI_MODEL;
  let text: string;
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    try {
      ({ text, model } = await callModel(system, input.history, input.message));
    } catch (e) {
      logger.warn("copilot_model_failed", { error: String(e) });
      provider = "mock";
      model = "rules";
      assumptions.push("Model call failed; fell back to offline guidance.");
      text = mockReply(input, sources, roles);
    }
  } else {
    provider = "mock";
    model = "rules";
    assumptions.push("No model key configured; offline rules-based guidance.");
    text = mockReply(input, sources, roles);
  }
  const { clean, drafts, errors } = extractProposals(text);
  assumptions.push(...errors.map((e) => `Discarded malformed proposal: ${e}`));

  const [run] = await db
    .insert(copilotRuns)
    .values({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      userId: input.userId,
      task: "chat",
      promptVersion: PROMPT_VERSION,
      provider,
      model,
      categories: roles,
      sourceChunkIds: sources.map((s) => s.chunkId),
      input: { message: input.message, selection: input.selection ?? null, historyTurns: input.history.length, workingRevision: input.workingRevision },
      output: { reply: clean, proposals: drafts.length },
      assumptions,
      latencyMs: Date.now() - started,
    })
    .returning({ id: copilotRuns.id });

  const created: ChatResult["proposals"] = [];
  if (input.doc && input.projectId) {
    for (const d of drafts) {
      try {
        applyOps(input.doc, d.ops as Op[]); // validate ops against the live document before storing
        const { diff } = buildProposalDiff(input.doc, d.ops as Op[]);
        const [p] = await db
          .insert(proposals)
          .values({
            projectId: input.projectId,
            copilotRunId: run!.id,
            kind: d.kind,
            title: d.title,
            explanation: d.explanation,
            severity: "info",
            evidence: { sources: sources.map((s) => ({ documentId: s.documentId, title: s.documentTitle, version: s.documentVersion, heading: s.heading })), promptVersion: PROMPT_VERSION, provider, model },
            patch: d.ops,
            diff,
            baseRevision: input.workingRevision,
          })
          .returning();
        created.push({ id: p!.id, title: p!.title, explanation: p!.explanation, kind: p!.kind, diff: p!.diff });
      } catch (e) {
        assumptions.push(`Proposal "${d.title}" rejected: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  const seen = new Set<string>();
  const uniqueSources = sources.filter((s) => (seen.has(s.documentId + (s.heading ?? "")) ? false : (seen.add(s.documentId + (s.heading ?? "")), true)));
  return { runId: run!.id, reply: clean, roles, sources: uniqueSources.map((s) => ({ documentId: s.documentId, title: s.documentTitle, seedPath: s.seedPath, version: s.documentVersion, heading: s.heading })), proposals: created, provider, model, assumptions };
}
