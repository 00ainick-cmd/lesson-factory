import { nanoid } from "nanoid";
import {
  attr,
  attrsMap,
  classList,
  elementChildren,
  find,
  findAll,
  hasClass,
  isComment,
  isElement,
  isText,
  outerHtml,
  parseHtml,
  textContent,
  type Element,
  type Node,
} from "./dom";
import { collectScripts, ScriptIndex } from "./scripts";
import { CHASSIS, classifyElement, makeSourceRef, splitBeatIntoBlocks, type ClassifyContext } from "./classify";
import { LessonDocumentSchema, type AssetRef, type Beat, type Block, type LessonDocument } from "../model";

export type ImportWarning = { code: string; severity: "info" | "warning" | "error"; message: string; where?: string };

export type ImportReport = {
  importerVersion: string;
  sourceSha256: string;
  sourceBytes: number;
  sourceLines: number;
  chassis: { profile: string; confidence: number; signals: string[] };
  counts: {
    beats: number;
    blocks: number;
    byClassification: Record<string, number>;
    byKind: Record<string, number>;
    scriptsInline: number;
    scriptsExternal: number;
    styles: number;
    svgs: number;
    canvases: number;
    images: number;
    tables: number;
    ids: number;
    inlineHandlers: number;
  };
  assets: AssetRef[];
  externalHosts: { host: string; allowed: boolean; count: number }[];
  duplicateIds: string[];
  warnings: ImportWarning[];
  objectivesDetected: string[];
  gateSummary: { beatId: string; kind: string; need?: number; clearId?: string }[];
  lostRegions: { where: string; reason: string }[]; // regions the compiler could not round-trip
};

export const IMPORTER_VERSION = "1.0.0";
export const DEFAULT_ALLOWED_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

const ASSET_KIND: Record<string, AssetRef["kind"]> = {
  img: "image",
  audio: "audio",
  video: "video",
  source: "other",
  script: "script",
  link: "style",
};

function assetKindFor(el: Element, path: string): AssetRef["kind"] {
  if (el.tagName === "link") {
    const rel = attr(el, "rel") ?? "";
    if (rel.includes("icon")) return "image";
    if (rel.includes("preconnect") || rel.includes("dns-prefetch")) return "other";
    return "style";
  }
  if (el.tagName === "source") {
    const parent = el.parentNode && isElement(el.parentNode as Node) ? (el.parentNode as Element).tagName : "";
    if (parent === "audio") return "audio";
    if (parent === "video") return "video";
    if (/\.(mp3|wav|ogg|m4a)$/i.test(path)) return "audio";
    return "image";
  }
  return ASSET_KIND[el.tagName] ?? "other";
}

function statusFor(path: string): { status: AssetRef["status"]; host?: string } {
  if (path.startsWith("data:") || path.startsWith("blob:")) return { status: "inline" };
  if (/^(https?:)?\/\//i.test(path)) {
    try {
      return { status: "external", host: new URL(path, "https://x.invalid").host };
    } catch {
      return { status: "external" };
    }
  }
  return { status: "missing" }; // single-file import: any relative path is not bundled
}

export function collectAssets(doc: ReturnType<typeof parseHtml>, src: string, allowedHosts: Set<string>, ownerOf: (el: Element) => string): AssetRef[] {
  const out = new Map<string, AssetRef>();
  const push = (path: string, kind: AssetRef["kind"], owner: string) => {
    if (!path) return;
    const { status, host } = statusFor(path);
    const existing = out.get(path);
    if (existing) {
      if (!existing.referencedBy.includes(owner)) existing.referencedBy.push(owner);
      return;
    }
    out.set(path, { path, kind, status, referencedBy: [owner], host, allowed: host ? allowedHosts.has(host) : undefined });
  };
  for (const el of findAll(doc, (e) => ["img", "audio", "video", "source", "script", "link"].includes(e.tagName))) {
    const p = attr(el, el.tagName === "link" ? "href" : "src");
    if (p) push(p, assetKindFor(el, p), ownerOf(el));
    const srcset = attr(el, "srcset");
    if (srcset) for (const part of srcset.split(",")) push(part.trim().split(/\s+/)[0] ?? "", "image", ownerOf(el));
  }
  for (const style of findAll(doc, (e) => e.tagName === "style")) {
    const css = textContent(style);
    for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      const p = m[1]!;
      push(p, /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(p) ? "font" : "image", "head");
    }
    for (const m of css.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/g)) push(m[1]!, "style", "head");
  }
  return [...out.values()];
}

