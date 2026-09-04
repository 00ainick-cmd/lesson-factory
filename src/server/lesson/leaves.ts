import * as parse5 from "parse5";
import type { DefaultTreeAdapterTypes as T } from "parse5";
import { escapeAttr, isElement, isText, type Element, type Node } from "./import/dom";

/**
 * "Leaves" are the safely editable text and image regions inside a verbatim HTML fragment
 * (wrapped custom interactions, complex containers). Editing a leaf never changes structure:
 * we splice new inner HTML or a new alt attribute into the exact byte range of the original.
 */
export type Leaf = {
  index: number; // stable position in the leaf list
  elementIndex: number; // position among all descendant elements (matches DOM querySelectorAll('*') order)
  tag: string;
  kind: "text" | "image";
  id?: string;
  classes: string[];
  html: string; // inner HTML for text leaves
  alt?: string; // alt for image leaves
  src?: string;
  scripted: boolean; // has an id (scripts may write this value)
};

const TEXT_LEAF_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "td", "th", "figcaption", "caption", "label", "span", "div", "button", "summary", "legend", "small", "b", "strong", "em", "i", "a", "dt", "dd", "option", "text", "tspan"]);
const INLINE = new Set(["b", "i", "strong", "em", "span", "a", "sub", "sup", "code", "br", "small", "abbr", "kbd", "mark", "u", "s", "time", "wbr"]);

function parseFragment(html: string) {
  return parse5.parseFragment(html, { sourceCodeLocationInfo: true });
}

function* walkEls(n: Node): Generator<Element> {
  if (isElement(n)) yield n;
  if ("childNodes" in n) for (const c of (n as T.ParentNode).childNodes) yield* walkEls(c);
}

function isTextLeaf(el: Element): boolean {
  if (!TEXT_LEAF_TAGS.has(el.tagName)) return false;
  const kids = (el.childNodes as Node[]).filter(isElement);
  if (!kids.every((k) => INLINE.has(k.tagName))) return false;
  const text = (el.childNodes as Node[]).some((c) => isText(c) && c.value.trim().length > 0);
  const inlineText = kids.some((k) => (k.childNodes as Node[]).some((c) => isText(c) && c.value.trim().length > 0));
  return text || inlineText;
}

export function listLeaves(html: string, idsReferencedByScript: Set<string> = new Set()): Leaf[] {
  const frag = parseFragment(html);
  const leaves: Leaf[] = [];
  let elementIndex = -1;
  for (const el of walkEls(frag)) {
    elementIndex++;
    const id = el.attrs.find((a) => a.name === "id")?.value;
    const classes = (el.attrs.find((a) => a.name === "class")?.value ?? "").split(/\s+/).filter(Boolean);
    if (el.tagName === "img") {
      leaves.push({ index: leaves.length, elementIndex, tag: "img", kind: "image", id, classes, html: "", alt: el.attrs.find((a) => a.name === "alt")?.value ?? "", src: el.attrs.find((a) => a.name === "src")?.value, scripted: !!id && idsReferencedByScript.has(id) });
      continue;
    }
    if (isTextLeaf(el)) {
      const l = el.sourceCodeLocation;
      if (!l?.startTag || !l.endTag) continue;
      leaves.push({ index: leaves.length, elementIndex, tag: el.tagName, kind: "text", id, classes, html: html.slice(l.startTag.endOffset, l.endTag.startOffset), scripted: !!id && idsReferencedByScript.has(id) });
    }
  }
  return leaves;
}

export type LeafEdit = { leafIndex: number; html?: string; alt?: string };

/** Apply a leaf edit to the fragment and return the new fragment HTML. */
export function applyLeafEdit(html: string, edit: LeafEdit): string {
  const frag = parseFragment(html);
  const leaves = listLeaves(html);
  const leaf = leaves[edit.leafIndex];
  if (!leaf) throw new Error(`Leaf ${edit.leafIndex} not found`);
  let i = -1;
  for (const el of walkEls(frag)) {
    i++;
    if (i !== leaf.elementIndex) continue;
    const l = el.sourceCodeLocation!;
    if (leaf.kind === "image") {
      if (edit.alt === undefined) return html;
      const altLoc = l.attrs?.alt;
      if (altLoc) return html.slice(0, altLoc.startOffset) + `alt="${escapeAttr(edit.alt)}"` + html.slice(altLoc.endOffset);
      // No alt attribute: insert one right after the tag name.
      const tagEnd = l.startTag!.startOffset + 1 + el.tagName.length;
      return html.slice(0, tagEnd) + ` alt="${escapeAttr(edit.alt)}"` + html.slice(tagEnd);
    }
    if (edit.html === undefined) return html;
    return html.slice(0, l.startTag!.endOffset) + edit.html + html.slice(l.endTag!.startOffset);
  }
  throw new Error("Leaf element not found in fragment");
}
