import { iterateBlocks } from "@/server/lesson/model";
import { listLeaves } from "@/server/lesson/leaves";
import { finding, type Finding, type RuleContext, type RuleDefinition, type RuleImpl } from "./types";

const num = (v: unknown, fb: number) => (typeof v === "number" ? v : fb);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

function words(text: string) {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
}

// ---------------------------------------------------------------- writing / style
const writingWordsMin: RuleImpl = (ctx, rule) => {
  const n = words(ctx.text).length;
  const fail = num(rule.params.fail, 1800);
  const warn = num(rule.params.warn, 2400);
  if (n < fail) return [finding(rule, { title: "Lesson is thin", message: `${n} visible words; the floor is ${fail}.`, evidence: { words: n, fail, warn } })];
  if (n < warn) return [finding(rule, { severity: "warning", title: "Below NEETS density band", message: `${n} visible words; the target band starts at ${warn}.`, evidence: { words: n, fail, warn } })];
  return [];
};

const writingFragmentRate: RuleImpl = (ctx, rule) => {
  // Prose lines only (>= 60 chars), mirroring quality-gate.py prose_lines, so UI labels do not count as fragments.
  const prose = ctx.text.split("\n").filter((l) => l.length >= 60).join(" ");
  const sentences = prose.split(/(?<=[.!?])\s+/).filter((s) => words(s).length > 0);
  if (sentences.length < 20) return [];
  const frags = sentences.filter((s) => words(s).length <= 3).length;
  const rate = frags / sentences.length;
  const warn = num(rule.params.warn, 0.22);
  const fail = num(rule.params.fail, 0.3);
  if (rate >= fail) return [finding(rule, { severity: "error", title: "Punch-fragment writing", message: `${(rate * 100).toFixed(0)}% of sentences have three words or fewer.`, evidence: { sentences: sentences.length, fragments: frags, rate } })];
  if (rate >= warn) return [finding(rule, { title: "High fragment rate", message: `${(rate * 100).toFixed(0)}% of sentences have three words or fewer.`, evidence: { sentences: sentences.length, fragments: frags, rate } })];
  return [];
};

function phraseScan(ctx: RuleContext, rule: RuleDefinition, phrases: string[], title: string): Finding[] {
  const out: Finding[] = [];
  const lower = ctx.text.toLowerCase();
  for (const phrase of phrases) {
    const idx = lower.indexOf(phrase.toLowerCase());
    if (idx === -1) continue;
    const snippet = ctx.text.slice(Math.max(0, idx - 60), idx + phrase.length + 60).replace(/\s+/g, " ");
    // locate the block that contains it for a jump target
    let blockId: string | undefined;
    let beatId: string | undefined;
    for (const { beat, block } of iterateBlocks(ctx.doc)) {
      const html = "html" in block ? (block as { html: string }).html : "rawHtml" in block ? (block as { rawHtml: string }).rawHtml : "";
      if (html && html.toLowerCase().includes(phrase.toLowerCase())) {
        blockId = block.id;
        beatId = beat.id;
        break;
      }
    }
    out.push(finding(rule, { title, message: `"${phrase}" appears in the lesson prose.`, evidence: { phrase, snippet }, blockId, beatId }));
  }
  return out;
}
const writingBanned: RuleImpl = (ctx, rule) => phraseScan(ctx, rule, strs(rule.params.phrases), "Banned phrase");
const writingWatch: RuleImpl = (ctx, rule) => phraseScan(ctx, rule, strs(rule.params.phrases), "Watch-list phrase");

