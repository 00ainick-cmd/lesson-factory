import * as parse5 from "parse5";
import type { DefaultTreeAdapterTypes as T } from "parse5";
import { iterateBlocks, type Block, type LessonDocument } from "@/server/lesson/model";
import { listLeaves } from "@/server/lesson/leaves";
import { escapeHtml, isElement, isText, type Node } from "@/server/lesson/import/dom";
import type { Op } from "@/server/lesson/ops";
import type { Finding } from "@/server/copilot/rules/types";

/**
 * Adapted from Peter Yang's MIT-licensed no-ai-slop skill.
 * Source: https://github.com/petergyang/no-ai-slop
 */
export const NO_AI_SLOP = {
  name: "no-ai-slop",
  version: "000650b156983f5159695b441477f4e63b25dc85",
  source: "https://github.com/petergyang/no-ai-slop",
  promptVersion: "no-ai-slop/block-rewrite/1.0.0",
} as const;

export type RewriteUnit = {
  id: string;
  label: string;
  format: "text" | "html";
  content: string;
};

export type RewriteOutput = {
  rewrites: { id: string; content: string }[];
  summary: string;
};

const BANNED_REPLACEMENTS: [RegExp, string][] = [
  [/\bdelving\b/gi, "examining"],
  [/\bdelves\b/gi, "examines"],
  [/\bdelved\b/gi, "examined"],
  [/\bdelve\b/gi, "examine"],
  [/\bfostering\b/gi, "building"],
  [/\bfosters\b/gi, "builds"],
  [/\bfostered\b/gi, "built"],
  [/\bfoster\b/gi, "build"],
  [/\bleveraging\b/gi, "using"],
  [/\bleverages\b/gi, "uses"],
  [/\bleveraged\b/gi, "used"],
  [/\bleverage\b/gi, "use"],
  [/\butilizing\b/gi, "using"],
  [/\butilizes\b/gi, "uses"],
  [/\butilized\b/gi, "used"],
  [/\butilize\b/gi, "use"],
  [/\bfacilitating\b/gi, "helping"],
  [/\bfacilitates\b/gi, "helps"],
  [/\bfacilitated\b/gi, "helped"],
  [/\bfacilitate\b/gi, "help"],
  [/\bempowering\b/gi, "enabling"],
  [/\bempowers\b/gi, "enables"],
  [/\bempowered\b/gi, "enabled"],
  [/\bempower\b/gi, "enable"],
  [/\bstreamlining\b/gi, "simplifying"],
  [/\bstreamlines\b/gi, "simplifies"],
  [/\bstreamlined\b/gi, "simplified"],
  [/\bstreamline\b/gi, "simplify"],
  [/\brobust\b/gi, "reliable"],
  [/\bcutting-edge\b/gi, "new"],
  [/\bparadigm shift\b/gi, "change"],
  [/\bgame changer\b/gi, "major change"],
  [/\bmultifaceted\b/gi, "complex"],
  [/\bmeticulous\b/gi, "careful"],
  [/\bintricate\b/gi, "detailed"],
  [/\bparamount\b/gi, "critical"],
  [/\btransformative\b/gi, "substantial"],
  [/\belevates\b/gi, "improves"],
  [/\belevated\b/gi, "improved"],
  [/\belevating\b/gi, "improving"],
  [/\belevate\b/gi, "improve"],
  [/\bembarks\b/gi, "begins"],
  [/\bembarked\b/gi, "began"],
  [/\bembarking\b/gi, "beginning"],
  [/\bembark\b/gi, "begin"],
  [/\bsupercharges\b/gi, "improves"],
  [/\bsupercharged\b/gi, "improved"],
  [/\bsupercharging\b/gi, "improving"],
  [/\bsupercharge\b/gi, "improve"],
  [/\bharnesses\b/gi, "uses"],
  [/\bharnessed\b/gi, "used"],
  [/\bharnessing\b/gi, "using"],
  [/\bharness\b/gi, "use"],
  [/\bever-evolving\b/gi, "changing"],
];

