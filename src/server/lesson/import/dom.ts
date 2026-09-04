import * as parse5 from "parse5";
import type { DefaultTreeAdapterTypes as T } from "parse5";

export type Element = T.Element;
export type Node = T.Node;
export type Document = T.Document;

export function parseHtml(html: string): Document {
  return parse5.parse(html, { sourceCodeLocationInfo: true });
}

export function isElement(n: Node): n is Element {
  return "tagName" in n && typeof (n as Element).tagName === "string";
}
export function isText(n: Node): n is T.TextNode {
  return n.nodeName === "#text";
}
export function isComment(n: Node): n is T.CommentNode {
  return n.nodeName === "#comment";
}

export function attr(el: Element, name: string): string | undefined {
  return el.attrs.find((a) => a.name === name)?.value;
}
export function attrsMap(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of el.attrs) out[a.name] = a.value;
  return out;
}
export function classList(el: Element): string[] {
  return (attr(el, "class") ?? "").split(/\s+/).filter(Boolean);
}
export function hasClass(el: Element, c: string): boolean {
  return classList(el).includes(c);
}
export function dataAttrs(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of el.attrs) if (a.name.startsWith("data-")) out[a.name] = a.value;
  return out;
}

export function elementChildren(n: Node): Element[] {
  return ("childNodes" in n ? (n as T.ParentNode).childNodes : []).filter(isElement);
}

export function* walk(n: Node): Generator<Element> {
  if (isElement(n)) yield n;
  if ("childNodes" in n) for (const c of (n as T.ParentNode).childNodes) yield* walk(c);
}

export function find(root: Node, pred: (el: Element) => boolean): Element | undefined {
  for (const el of walk(root)) if (pred(el)) return el;
  return undefined;
}
export function findAll(root: Node, pred: (el: Element) => boolean): Element[] {
  const out: Element[] = [];
  for (const el of walk(root)) if (pred(el)) out.push(el);
  return out;
}

export function textContent(n: Node): string {
  if (isText(n)) return n.value;
  if ("childNodes" in n) return (n as T.ParentNode).childNodes.map(textContent).join("");
  return "";
}

export type Loc = { startOffset: number; endOffset: number; startLine: number; endLine: number };

export function loc(n: Node): Loc | undefined {
  const l = (n as Element).sourceCodeLocation;
  if (!l) return undefined;
  return { startOffset: l.startOffset, endOffset: l.endOffset, startLine: l.startLine, endLine: l.endLine };
}

/** Verbatim outer HTML from the original string. */
export function outerHtml(src: string, n: Node): string {
  const l = loc(n);
  if (!l) return "";
  return src.slice(l.startOffset, l.endOffset);
}

/** Verbatim inner HTML from the original string. Returns "" for void elements. */
export function innerHtml(src: string, el: Element): string {
  const l = el.sourceCodeLocation;
  if (!l || !l.startTag) return "";
  const start = l.startTag.endOffset;
  const end = l.endTag ? l.endTag.startOffset : l.endOffset;
  if (end < start) return "";
  return src.slice(start, end);
}

export function indexPath(el: Element): number[] {
  const path: number[] = [];
  let cur: Element = el;
  while (cur.parentNode && isElement(cur.parentNode as Node)) {
    const parent = cur.parentNode as Element;
    const idx = parent.childNodes.filter(isElement).indexOf(cur);
    path.unshift(idx);
    cur = parent;
  }
  return path;
}

export function domPath(el: Element): string {
  const parts: string[] = [];
  let cur: Node = el;
  while (cur && isElement(cur) && cur.tagName !== "html") {
    const e = cur as Element;
    let part = e.tagName;
    const id = attr(e, "id");
    if (id) {
      part += `#${id}`;
    } else {
      const cls = classList(e).slice(0, 2);
      if (cls.length) part += "." + cls.join(".");
      const parent = e.parentNode as T.ParentNode | null;
      if (parent) {
        const same = parent.childNodes.filter((c) => isElement(c) && c.tagName === e.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(e) + 1})`;
      }
    }
    parts.unshift(part);
    cur = e.parentNode as Node;
  }
  return parts.join(" > ");
}

export function escapeAttr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function serializeAttrs(attrs: Record<string, string>): string {
  const parts = Object.entries(attrs).map(([k, v]) => (v === "" ? k : `${k}="${escapeAttr(v)}"`));
  return parts.length ? " " + parts.join(" ") : "";
}

export const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

export function openTag(tag: string, attrs: Record<string, string>): string {
  return `<${tag}${serializeAttrs(attrs)}>`;
}

export function wrapTag(tag: string, attrs: Record<string, string>, inner: string): string {
  if (VOID_TAGS.has(tag)) return openTag(tag, attrs);
  return `${openTag(tag, attrs)}${inner}</${tag}>`;
}

export function lineOf(src: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < src.length; i++) if (src.charCodeAt(i) === 10) line++;
  return line;
}