const writingEmDash: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  for (const { beat, block } of iterateBlocks(ctx.doc)) {
    if (block.classification !== "managed") continue;
    const html = "html" in block ? (block as { html: string }).html : "";
    if (!html) continue;
    const m = html.match(/[\u2014\u2013]/g);
    if (!m) continue;
    const repaired = html.replace(/\s*\u2014\s*/g, ", ").replace(/(\d)\s*\u2013\s*(\d)/g, "$1 to $2").replace(/\s*\u2013\s*/g, ", ");
    out.push(
      finding(rule, {
        title: `${m.length} dash${m.length > 1 ? "es" : ""} in ${block.kind}`,
        message: "The voice lock forbids em and en dashes. Replace with a comma, a period, or the word 'to' in ranges.",
        evidence: { count: m.length, html: html.slice(0, 300) },
        blockId: block.id,
        beatId: beat.id,
        proposal: { kind: "rewrite", title: "Replace dashes", explanation: "Substitutes commas for em dashes and 'to' for numeric en-dash ranges. Review the phrasing; the substitution is mechanical.", ops: [{ type: "update-block", blockId: block.id, patch: { html: repaired } }] },
      }),
    );
  }
  return out;
};

const styleViewportHeight: RuleImpl = (ctx, rule) => {
  const hits = [...ctx.html.matchAll(/(?<!min-)height\s*:\s*100vh/gi)];
  return hits.length ? [finding(rule, { title: "height:100vh on a container", message: `${hits.length} declaration(s) use height:100vh; use min-height so the player does not clip content.`, evidence: { count: hits.length } })] : [];
};

// ---------------------------------------------------------------- richness
const richnessSvg: RuleImpl = (ctx, rule) => {
  const svgs = ctx.$("svg").length;
  const minutes = Math.max(1, words(ctx.text).length / num(rule.params.wordsPerMinute, 130));
  const perMin = svgs / minutes;
  if (perMin < num(rule.params.fail, 0.35)) return [finding(rule, { severity: "error", title: "Too few bespoke figures", message: `${svgs} SVG figures over ~${minutes.toFixed(0)} minutes (${perMin.toFixed(2)}/min).`, evidence: { svgs, minutes, perMin } })];
  if (perMin < num(rule.params.warn, 0.5)) return [finding(rule, { title: "Figure density is low", message: `${svgs} SVG figures over ~${minutes.toFixed(0)} minutes (${perMin.toFixed(2)}/min).`, evidence: { svgs, minutes, perMin } })];
  return [];
};
const richnessImages: RuleImpl = (ctx, rule) => {
  const imgs = ctx.$("img").length;
  if (imgs <= num(rule.params.failAtOrBelow, 0)) return [finding(rule, { title: "No photographs", message: "Physical-parts lessons need at least one real photograph.", evidence: { imgs } })];
  if (imgs < num(rule.params.warnBelow, 2)) return [finding(rule, { severity: "warning", title: "Few photographs", message: `${imgs} image(s) in the lesson.`, evidence: { imgs } })];
  return [];
};