const EMPTY_OPENERS = [
  /\b(?:it's|it is) worth noting(?: that)?\s*/gi,
  /\b(?:it's|it is) important to note(?: that)?\s*/gi,
  /\bat the end of the day,\s*/gi,
  /\bwhen it comes to\s+/gi,
  /\bat its core,\s*/gi,
  /\bin today'?s world,\s*/gi,
  /\bin the age of\s+/gi,
  /\bthe reality is(?: that)?\s*/gi,
  /\bthe truth is(?: that)?\s*/gi,
  /\bin order to\s+/gi,
  /\bgoing forward,\s*/gi,
  /\blet'?s dive in\.?\s*/gi,
  /\bhere'?s the thing[:,]?\s*/gi,
  /\blet me be clear[:,]?\s*/gi,
  /\bthe key point is(?: that)?\s*/gi,
  /\bas you can see,\s*/gi,
];

export const NO_AI_SLOP_SYSTEM_PROMPT = `You are a sharp human editor applying the no-ai-slop skill to one lesson block.

Make the minimum effective edit. Preserve the writer's meaning, facts, technical terms, vocabulary, cadence, uncertainty, and useful edge. Leave strong human sentences alone. Do not add claims, examples, statistics, sources, opinions, or technical details.

Prefer direct verbs, active voice, concrete wording, and natural sentence variation. Remove empty throat-clearing, faux-insight setups, importance puffery, interpretive commentary, unsupported attribution, synonym cycling, dramatic fragments, recap endings, decorative em dashes, and robotic symmetry. Avoid these inflated words: delve, foster, leverage, utilize, facilitate, empower, streamline, robust, cutting-edge, paradigm shift, game changer, tapestry, realm, beacon, multifaceted, meticulous, intricate, paramount, transformative, elevate, embark, supercharge, harness, ever-evolving.

You will receive JSON units. Return JSON only:
{"rewrites":[{"id":"same id","content":"revised content"}],"summary":"short explanation"}

Return every input id exactly once and no new ids. For format "html", preserve every element, attribute, comment, and their nesting exactly; change text only. Do not translate. If the text already sounds natural, return it unchanged.`;

function hasMeaningfulText(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length > 0;
}

export function collectRewriteUnits(block: Block): RewriteUnit[] {
  const units: RewriteUnit[] = [];
  const add = (id: string, label: string, format: "text" | "html", content: string | undefined) => {
    if (content !== undefined && hasMeaningfulText(content)) units.push({ id, label, format, content });
  };
  switch (block.kind) {
    case "heading":
    case "richtext":
    case "callout":
      add("html", "Block text", "html", block.html);
      break;
    case "image":
      add("alt", "Image alt text", "text", block.alt);
      add("captionHtml", "Image caption", "html", block.captionHtml);
      break;
    case "table":
      add("captionHtml", "Table caption", "html", block.captionHtml);
      block.rows.forEach((row, ri) => row.cells.forEach((cell, ci) => add(`cell:${ri}:${ci}`, `Row ${ri + 1}, cell ${ci + 1}`, "html", cell.html)));
      break;
    case "button":
      add("label", "Button label", "text", block.label);
      break;
    case "custom": {
      const leaves = listLeaves(block.rawHtml, new Set(block.interactionIds));
      for (const leaf of leaves) {
        if (leaf.scripted) continue;
        if (leaf.kind === "text") add(`leaf:${leaf.index}:html`, `<${leaf.tag}> text`, "html", leaf.html);
        else add(`leaf:${leaf.index}:alt`, "Image alt text", "text", leaf.alt);
      }
      break;
    }
    default:
      break;
  }
  return units;
}

function walkNodes(node: Node, visit: (node: Node) => void) {
  visit(node);
  if ("childNodes" in node) {
    for (const child of (node as T.ParentNode).childNodes) walkNodes(child, visit);
  }
}

function htmlStructure(html: string): string {
  const fragment = parse5.parseFragment(html, { sourceCodeLocationInfo: true });
  const parts: string[] = [];
  for (const child of fragment.childNodes) {
    walkNodes(child, (node) => {
      if (isElement(node)) {
        const attrs = [...node.attrs].map((a) => `${a.name}=${a.value}`).sort().join("|");
        parts.push(`<${node.tagName} ${attrs}>`);
      } else if (isText(node)) {
        parts.push("#text");
      } else if (node.nodeName === "#comment") {
        parts.push(`<!--${(node as T.CommentNode).data}-->`);
      }
    });
  }
  return parts.join("");
}

export function validateRewriteOutput(units: RewriteUnit[], output: RewriteOutput): RewriteOutput {
  const expected = new Map(units.map((u) => [u.id, u]));
  if (output.rewrites.length !== units.length) throw new Error("Rewrite response did not return every content unit");
  const seen = new Set<string>();
  for (const rewrite of output.rewrites) {
    const original = expected.get(rewrite.id);
    if (!original || seen.has(rewrite.id)) throw new Error(`Unexpected or duplicate rewrite id: ${rewrite.id}`);
    seen.add(rewrite.id);
    if (original.format === "html" && htmlStructure(original.content) !== htmlStructure(rewrite.content)) {
      throw new Error(`Rewrite changed HTML structure for ${original.label}`);
    }
  }
  return output;
}

function rewritePlainText(input: string): string {
  let text = input;
  const startsWithEmptyOpener = EMPTY_OPENERS.some((pattern) => new RegExp(pattern.source, pattern.flags.replace("g", "")).test(text.trimStart()));
  for (const [pattern, replacement] of BANNED_REPLACEMENTS) {
    text = text.replace(pattern, (match) => (/^[A-Z]/.test(match) ? replacement[0]!.toUpperCase() + replacement.slice(1) : replacement));
  }
  for (const pattern of EMPTY_OPENERS) text = text.replace(pattern, "");
  text = text
    .replace(/\s*[—–]\s*/g, ". ")
    .replace(/\b(?:in conclusion|ultimately|overall),\s*/gi, "")
    .replace(/[ \t]{2,}/g, " ");
  if (startsWithEmptyOpener) text = text.replace(/^(\s*)([a-z])/, (_match, whitespace: string, letter: string) => whitespace + letter.toUpperCase());
  return text;
}

function rewriteHtmlText(html: string): string {
  const fragment = parse5.parseFragment(html, { sourceCodeLocationInfo: true });
  const edits: { start: number; end: number; value: string }[] = [];
  for (const child of fragment.childNodes) {
    walkNodes(child, (node) => {
      if (!isText(node) || !node.value.trim()) return;
      const loc = node.sourceCodeLocation;
      if (!loc) return;
      const leading = node.value.match(/^\s*/)?.[0] ?? "";
      const trailing = node.value.match(/\s*$/)?.[0] ?? "";
      const core = node.value.slice(leading.length, node.value.length - trailing.length);
      const rewritten = rewritePlainText(core);
      edits.push({ start: loc.startOffset, end: loc.endOffset, value: leading + escapeHtml(rewritten) + trailing });
    });
  }
  return edits.sort((a, b) => b.start - a.start).reduce((result, edit) => result.slice(0, edit.start) + edit.value + result.slice(edit.end), html);
}

export function mockNoAiSlopRewrite(units: RewriteUnit[]): RewriteOutput {
  return {
    rewrites: units.map((unit) => ({ id: unit.id, content: unit.format === "html" ? rewriteHtmlText(unit.content) : rewritePlainText(unit.content) })),
    summary: "Removed inflated wording and empty setup while preserving the original facts, order, and HTML structure.",
  };
}

export function buildRewriteOps(block: Block, units: RewriteUnit[], output: RewriteOutput): { ops: Op[]; changedUnits: string[] } {
  validateRewriteOutput(units, output);
  const originals = new Map(units.map((unit) => [unit.id, unit]));
  const changed = output.rewrites.filter((rewrite) => originals.get(rewrite.id)?.content !== rewrite.content);
  if (!changed.length) return { ops: [], changedUnits: [] };

  if (block.kind === "custom") {
    const ops: Op[] = changed.map((rewrite) => {
      const [, index, field] = rewrite.id.split(":");
      if (index === undefined || (field !== "html" && field !== "alt")) throw new Error(`Invalid custom leaf rewrite id: ${rewrite.id}`);
      return field === "html"
        ? { type: "leaf-edit", blockId: block.id, leafIndex: Number(index), html: rewrite.content }
        : { type: "leaf-edit", blockId: block.id, leafIndex: Number(index), alt: rewrite.content };
    });
    return { ops, changedUnits: changed.map((r) => originals.get(r.id)!.label) };
  }

  const patch: Record<string, unknown> = {};
  for (const rewrite of changed) {
    if (block.kind === "table" && rewrite.id.startsWith("cell:")) {
      const [, rowIndex, cellIndex] = rewrite.id.split(":").map(Number);
      const rows = (patch.rows as typeof block.rows | undefined) ?? structuredClone(block.rows);
      const cell = rows[rowIndex!]?.cells[cellIndex!];
      if (!cell) throw new Error(`Invalid table cell rewrite id: ${rewrite.id}`);
      cell.html = rewrite.content;
      patch.rows = rows;
    } else {
      patch[rewrite.id] = rewrite.content;
    }
  }
  return {
    ops: [{ type: "update-block", blockId: block.id, patch } as Op],
    changedUnits: changed.map((r) => originals.get(r.id)!.label),
  };
}

type WritingPattern = { name: string; regex: RegExp; fix: string; safeToRewrite: boolean };

const WRITING_PATTERNS: WritingPattern[] = [
  { name: "empty opener", regex: /\b(?:(?:it is|it's) (?:important|worth) to note(?: that)?|here'?s the thing|let me be clear|the key point is(?: that)?)\b/gi, fix: "Start with the point.", safeToRewrite: true },
  { name: "empty phrase", regex: /\b(?:at the end of the day|when it comes to|at its core|in today'?s world|in the age of|the reality is(?: that)?|the truth is(?: that)?|in order to|going forward|let'?s dive in)\b/gi, fix: "Remove the setup.", safeToRewrite: true },
  { name: "banned word", regex: /\b(?:delv(?:e|es|ed|ing)|foster(?:s|ed|ing)?|leverag(?:e|es|ed|ing)|utiliz(?:e|es|ed|ing)|facilitat(?:e|es|ed|ing)|empower(?:s|ed|ing)?|streamlin(?:e|es|ed|ing)|robust|cutting-edge|paradigm shift|game changer|multifaceted|meticulous|intricate|paramount|transformative|elevat(?:e|es|ed|ing)|embark(?:s|ed|ing)?|supercharg(?:e|es|ed|ing)|harness(?:es|ed|ing)?|ever-evolving)\b/gi, fix: "Use a direct verb or concrete fact.", safeToRewrite: true },
  { name: "weasel attribution", regex: /\b(?:experts agree|industry reports suggest|many argue|widely regarded as|studies show)\b/gi, fix: "Name the source or remove the claim.", safeToRewrite: false },
  { name: "faux insight", regex: /\b(?:this is the part most people skip|what most people get wrong|here'?s what nobody tells you|the part everyone misses)\b/gi, fix: "State the claim directly.", safeToRewrite: false },
  { name: "summary ending", regex: /\b(?:in conclusion|ultimately|overall)\b/gi, fix: "End on the concrete takeaway.", safeToRewrite: true },
];

function unitText(unit: RewriteUnit): string {
  if (unit.format === "text") return unit.content;
  const fragment = parse5.parseFragment(unit.content);
  const text: string[] = [];
  for (const child of fragment.childNodes) {
    walkNodes(child, (node) => {
      if (isText(node)) text.push(node.value);
    });
  }
  return text.join(" ");
}

/** Scan the editable text in every managed block and produce Grammarly-style findings. */
export function scanNoAiSlopDocument(doc: LessonDocument): Finding[] {
  const findings: Finding[] = [];
  for (const { beat, block } of iterateBlocks(doc)) {
    if (block.hidden || block.classification !== "managed") continue;
    const units = collectRewriteUnits(block);
    if (!units.length) continue;
    const issues: { pattern: string; quote: string; fix: string; autoFixable: boolean }[] = [];
    for (const unit of units) {
      const text = unitText(unit);
      for (const pattern of WRITING_PATTERNS) {
        pattern.regex.lastIndex = 0;
        for (const match of text.matchAll(pattern.regex)) {
          issues.push({ pattern: pattern.name, quote: match[0], fix: pattern.fix, autoFixable: pattern.safeToRewrite });
        }
      }
    }
    if (!issues.length) continue;

    const output = mockNoAiSlopRewrite(units);
    const { ops, changedUnits } = buildRewriteOps(block, units, output);
    const patterns = [...new Set(issues.map((issue) => issue.pattern))];
    findings.push({
      ruleKey: "writing.no-ai-slop",
      ruleVersion: 1,
      severity: "warning",
      title: `${issues.length} writing issue${issues.length === 1 ? "" : "s"} in ${block.kind}`,
      message: issues.map((issue) => `“${issue.quote}”: ${issue.fix}`).join(" "),
      evidence: { blockId: block.id, patterns, issues, changedUnits, skill: NO_AI_SLOP },
      blockId: block.id,
      beatId: beat.id,
      ...(ops.length
        ? {
            proposal: {
              kind: "rewrite" as const,
              title: "Remove AI-sounding phrasing",
              explanation: "Makes the minimum safe text edit while preserving the lesson's facts and HTML structure.",
              ops,
            },
          }
        : {}),
    });
  }
  return findings;
}

export function buildNoAiSlopAudit(doc: LessonDocument) {
  const started = Date.now();
  const findings = scanNoAiSlopDocument(doc);
  return {
    findings,
    summary: {
      auditVersion: "no-ai-slop/1.0.0",
      rulesEvaluated: 1,
      rulesSkipped: [],
      counts: { error: 0, warning: findings.length, info: 0 },
      exportReady: true,
      durationMs: Date.now() - started,
    },
  };
}