function detectChassis(doc: ReturnType<typeof parseHtml>, scripts: ScriptIndex) {
  const signals: string[] = [];
  if (find(doc, (e) => e.tagName === "nav" && attr(e, "id") === "ldock")) signals.push("nav#ldock");
  if (findAll(doc, (e) => attr(e, "data-beat") !== undefined).length) signals.push("[data-beat] sections");
  if (find(doc, (e) => hasClass(e, CHASSIS.gateBarClass))) signals.push(".gatebar");
  if (find(doc, (e) => hasClass(e, CHASSIS.gateButtonClass) && attr(e, "data-clear") !== undefined)) signals.push(".gate-next[data-clear]");
  if (scripts.globals.has("__inkGate") || scripts.scripts.some((s) => s.text.includes("__inkGate"))) signals.push("__inkGate");
  if (find(doc, (e) => attr(e, "id") === "check")) signals.push("#check");
  if (scripts.scripts.some((s) => s.text.includes("AeroLesson"))) signals.push("AeroLesson runtime calls");
  if (find(doc, (e) => attr(e, "id") === "markComplete")) signals.push("#markComplete");
  const confidence = Math.min(1, signals.length / 6);
  return { profile: confidence >= 0.5 ? "electric-ink" : "generic-html", confidence, signals };
}

function inferGate(beatEl: Element, scripts: ScriptIndex): Beat["gate"] {
  const btn = find(beatEl, (e) => e.tagName === "button" && hasClass(e, CHASSIS.gateButtonClass));
  const need = btn ? attr(btn, "data-need") : undefined;
  const clear = btn ? attr(btn, "data-clear") : undefined;
  const id = attr(beatEl, "id") ?? "";
  if (find(beatEl, (e) => attr(e, "id") === "markComplete")) return { kind: "completion", clearId: clear };
  if (id === "check" || find(beatEl, (e) => /^(kc|check)/.test(attr(e, "id") ?? ""))) return { kind: "check", clearId: clear ?? id, need: need ? Number(need) : undefined };
  if (need) return { kind: "lab", need: Number(need), clearId: clear };
  if (btn) return { kind: "read", clearId: clear };
  void scripts;
  return { kind: "none" };
}

const TYPE_HINTS: [RegExp, string, number][] = [
  [/hero|start|welcome|orientation/, "orientation", 0.9],
  [/hook|case|ticket|why/, "case", 0.85],
  [/intuition|define|definition|concept/, "definition", 0.85],
  [/bench|lattice|sim|lab|explore/, "simulation", 0.8],
  [/measure|ohms|meter|procedure|steps|how-to/, "procedure", 0.75],
  [/types|network|color|colorcode|compare|practice|drill/, "practice", 0.7],
  [/check|quiz|assess/, "check", 0.9],
  [/wrap|summary|field|card|conclusion|recap/, "consolidation", 0.9],
  [/explain|why|model|theory/, "explanation", 0.6],
];

function inferType(beatEl: Element, index: number, total: number): { typeKey?: string; confidence?: number } {
  const hay = `${attr(beatEl, "id") ?? ""} ${attr(beatEl, "data-beat") ?? ""} ${classList(beatEl).join(" ")}`.toLowerCase();
  if (index === 0 && beatEl.tagName === "header") return { typeKey: "orientation", confidence: 0.95 };
  for (const [re, key, conf] of TYPE_HINTS) if (re.test(hay)) return { typeKey: key, confidence: conf };
  if (index === total - 1) return { typeKey: "consolidation", confidence: 0.5 };
  return {};
}