// ---------------------------------------------------------------- chassis / gates
const gateReadySites: RuleImpl = (ctx, rule) => {
  const sites = (ctx.scriptText.match(/__inkGate\.ready\s*\(/g) ?? []).length;
  const fail = num(rule.params.fail, 3);
  const warn = num(rule.params.warn, 4);
  if (sites < fail) return [finding(rule, { title: "Too few gate-release sites", message: `${sites} __inkGate.ready call sites; ${fail} required.`, evidence: { sites, fail, warn } })];
  if (sites < warn) return [finding(rule, { severity: "warning", title: "Few gate-release sites", message: `${sites} __inkGate.ready call sites.`, evidence: { sites, fail, warn } })];
  return [];
};
const gateGatedBeatsMin: RuleImpl = (ctx, rule) => {
  const gated = ctx.doc.beats.filter((b) => !b.hidden && (b.gate.need ?? 0) > 0);
  const domGated = ctx.$("[data-need]").length;
  const count = Math.max(gated.length, domGated);
  const fail = num(rule.params.fail, 4);
  return count < fail ? [finding(rule, { title: "Too few interaction-gated beats", message: `${count} beats withhold Continue until an interaction; ${fail} required.`, evidence: { gated: gated.map((b) => b.id), domGated, fail } })] : [];
};
const gateReachability: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  const visible = ctx.doc.beats.filter((b) => !b.hidden);
  const ids = new Set(visible.map((b) => b.attrs.id ?? b.id));
  visible.forEach((beat, i) => {
    const isLast = i === visible.length - 1;
    if (beat.gate.clearId && !ids.has(beat.gate.clearId)) {
      out.push(finding(rule, { title: "Gate points at a missing beat", message: `Beat "${beat.label}" clears "${beat.gate.clearId}", which is not a visible beat.`, evidence: { clearId: beat.gate.clearId, beatIds: [...ids] }, beatId: beat.id }));
    }
    if (!isLast && beat.gate.kind === "none") {
      out.push(finding(rule, { severity: "warning", title: "Beat has no Continue path", message: `Beat "${beat.label}" has no gate button; learners cannot advance past it unless a script releases the next beat.`, evidence: { beat: beat.id }, beatId: beat.id }));
    }
    if (isLast && beat.gate.kind !== "completion" && beat.gate.kind !== "none") {
      out.push(finding(rule, { severity: "warning", title: "Sequence does not end in completion", message: `The final beat "${beat.label}" has a ${beat.gate.kind} gate instead of a completion action.`, evidence: { beat: beat.id, gate: beat.gate }, beatId: beat.id }));
    }
  });
  const hiddenTargets = ctx.doc.beats.filter((b) => b.hidden).map((b) => b.attrs.id ?? b.id);
  for (const beat of visible) {
    if (beat.gate.clearId && hiddenTargets.includes(beat.gate.clearId)) {
      out.push(finding(rule, { title: "Gate clears a hidden beat", message: `"${beat.label}" releases a beat that is hidden; the learner will see no next step.`, evidence: { clearId: beat.gate.clearId }, beatId: beat.id }));
    }
  }
  return out;
};

// ---------------------------------------------------------------- assessment
/** Count top-level objects in `ITEMS = [ {...}, {...} ]` (string-aware, mirrors quality-gate.py count_items). */
export function countItemsArray(script: string): number {
  const m = script.match(/\bITEMS\s*=\s*\[/);
  if (!m || m.index === undefined) return 0;
  let i = m.index + m[0].length;
  let depth = 0;
  let n = 0;
  let quote: string | null = null;
  for (; i < script.length; i++) {
    const c = script[i]!;
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") {
      if (depth === 0) n++;
      depth++;
    } else if (c === "}") depth--;
    else if (c === "]" && depth === 0) break;
  }
  return n;
}
const assessItemsMin: RuleImpl = (ctx, rule) => {
  const check = ctx.doc.beats.find((b) => b.typeKey === "check" || b.gate.kind === "check");
  if (!check) return [finding(rule, { title: "No checkpoint beat", message: "The lesson has no check beat.", evidence: {} })];
  const beatHtml = ctx.$(`[data-beat]`).filter((_, el) => ctx.$(el).attr("id") === (check.attrs.id ?? check.id)).first();
  const domItems = beatHtml.find("[data-item], .kc-item, fieldset, [data-q]").length;
  const scriptItems = countItemsArray(ctx.scriptText);
  const items = Math.max(domItems, scriptItems);
  const fail = num(rule.params.fail, 5);
  const out: Finding[] = [];
  if (items < fail) out.push(finding(rule, { title: "Checkpoint is too short", message: `${items} item(s) detected; ${fail} required.`, evidence: { items, domItems, scriptItems, fail }, beatId: check.id }));
  const minChars = num(rule.params.feedbackChars, 50);
  const shortFeedback = [...ctx.scriptText.matchAll(/miss\s*:\s*\[([^\]]*)\]/g)].flatMap((m) => [...m[1]!.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]!)).filter((t) => t.length < minChars);
  if (shortFeedback.length) out.push(finding(rule, { severity: "warning", title: `${shortFeedback.length} thin feedback line(s)`, message: `Per-item teaching lines should be at least ${minChars} characters.`, evidence: { samples: shortFeedback.slice(0, 5), minChars }, beatId: check.id }));
  return out;
};
const assessObjectiveAlignment: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  const registry = new Map(ctx.objectives.map((o) => [o.code, o]));
  const referenced = new Set<string>([...ctx.doc.objectives.map((o) => o.code), ...ctx.doc.beats.flatMap((b) => b.objectiveCodes)]);
  for (const code of referenced) {
    if (!registry.has(code)) out.push(finding(rule, { title: `Objective ${code} not in registry`, message: `The lesson references ${code}, which is not in the workspace CAET registry.`, evidence: { code, registrySize: registry.size } }));
  }
  if (referenced.size === 0) out.push(finding(rule, { title: "No objectives declared", message: "The lesson does not reference any CAET objective code.", evidence: {} }));
  const scored = new Set([...ctx.scriptText.matchAll(/objectiveId\s*:\s*["']([^"']+)["']/g)].map((m) => m[1]!));
  for (const code of referenced) {
    const hit = [...scored].some((s) => s.includes(code));
    if (!hit && scored.size) out.push(finding(rule, { severity: "info", title: `Objective ${code} not scored`, message: `No AeroLesson.score post names ${code}.`, evidence: { code, scored: [...scored] } }));
  }
  return out;
};
const assessScoreValidity: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  for (const m of ctx.scriptText.matchAll(/AeroLesson\.score\s*\(\s*\{([^}]*)\}/g)) {
    const body = m[1]!;
    if (!/objectiveId/.test(body)) out.push(finding(rule, { title: "Score post without objectiveId", message: "A score post does not name an objective.", evidence: { call: body.slice(0, 200) } }));
    const c = body.match(/correct\s*:\s*(\d+)/);
    const t = body.match(/total\s*:\s*(\d+)/);
    if (c && t && Number(c[1]) > Number(t[1])) out.push(finding(rule, { severity: "error", title: "correct > total", message: "A score post has more correct answers than items.", evidence: { call: body.slice(0, 200) } }));
  }
  return out;
};

