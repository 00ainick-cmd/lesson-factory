import { nanoid } from "nanoid";
import {
  attr,
  attrsMap,
  classList,
  dataAttrs,
  domPath,
  elementChildren,
  find,
  findAll,
  hasClass,
  indexPath,
  innerHtml,
  isComment,
  isElement,
  isText,
  outerHtml,
  walk,
  type Element,
  type Node,
} from "./dom";
import type { ScriptIndex } from "./scripts";
import type { Block, SourceRef, Beat, TableRow } from "../model";

export const CHASSIS = {
  gateButtonClass: "gate-next",
  gateBarClass: "gatebar",
  wrapperClasses: new Set(["wrap", "container", "inner", "content", "section-inner"]),
  calloutClasses: new Set(["callout", "note", "tip", "warn", "warning", "caution", "alert", "aside", "cc-card-note"]),
  textDivClasses: new Set(["kicker", "lede", "figcap", "eyebrow", "caption", "subtitle", "cc-num-src", "gate-note"]),
};

const BLOCK_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "dl", "table", "figure", "blockquote", "pre", "div", "article", "aside", "section"]);
const INLINE_TAGS = new Set(["b", "i", "strong", "em", "span", "a", "sub", "sup", "code", "br", "small", "abbr", "kbd", "mark", "u", "s", "time", "wbr"]);

function looseText(value: string, leadingHtml: string): Block {
  return {
    id: `txt-${nanoid(8)}`,
    kind: "richtext",
    classification: "managed",
    hidden: false,
    attrs: {},
    leadingHtml,
    complex: false,
    tag: "span",
    html: value,
    a11y: { exceptions: [] },
    provenance: { origin: "import", at: new Date().toISOString() },
  };
}

const INTERACTIVE_TAGS = new Set(["canvas", "input", "select", "textarea", "audio", "video", "iframe", "object", "embed", "form", "dialog", "details"]);
const HEADING = /^h[1-6]$/;
const TEXT_TAGS = new Set(["p", "ul", "ol", "dl", "blockquote", "pre"]);

export type ClassifyContext = {
  src: string;
  scripts: ScriptIndex;
  allowedHosts: Set<string>;
  usedIds: Set<string>;
};

export function makeSourceRef(el: Element, ctx: ClassifyContext, confidence = 1): SourceRef {
  const l = el.sourceCodeLocation;
  return {
    domPath: domPath(el),
    nodeIndexPath: indexPath(el),
    elementId: attr(el, "id"),
    tag: el.tagName,
    classes: classList(el),
    dataAttrs: dataAttrs(el),
    lineStart: l?.startLine,
    lineEnd: l?.endLine,
    startOffset: l?.startOffset,
    endOffset: l?.endOffset,
    relatedScripts: ctx.scripts.refsForTree(el, walk),
    confidence,
  };
}

function blockId(el: Element, ctx: ClassifyContext, prefix: string): string {
  const id = attr(el, "id");
  let candidate = id ? `blk-${id}` : `${prefix}-${nanoid(8)}`;
  while (ctx.usedIds.has(candidate)) candidate = `${prefix}-${nanoid(8)}`;
  ctx.usedIds.add(candidate);
  return candidate;
}

function containsInteractive(el: Element, ignoreGateButtons = true): string | null {
  for (const n of walk(el)) {
    if (INTERACTIVE_TAGS.has(n.tagName)) return `contains <${n.tagName}>`;
    if (n.tagName === "button" && !(ignoreGateButtons && hasClass(n, CHASSIS.gateButtonClass))) return "contains a scripted button";
    if (n.tagName === "a" && (attr(n, "href") ?? "").startsWith("javascript:")) return "javascript: link";
    if (attr(n, "contenteditable") !== undefined) return "contenteditable region";
    for (const a of n.attrs) if (/^on[a-z]+$/i.test(a.name)) return `inline event handler ${a.name}`;
  }
  return null;
}