export type ImportResult = { document: LessonDocument; report: ImportReport };

export function importHtml(src: string, opts: { sourceSha256: string; title?: string; allowedHosts?: string[]; docId?: string }): ImportResult {
  const doc = parseHtml(src);
  const scriptsRaw = collectScripts(doc, src);
  const scripts = new ScriptIndex(scriptsRaw, doc);
  const allowedHosts = new Set(opts.allowedHosts ?? DEFAULT_ALLOWED_HOSTS);
  const warnings: ImportWarning[] = [];
  const lostRegions: ImportReport["lostRegions"] = [];
  const ctx: ClassifyContext = { src, scripts, allowedHosts, usedIds: new Set() };

  const html = doc.childNodes.find((n): n is Element => isElement(n) && n.tagName === "html");
  const body = html ? elementChildren(html).find((e) => e.tagName === "body") : undefined;
  const head = html ? elementChildren(html).find((e) => e.tagName === "head") : undefined;
  if (!html || !body) throw new Error("Document has no <html>/<body>");

  // ---- beats -------------------------------------------------------------------------------
  let beatEls = findAll(body, (e) => attr(e, "data-beat") !== undefined);
  beatEls = beatEls.filter((e) => {
    let p = e.parentNode as Node | null;
    while (p && isElement(p)) {
      if (attr(p, "data-beat") !== undefined) return false;
      p = p.parentNode as Node | null;
    }
    return true;
  });
  let beatStrategy = "data-beat";
  if (beatEls.length === 0) {
    beatEls = elementChildren(body).filter((e) => e.tagName === "section");
    beatStrategy = "body>section";
  }
  if (beatEls.length === 0) {
    beatStrategy = "whole-body";
    beatEls = [body];
  }
  const parent = beatEls[0]!.parentNode as Node;
  const siblings = beatEls.every((b) => b.parentNode === parent);
  if (!siblings) {
    warnings.push({ code: "beats-not-siblings", severity: "error", message: "Beat elements are not siblings; falling back to a single opaque beat." });
    beatEls = [body];
    beatStrategy = "whole-body";
  }
  const firstStart = beatEls[0]!.sourceCodeLocation!.startOffset;
  const lastEnd = beatEls[beatEls.length - 1]!.sourceCodeLocation!.endOffset;

  const beats: Beat[] = [];
  const parentChildren = (parent as Element).childNodes as Node[];
  const firstIdx = parentChildren.indexOf(beatEls[0]!);
  let leading = "";
  const ownerByOffset: { start: number; end: number; id: string }[] = [];
  for (let i = firstIdx; i < parentChildren.length; i++) {
    const n = parentChildren[i]!;
    if (isElement(n) && beatEls.includes(n)) {
      const beatIndex = beats.length;
      const id = attr(n, "id") ?? `beat-${beatIndex + 1}`;
      const { wrappers, blocks, trailingHtml } = beatStrategy === "whole-body" ? wholeBodyBlocks(n, ctx) : splitBeatIntoBlocks(n, ctx);
      const t = inferType(n, beatIndex, beatEls.length);
      const beat: Beat = {
        id,
        label: attr(n, "data-beat") ?? (find(n, (e) => /^h[1-3]$/.test(e.tagName)) ? textContent(find(n, (e) => /^h[1-3]$/.test(e.tagName))!).trim() : id),
        tag: n.tagName,
        attrs: attrsMap(n),
        typeKey: t.typeKey,
        typeConfidence: t.confidence,
        objectiveCodes: [],
        gate: inferGate(n, scripts),
        hidden: false,
        leadingHtml: leading,
        trailingHtml,
        blocks,
        wrappers,
        source: makeSourceRef(n, ctx),
        provenance: { origin: "import", at: new Date().toISOString() },
      };
      leading = "";
      beats.push(beat);
      ownerByOffset.push({ start: n.sourceCodeLocation!.startOffset, end: n.sourceCodeLocation!.endOffset, id });
      if (n === beatEls[beatEls.length - 1]) break;
    } else if (isText(n) || isComment(n) || isElement(n)) {
      if (isElement(n) && !["style", "script", "link", "template"].includes(n.tagName)) {
        warnings.push({ code: "interstitial-element", severity: "warning", message: `Element <${n.tagName}> between beats is preserved verbatim but not editable.`, where: `line ${n.sourceCodeLocation?.startLine}` });
      }
      leading += outerHtml(src, n);
    }
  }

  // ---- shell / head ------------------------------------------------------------------------
  const preHtml = src.slice(0, firstStart);
  const postHtml = src.slice(lastEnd);
  const titleEl = head ? find(head, (e) => e.tagName === "title") : undefined;
  let titleOffset: [number, number] | undefined;
  if (titleEl?.sourceCodeLocation?.startTag && titleEl.sourceCodeLocation.endTag) {
    titleOffset = [titleEl.sourceCodeLocation.startTag.endOffset, titleEl.sourceCodeLocation.endTag.startOffset];
  }
  const title = opts.title ?? (titleEl ? textContent(titleEl).trim() : "Untitled lesson");
  const lang = attr(html, "lang") ?? "en";

  // ---- assets & scripts --------------------------------------------------------------------
  const ownerOf = (el: Element) => {
    const off = el.sourceCodeLocation?.startOffset ?? -1;
    const owner = ownerByOffset.find((o) => off >= o.start && off < o.end);
    return owner ? owner.id : off < firstStart ? "head" : "tail";
  };
  const assets = collectAssets(doc, src, allowedHosts, ownerOf);
  const hostCounts = new Map<string, number>();
  for (const a of assets) if (a.host) hostCounts.set(a.host, (hostCounts.get(a.host) ?? 0) + 1);
  const externalHosts = [...hostCounts.entries()].map(([host, count]) => ({ host, allowed: allowedHosts.has(host), count }));
  for (const a of assets) {
    if (a.status === "missing") warnings.push({ code: "asset-missing", severity: a.kind === "script" ? "error" : "warning", message: `Local asset not bundled: ${a.path}`, where: a.referencedBy.join(", ") });
    if (a.status === "external" && a.allowed === false) warnings.push({ code: "external-host", severity: "error", message: `External dependency on disallowed host ${a.host}: ${a.path}` });
  }
  for (const s of scriptsRaw) {
    if (s.src && !s.external) warnings.push({ code: "runtime-script-missing", severity: "warning", message: `Script ${s.src} is referenced but not bundled; calls into it must be guarded.`, where: `line ${s.line}` });
  }

  // ---- ids / handlers ----------------------------------------------------------------------
  const ids = findAll(doc, (e) => attr(e, "id") !== undefined).map((e) => attr(e, "id")!);
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  for (const d of dup) warnings.push({ code: "duplicate-id", severity: "error", message: `Duplicate id "${d}"` });
  const inlineHandlers = findAll(doc, (e) => e.attrs.some((a) => /^on[a-z]+$/i.test(a.name))).length;
  if (inlineHandlers) warnings.push({ code: "inline-handlers", severity: "warning", message: `${inlineHandlers} inline event handler attribute(s)` });

  // ---- objectives ------------------------------------------------------------------------
  const objectiveCodes = new Set<string>();
  for (const s of scriptsRaw) for (const m of s.text.matchAll(/CAET-(\d+\.\d+)/g)) objectiveCodes.add(m[1]!);
  const bodyText = textContent(body);
  for (const m of bodyText.matchAll(/\bLO\s+(\d+\.\d+)\b/g)) objectiveCodes.add(m[1]!);
  for (const m of bodyText.matchAll(/\bCAET[- ](\d+\.\d+)\b/g)) objectiveCodes.add(m[1]!);
  const objectives = [...objectiveCodes].sort().map((code) => ({ code }));
  const checkBeat = beats.find((b) => b.gate.kind === "check");
  if (checkBeat) checkBeat.objectiveCodes = [...objectiveCodes];

  // ---- flow -----------------------------------------------------------------------------
  const passMatch = scriptsRaw.map((s) => s.text.match(/(?:PASS|passN|pass)\s*[=:]\s*(\d+)/)).find(Boolean);
  const itemCount = findAll(body, (e) => /^kc\d+$/.test(attr(e, "id") ?? "") || hasClass(e, "kc")).length;

  const document: LessonDocument = LessonDocumentSchema.parse({
    schemaVersion: 1,
    id: opts.docId ?? nanoid(12),
    title,
    lang,
    origin: "import",
    meta: { chassis: detectChassis(doc, scripts).profile },
    objectives,
    flow: { mode: "completion", passN: passMatch ? Number(passMatch[1]) : undefined, itemCount: itemCount || undefined },
    theme: { family: "electric-ink", tokens: extractTokens(src) },
    shell: { preHtml, postHtml, titleOffset },
    beats,
    assets,
    accessibility: { exceptions: [] },
    runtime: { standaloneShim: false, removedScripts: [] },
    provenance: {},
  });

  const counts = countThings(document, doc, scriptsRaw.length, inlineHandlers, ids.length);
  const report: ImportReport = {
    importerVersion: IMPORTER_VERSION,
    sourceSha256: opts.sourceSha256,
    sourceBytes: Buffer.byteLength(src),
    sourceLines: src.split("\n").length,
    chassis: detectChassis(doc, scripts),
    counts,
    assets,
    externalHosts,
    duplicateIds: [...dup],
    warnings,
    objectivesDetected: [...objectiveCodes],
    gateSummary: beats.map((b) => ({ beatId: b.id, kind: b.gate.kind, need: b.gate.need, clearId: b.gate.clearId })),
    lostRegions,
  };
  return { document, report };
}