// ---------------------------------------------------------------- structure
const structDuplicateIds: RuleImpl = (ctx, rule) => {
  const seen = new Map<string, number>();
  ctx.$("[id]").each((_, el) => {
    const id = ctx.$(el).attr("id")!;
    seen.set(id, (seen.get(id) ?? 0) + 1);
  });
  const dups = [...seen].filter(([, n]) => n > 1).map(([id, n]) => ({ id, count: n }));
  return dups.map((d) => finding(rule, { title: `Duplicate id "${d.id}"`, message: `id="${d.id}" appears ${d.count} times.`, evidence: d }));
};
const structBeatTypes: RuleImpl = (ctx, rule) => {
  const present = new Set(ctx.doc.beats.filter((b) => !b.hidden).map((b) => b.typeKey));
  const required = strs(rule.params.required);
  return required.filter((k) => !present.has(k)).map((k) => finding(rule, { title: `No ${k} beat`, message: `A lesson needs a ${k} beat (BEAT-TYPES.md §2).`, evidence: { required, present: [...present] } }));
};
const structBeatSequence: RuleImpl = (ctx, rule) => {
  const order = strs(rule.params.order);
  const phaseOf = new Map(ctx.beatTypes.map((t) => [t.key, t.phase]));
  let maxIdx = -1;
  const out: Finding[] = [];
  for (const beat of ctx.doc.beats.filter((b) => !b.hidden)) {
    const phase = beat.typeKey ? phaseOf.get(beat.typeKey) : undefined;
    if (!phase) continue;
    const idx = order.indexOf(phase);
    if (idx < maxIdx && idx !== -1) out.push(finding(rule, { title: "Beat phase out of order", message: `"${beat.label}" is a ${phase} beat but follows a ${order[maxIdx]} beat.`, evidence: { beat: beat.id, phase, after: order[maxIdx] }, beatId: beat.id }));
    maxIdx = Math.max(maxIdx, idx);
  }
  return out;
};
const structBeatMetadata: RuleImpl = (ctx, rule) => {
  const gaps: { beatId: string; label: string; missing: string[] }[] = [];
  for (const beat of ctx.doc.beats) {
    if (beat.hidden) continue;
    const missing = [!beat.purpose && "purpose", beat.objectiveCodes.length === 0 && "objective link", !beat.learnerAction && "learner action"].filter(Boolean) as string[];
    if (missing.length) gaps.push({ beatId: beat.id, label: beat.label, missing });
  }
  if (!gaps.length) return [];
  return [finding(rule, { title: `${gaps.length} beat(s) lack instructional metadata`, message: "Each beat should declare an explicit learning purpose, objective link, and learner action. Fill these in the beat inspector; ID Copilot can draft them on request.", evidence: { beats: gaps }, beatId: gaps[0]!.beatId })];
};
const sourceMapHealth: RuleImpl = (ctx, rule) => {
  let low = 0;
  let unmapped = 0;
  for (const { block } of iterateBlocks(ctx.doc)) {
    if (!block.source) unmapped++;
    else if (block.source.confidence < 1) low++;
  }
  const lost = ctx.report?.lostRegions.length ?? 0;
  if (!low && !unmapped && !lost) return [];
  return [finding(rule, { title: "Source map has gaps", message: `${unmapped} block(s) without source offsets, ${low} with reduced confidence, ${lost} lost region(s).`, evidence: { unmapped, low, lostRegions: ctx.report?.lostRegions ?? [] } })];
};