function hasSvg(el: Element): boolean {
  return !!find(el, (n) => n.tagName === "svg");
}

function base(el: Element, ctx: ClassifyContext, prefix: string, classification: Block["classification"], leadingHtml: string) {
  return {
    id: blockId(el, ctx, prefix),
    classification,
    hidden: false,
    attrs: attrsMap(el),
    leadingHtml,
    complex: false,
    source: makeSourceRef(el, ctx),
    a11y: { exceptions: [] as { ruleKey: string; reason: string }[] },
    provenance: { origin: "import" as const, at: new Date().toISOString() },
  };
}

export function classifyElement(el: Element, ctx: ClassifyContext, leadingHtml: string): Block {
  const tag = el.tagName;
  const src = ctx.src;
  const cls = classList(el);

  if (tag === "script") {
    const s = attr(el, "src");
    const external = !!s && /^(https?:)?\/\//i.test(s);
    if (external) {
      const host = new URL(s!, "https://x.invalid").host;
      if (!ctx.allowedHosts.has(host)) {
        return { ...base(el, ctx, "unsup", "unsupported", leadingHtml), kind: "unsupported", rawHtml: outerHtml(src, el), reason: `External script from disallowed host ${host}` };
      }
    }
    return { ...base(el, ctx, "opq", "opaque-embed", leadingHtml), kind: "opaque", rawHtml: outerHtml(src, el), reason: "Inline script preserved verbatim" };
  }
  if (tag === "style" || tag === "link" || tag === "template" || tag === "noscript") {
    return { ...base(el, ctx, "opq", "opaque-embed", leadingHtml), kind: "opaque", rawHtml: outerHtml(src, el), reason: `Beat-local <${tag}> preserved verbatim` };
  }
  if (tag === "iframe" || tag === "object" || tag === "embed") {
    const s = attr(el, "src") ?? attr(el, "data") ?? "";
    const host = /^(https?:)?\/\//i.test(s) ? new URL(s, "https://x.invalid").host : "";
    if (host && !ctx.allowedHosts.has(host)) {
      return { ...base(el, ctx, "unsup", "unsupported", leadingHtml), kind: "unsupported", rawHtml: outerHtml(src, el), reason: `Embedded content from disallowed host ${host}` };
    }
    return { ...base(el, ctx, "opq", "opaque-embed", leadingHtml), kind: "opaque", rawHtml: outerHtml(src, el), reason: "Opaque embed" };
  }

  // Gate bar: the chassis' safe button. Label is editable; data-clear/data-need and sibling
  // markup (gate notes written by script) are preserved verbatim.
  if (hasClass(el, CHASSIS.gateBarClass) || (tag === "button" && hasClass(el, CHASSIS.gateButtonClass))) {
    const buttons = tag === "button" ? [el] : findAll(el, (n) => n.tagName === "button" && hasClass(n, CHASSIS.gateButtonClass));
    const button = buttons[0];
    if (button && buttons.length === 1 && button.sourceCodeLocation && el.sourceCodeLocation?.startTag) {
      const b = base(el, ctx, "btn", "managed", leadingHtml);
      if (tag === "button") {
        return { ...b, kind: "button", label: innerHtml(src, button), attrs: attrsMap(button), wrapperAttrs: {}, beforeHtml: "", afterHtml: "" };
      }
      const innerStart = el.sourceCodeLocation.startTag.endOffset;
      const innerEnd = el.sourceCodeLocation.endTag ? el.sourceCodeLocation.endTag.startOffset : el.sourceCodeLocation.endOffset;
      return {
        ...b,
        kind: "button",
        label: innerHtml(src, button),
        attrs: attrsMap(button),
        wrapperTag: tag,
        wrapperAttrs: attrsMap(el),
        beforeHtml: src.slice(innerStart, button.sourceCodeLocation.startOffset),
        afterHtml: src.slice(button.sourceCodeLocation.endOffset, innerEnd),
      };
    }
  }

  const scripted = ctx.scripts.treeIsScripted(el, walk, new Set([CHASSIS.gateButtonClass, CHASSIS.gateBarClass]));
  const interactive = containsInteractive(el);
  if (scripted || interactive) {
    const reasons = [scripted, interactive].filter((r): r is string => !!r);
    const ids = findAll(el, (n) => !!attr(n, "id")).map((n) => attr(n, "id")!);
    const label = attr(el, "aria-label") ?? attr(el, "id") ?? cls[0] ?? tag;
    return {
      ...base(el, ctx, "cib", "wrapped-custom", leadingHtml),
      kind: "custom",
      label: `Custom interaction: ${label}`,
      rawHtml: outerHtml(src, el),
      interactionIds: ids,
      reasons,
      eventContract: { declared: [], detected: [...ctx.scripts.eventNames].filter((e) => e.startsWith("interaction:")) },
    };
  }

  if (HEADING.test(tag)) {
    return { ...base(el, ctx, "h", "managed", leadingHtml), kind: "heading", level: Number(tag[1]), html: innerHtml(src, el), complex: hasSvg(el) };
  }
  if (tag === "img") {
    return { ...base(el, ctx, "img", "managed", leadingHtml), kind: "image", imgAttrs: attrsMap(el), src: attr(el, "src") ?? "", alt: attr(el, "alt") ?? "", captionAttrs: {} };
  }
  if (tag === "figure" || tag === "picture") {
    const img = find(el, (n) => n.tagName === "img");
    if (img && tag === "figure") {
      const kids = elementChildren(el);
      const cap = kids.find((k) => k.tagName === "figcaption");
      const extra = kids.filter((k) => k !== img && k !== cap && !(k.tagName === "img"));
      // Only wrap as a managed image when the figure is a simple img + caption pair.
      if (kids.includes(img) && extra.length === 0) {
        return {
          ...base(el, ctx, "fig", "managed", leadingHtml),
          kind: "image",
          wrapperTag: tag,
          imgAttrs: attrsMap(img),
          src: attr(img, "src") ?? "",
          alt: attr(img, "alt") ?? "",
          captionHtml: cap ? innerHtml(src, cap) : undefined,
          captionTag: cap?.tagName,
          captionAttrs: cap ? attrsMap(cap) : {},
        };
      }
    }
  }
  if (tag === "table") {
    const rows: TableRow[] = [];
    let simple = true;
    for (const part of elementChildren(el)) {
      const section = (["thead", "tbody", "tfoot"].includes(part.tagName) ? part.tagName : part.tagName === "tr" ? "tbody" : null) as "thead" | "tbody" | "tfoot" | null;
      if (!section) {
        if (part.tagName === "caption" || part.tagName === "colgroup") continue;
        simple = false;
        break;
      }
      const trs = part.tagName === "tr" ? [part] : elementChildren(part).filter((r) => r.tagName === "tr");
      for (const tr of trs) {
        const cells = elementChildren(tr)
          .filter((c) => c.tagName === "td" || c.tagName === "th")
          .map((c) => ({ html: innerHtml(src, c), header: c.tagName === "th", attrs: attrsMap(c) }));
        rows.push({ attrs: attrsMap(tr), section, cells });
      }
    }
    const cap = elementChildren(el).find((c) => c.tagName === "caption");
    const colgroup = elementChildren(el).find((c) => c.tagName === "colgroup");
    if (simple && !colgroup) {
      return { ...base(el, ctx, "tbl", "managed", leadingHtml), kind: "table", captionHtml: cap ? innerHtml(src, cap) : undefined, rows };
    }
    return { ...base(el, ctx, "opq", "opaque-embed", leadingHtml), kind: "opaque", rawHtml: outerHtml(src, el), reason: "Table uses colgroup or irregular structure" };
  }
  if (TEXT_TAGS.has(tag)) {
    return { ...base(el, ctx, "txt", "managed", leadingHtml), kind: "richtext", tag, html: innerHtml(src, el), complex: hasSvg(el) };
  }
  if (cls.some((c) => CHASSIS.calloutClasses.has(c)) || tag === "aside") {
    return { ...base(el, ctx, "co", "managed", leadingHtml), kind: "callout", tag, html: innerHtml(src, el), variant: cls.find((c) => CHASSIS.calloutClasses.has(c)), complex: hasSvg(el) };
  }
  if (["div", "article", "header", "footer", "main", "nav", "section"].includes(tag) && !cls.some((c) => CHASSIS.textDivClasses.has(c))) {
    const kids = elementChildren(el);
    const hasBlockChild = kids.some((k) => BLOCK_TAGS.has(k.tagName));
    if (hasBlockChild) {
      // Static container: recurse so headings/paragraphs/tables inside stay individually editable.
      const children: Block[] = [];
      let lead = "";
      for (const n of el.childNodes as Node[]) {
        if (isElement(n)) {
          children.push(classifyElement(n, ctx, lead));
          lead = "";
        } else if (isText(n)) {
          if (n.value.trim().length === 0) lead += n.value;
          else {
            children.push(looseText(n.value, lead));
            lead = "";
          }
        } else if (isComment(n)) lead += outerHtml(src, n);
      }
      return { ...base(el, ctx, "grp", "managed", leadingHtml), kind: "group", tag, children, trailingHtml: lead };
    }
  }
  if (tag === "div" || tag === "article" || tag === "header" || tag === "footer" || tag === "span" || tag === "small" || tag === "svg" || tag === "hr" || tag === "br" || tag === "label" || tag === "a") {
    // Static leaf container / graphic. Marked complex when it nests structure (edit as HTML source).
    const nested = elementChildren(el).some((k) => !INLINE_TAGS.has(k.tagName));
    return { ...base(el, ctx, "txt", "managed", leadingHtml), kind: "richtext", tag, html: innerHtml(src, el), complex: nested || tag === "svg" || hasSvg(el) };
  }
  return { ...base(el, ctx, "opq", "opaque-embed", leadingHtml), kind: "opaque", rawHtml: outerHtml(src, el), reason: `Unrecognised element <${tag}>` };
}