function wholeBodyBlocks(body: Element, ctx: ClassifyContext) {
  const blocks: Block[] = [];
  let leading = "";
  for (const n of body.childNodes as Node[]) {
    if (isElement(n)) {
      blocks.push(classifyElement(n, ctx, leading));
      leading = "";
    } else leading += outerHtml(ctx.src, n);
  }
  return { wrappers: [], blocks, trailingHtml: leading };
}

function extractTokens(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  const root = src.match(/:root\s*\{([^}]*)\}/);
  if (root) for (const m of root[1]!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]!] = m[2]!.trim();
  return out;
}

function countThings(document: LessonDocument, doc: ReturnType<typeof parseHtml>, scripts: number, inlineHandlers: number, ids: number): ImportReport["counts"] {
  const byClassification: Record<string, number> = {};
  const byKind: Record<string, number> = {};
  let blocks = 0;
  for (const b of document.beats)
    for (const blk of b.blocks) {
      blocks++;
      byClassification[blk.classification] = (byClassification[blk.classification] ?? 0) + 1;
      byKind[blk.kind] = (byKind[blk.kind] ?? 0) + 1;
    }
  return {
    beats: document.beats.length,
    blocks,
    byClassification,
    byKind,
    scriptsInline: findAll(doc, (e) => e.tagName === "script" && !attr(e, "src")).length,
    scriptsExternal: scripts - findAll(doc, (e) => e.tagName === "script" && !attr(e, "src")).length,
    styles: findAll(doc, (e) => e.tagName === "style").length,
    svgs: findAll(doc, (e) => e.tagName === "svg").length,
    canvases: findAll(doc, (e) => e.tagName === "canvas").length,
    images: findAll(doc, (e) => e.tagName === "img").length,
    tables: findAll(doc, (e) => e.tagName === "table").length,
    ids,
    inlineHandlers,
  };
}