// ---------------------------------------------------------------- assets / runtime
const assetsMissingLocal: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  for (const a of ctx.doc.assets.filter((x) => x.status === "missing")) {
    const isScript = a.kind === "script";
    out.push(finding(rule, { severity: isScript ? "error" : "warning", title: `${a.kind} not bundled: ${a.path}`, message: isScript ? "A script file is referenced but not bundled; the export will 404 and any unguarded call into it will throw." : "The file is referenced but not bundled; it will 404 in the export until uploaded.", evidence: { path: a.path, kind: a.kind, referencedBy: a.referencedBy } }));
  }
  return out;
};
const assetsExternalHost: RuleImpl = (ctx, rule) => {
  const allowed = new Set(strs(rule.params.allowedHosts));
  const hosts = new Map<string, number>();
  for (const a of ctx.doc.assets.filter((x) => x.status === "external" && x.host)) hosts.set(a.host!, (hosts.get(a.host!) ?? 0) + 1);
  return [...hosts].filter(([h]) => !allowed.has(h)).map(([h, n]) => finding(rule, { title: `External host ${h}`, message: `${n} reference(s) to a host that is not on the allow list.`, evidence: { host: h, count: n, allowed: [...allowed] } }));
};
const assetsRuntimeGuard: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  const missingScripts = ctx.doc.assets.filter((a) => a.kind === "script" && a.status === "missing");
  if (!missingScripts.length) return out;
  for (const g of strs(rule.params.globals)) {
    const uses = [...ctx.scriptText.matchAll(new RegExp(`\\b${g}\\.(\\w+)`, "g"))];
    if (!uses.length) continue;
    const guarded = new RegExp(`(if\\s*\\([^)]*!?\\s*(window\\.)?${g}\\b[^)]*\\)|typeof\\s+(window\\.)?${g}\\s*[!=]==?\\s*["']undefined["']|(window\\.)?${g}\\s*&&|["']${g}["']\\s+in\\s+window)`).test(ctx.scriptText);
    if (!guarded) {
      out.push(finding(rule, { title: `Unguarded ${g} calls`, message: `${uses.length} call(s) into ${g} but its script is not bundled and no guard was found.`, evidence: { global: g, calls: uses.length, sample: uses.slice(0, 5).map((u) => u[0]) } }));
    } else if (g === "AeroLesson" && !ctx.doc.runtime.standaloneShim) {
      out.push(
        finding(rule, {
          severity: "info",
          title: "Player runtime is not bundled",
          message: `${uses.length} guarded call(s) into AeroLesson. In a standalone export progress and scores are silently dropped unless the standalone runtime shim is enabled.`,
          evidence: { global: g, calls: uses.length, missing: missingScripts.map((s) => s.path) },
          proposal: { kind: "code", title: "Enable the standalone runtime shim", explanation: "Injects a small AeroLesson implementation that records interactions, scores, and completion in localStorage so the standalone HTML behaves like the player. The shim yields to the real runtime if it is present.", ops: [{ type: "set-runtime", standaloneShim: true }] },
        }),
      );
    }
  }
  return out;
};