/**
 * Descend through single-child layout wrappers (div.wrap) and split the remaining children into blocks.
 * Whitespace and comments between blocks travel with the following block as leadingHtml.
 */
export function splitBeatIntoBlocks(beatEl: Element, ctx: ClassifyContext): { wrappers: Beat["wrappers"]; blocks: Block[]; trailingHtml: string } {
  const wrappers: Beat["wrappers"] = [];
  let container: Element = beatEl;
  for (let depth = 0; depth < 4; depth++) {
    const kids = elementChildren(container);
    const meaningfulText = container.childNodes.some((n) => isText(n) && n.value.trim().length > 0);
    if (kids.length === 1 && !meaningfulText && kids[0]!.tagName === "div" && classList(kids[0]!).some((c) => CHASSIS.wrapperClasses.has(c)) && !attr(kids[0]!, "id")) {
      wrappers.push({ tag: "div", attrs: attrsMap(kids[0]!) });
      container = kids[0]!;
    } else break;
  }
  const blocks: Block[] = [];
  let leading = "";
  let trailingHtml = "";
  for (const n of container.childNodes as Node[]) {
    if (isElement(n)) {
      blocks.push(classifyElement(n, ctx, leading));
      leading = "";
    } else if (isText(n)) {
      if (n.value.trim().length === 0) leading += n.value;
      else {
        blocks.push(looseText(n.value, leading));
        leading = "";
      }
    } else if (isComment(n)) {
      leading += outerHtml(ctx.src, n);
    }
  }
  trailingHtml = leading;
  return { wrappers, blocks, trailingHtml };
}