// ---------------------------------------------------------------- accessibility
const a11yLang: RuleImpl = (ctx, rule) => (ctx.$("html").attr("lang") ? [] : [finding(rule, { title: "Missing lang", message: "<html> has no lang attribute.", evidence: {} })]);
const a11yImgAlt: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  for (const { beat, block } of iterateBlocks(ctx.doc)) {
    if (block.hidden) continue;
    if (block.kind === "image") {
      if (block.imgAttrs.alt === undefined && !block.alt) {
        out.push(finding(rule, { title: "Image without alt", message: `${block.src} has no alt attribute.`, evidence: { src: block.src }, blockId: block.id, beatId: beat.id, proposal: { kind: "accessibility", title: "Add alt text placeholder", explanation: "Adds an alt attribute describing the image by its file name. Replace with a real description.", ops: [{ type: "update-block", blockId: block.id, patch: { alt: humanizeFilename(block.src) } }] } }));
      }
    } else if (block.kind === "custom") {
      const leaves = listLeaves(block.rawHtml).filter((l) => l.kind === "image");
      for (const leaf of leaves) {
        if (leaf.alt === undefined) {
          out.push(finding(rule, { title: "Image without alt (inside custom interaction)", message: `${leaf.src ?? "image"} has no alt attribute.`, evidence: { src: leaf.src, leafIndex: leaf.index }, blockId: block.id, beatId: beat.id, proposal: { kind: "accessibility", title: "Add alt text placeholder", explanation: "Adds an alt attribute via a leaf edit; the interaction markup is otherwise untouched.", ops: [{ type: "leaf-edit", blockId: block.id, leafIndex: leaf.index, alt: humanizeFilename(leaf.src ?? "image") }] } }));
        }
      }
    }
  }
  return out;
};
function humanizeFilename(src: string) {
  const base = src.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "") ?? "image";
  return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
const a11yHeadingOrder: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  const h1 = ctx.$("h1").length;
  if (h1 !== 1) out.push(finding(rule, { title: h1 === 0 ? "No h1" : `${h1} h1 elements`, message: "A lesson should have exactly one h1.", evidence: { h1 } }));
  let prev = 0;
  for (const { beat, block } of iterateBlocks(ctx.doc)) {
    if (block.kind !== "heading" || block.hidden) continue;
    if (prev && block.level > prev + 1) {
      out.push(finding(rule, { title: `Heading skips from h${prev} to h${block.level}`, message: "Heading levels should not skip.", evidence: { from: prev, to: block.level }, blockId: block.id, beatId: beat.id, proposal: { kind: "accessibility", title: `Change to h${prev + 1}`, explanation: "Sets the heading level to the next level in sequence. Visual styling may need a class adjustment.", ops: [{ type: "update-block", blockId: block.id, patch: { level: prev + 1 } }] } }));
    }
    prev = block.level;
  }
  return out;
};
const a11yControlName: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  ctx.$("button, [role=button], input:not([type=hidden]), select, textarea").each((_, el) => {
    const $el = ctx.$(el);
    const name = ($el.text().trim() || $el.attr("aria-label") || $el.attr("aria-labelledby") || $el.attr("title") || $el.attr("placeholder") || (el.tagName === "input" && ctx.$(`label[for="${$el.attr("id")}"]`).length) || $el.closest("label").length || $el.find("img[alt], svg[aria-label], svg title").length) as unknown;
    if (!name) out.push(finding(rule, { title: `Unnamed ${el.tagName}`, message: `A ${el.tagName} has no accessible name.`, evidence: { tag: el.tagName, id: $el.attr("id"), classes: $el.attr("class"), outer: ctx.$.html(el).slice(0, 200) }, blockId: $el.closest("[data-lfs-block]").attr("data-lfs-block") }));
  });
  return out.slice(0, 40);
};
const a11ySvgLabeling: RuleImpl = (ctx, rule) => {
  let n = 0;
  const samples: string[] = [];
  ctx.$("svg").each((_, el) => {
    const $el = ctx.$(el);
    const ok = $el.attr("aria-hidden") === "true" || $el.attr("role") === "presentation" || $el.attr("aria-label") || $el.attr("aria-labelledby") || $el.children("title").length;
    if (!ok) {
      n++;
      if (samples.length < 5) samples.push($el.attr("id") ?? $el.attr("class") ?? "svg");
    }
  });
  return n ? [finding(rule, { title: `${n} unlabeled SVG element(s)`, message: "Inline SVG should be aria-hidden or carry role=img with a title or aria-label.", evidence: { count: n, samples } })] : [];
};
const a11yCanvasFallback: RuleImpl = (ctx, rule) => {
  const out: Finding[] = [];
  ctx.$("canvas").each((_, el) => {
    const $el = ctx.$(el);
    if (!$el.attr("aria-label") && !$el.attr("role") && !$el.text().trim()) out.push(finding(rule, { title: "Canvas without text alternative", message: `canvas#${$el.attr("id") ?? "?"} has no aria-label or fallback content.`, evidence: { id: $el.attr("id") }, blockId: $el.closest("[data-lfs-block]").attr("data-lfs-block") }));
  });
  return out;
};

// ---------------------------------------------------------------- custom interactions
const customEventContract: RuleImpl = (ctx, rule) => {
  const inline: { blockId: string; beatId: string; label: string; interactionIds: string[]; reasons: string[] }[] = [];
  for (const { beat, block } of iterateBlocks(ctx.doc)) {
    if (block.kind !== "custom" || block.hidden) continue;
    if ((block.eventContract?.declared ?? []).length === 0) inline.push({ blockId: block.id, beatId: beat.id, label: block.label, interactionIds: block.interactionIds, reasons: block.reasons });
  }
  if (!inline.length) return [];
  return [finding(rule, { title: `${inline.length} wrapped custom interaction(s) run inline`, message: "These regions are preserved verbatim as Custom Interactive Beats driven by the lesson's own script. They declare no interaction:* postMessage contract, so the Studio treats them as trusted-inline: edits are limited to text and alt leaves, and their scripts run only inside the sandboxed preview.", evidence: { interactions: inline }, blockId: inline[0]!.blockId, beatId: inline[0]!.beatId })];
};

// ---------------------------------------------------------------- export readiness (summary, computed by the runner)
export const RULES: Record<string, RuleImpl> = {
  "writing.words-min": writingWordsMin,
  "writing.fragment-rate": writingFragmentRate,
  "writing.banned-phrases": writingBanned,
  "writing.watch-phrases": writingWatch,
  "writing.em-dash": writingEmDash,
  "style.viewport-height": styleViewportHeight,
  "richness.svg-per-minute": richnessSvg,
  "richness.images-min": richnessImages,
  "gate.ready-sites": gateReadySites,
  "gate.gated-beats-min": gateGatedBeatsMin,
  "gate.reachability": gateReachability,
  "assess.items-min": assessItemsMin,
  "assess.objective-alignment": assessObjectiveAlignment,
  "assess.score-validity": assessScoreValidity,
  "struct.duplicate-ids": structDuplicateIds,
  "struct.beat-types": structBeatTypes,
  "struct.beat-sequence": structBeatSequence,
  "struct.beat-metadata": structBeatMetadata,
  "assets.missing-local": assetsMissingLocal,
  "assets.external-host": assetsExternalHost,
  "assets.runtime-guard": assetsRuntimeGuard,
  "a11y.lang": a11yLang,
  "a11y.img-alt": a11yImgAlt,
  "a11y.heading-order": a11yHeadingOrder,
  "a11y.control-name": a11yControlName,
  "a11y.svg-labeling": a11ySvgLabeling,
  "a11y.canvas-fallback": a11yCanvasFallback,
  "custom.event-contract": customEventContract,
  "sourcemap.health": sourceMapHealth,
};
