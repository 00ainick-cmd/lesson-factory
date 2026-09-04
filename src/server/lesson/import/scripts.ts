import { attr, findAll, textContent, lineOf, type Document, type Element } from "./dom";

export type ScriptInfo = {
  index: number;
  src?: string;
  inline: boolean;
  text: string;
  line: number;
  startOffset: number;
  external: boolean;
};

export type ScriptRef = { scriptIndex: number; line: number; snippet: string; via: string };

export function collectScripts(doc: Document, src: string): ScriptInfo[] {
  const scripts = findAll(doc, (el) => el.tagName === "script");
  return scripts.map((el, index) => {
    const s = attr(el, "src");
    const text = textContent(el);
    const start = el.sourceCodeLocation?.startOffset ?? 0;
    return {
      index,
      src: s,
      inline: !s,
      text,
      line: lineOf(src, start),
      startOffset: start,
      external: !!s && /^(https?:)?\/\//i.test(s),
    };
  });
}

/**
 * Index of which element ids and class names the inline scripts touch. This is heuristic: a
 * string match for `#id`, `"id"`, `'id'`, getElementById("id"), or `.class` in script text.
 * A false positive only makes a region "wrapped custom" (safe); a false negative would make a
 * scripted region editable, so the match is deliberately broad.
 */
export class ScriptIndex {
  private idHits = new Map<string, ScriptRef[]>();
  private classHits = new Map<string, ScriptRef[]>();
  readonly eventNames = new Set<string>();
  readonly globals = new Set<string>();
  /** Classes used in selector calls (querySelector, closest, getElementsByClassName) — strong evidence of scripting. */
  readonly strongClasses = new Set<string>();
  /** Attribute names used in selector calls, e.g. data-flip from querySelectorAll("[data-flip]"). */
  readonly strongAttrs = new Set<string>();

  constructor(
    readonly scripts: ScriptInfo[],
    doc: Document,
  ) {
    const ids = new Set<string>();
    const classes = new Set<string>();
    for (const el of findAll(doc, () => true)) {
      const id = attr(el, "id");
      if (id) ids.add(id);
      for (const c of (attr(el, "class") ?? "").split(/\s+/)) if (c) classes.add(c);
    }
    for (const s of scripts) {
      if (!s.inline || !s.text) continue;
      for (const m of s.text.matchAll(/(?:querySelector(?:All)?|closest|matches)\(\s*["'`]([^"'`]+)["'`]/g)) {
        for (const c of m[1]!.matchAll(/\.([A-Za-z_][\w-]*)/g)) this.strongClasses.add(c[1]!);
        for (const a of m[1]!.matchAll(/\[([A-Za-z_][\w-]*)/g)) this.strongAttrs.add(a[1]!);
      }
      for (const m of s.text.matchAll(/getElementsByClassName\(\s*["']([\w-]+)["']/g)) this.strongClasses.add(m[1]!);
      const lines = s.text.split("\n");
      lines.forEach((lineText, i) => {
        const lineNo = s.line + i;
        for (const id of ids) {
          if (
            lineText.includes(`"${id}"`) ||
            lineText.includes(`'${id}'`) ||
            lineText.includes(`#${id}`) ||
            lineText.includes("`" + id + "`")
          ) {
            push(this.idHits, id, { scriptIndex: s.index, line: lineNo, snippet: lineText.trim().slice(0, 160), via: "id" });
          }
        }
        for (const c of classes) {
          if (
            lineText.includes(`.${c}`) ||
            lineText.includes(`"${c}"`) ||
            lineText.includes(`'${c}'`) ||
            lineText.includes(`"${c} `) ||
            lineText.includes(` ${c}"`)
          ) {
            push(this.classHits, c, { scriptIndex: s.index, line: lineNo, snippet: lineText.trim().slice(0, 160), via: "class" });
          }
        }
        for (const m of lineText.matchAll(/addEventListener\(\s*["']([a-zA-Z:-]+)["']/g)) this.eventNames.add(m[1]!);
        for (const m of lineText.matchAll(/CustomEvent\(\s*["']([a-zA-Z:-]+)["']/g)) this.eventNames.add(m[1]!);
        for (const m of lineText.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) this.globals.add(m[1]!);
      });
    }
  }

  refsForId(id: string): ScriptRef[] {
    return this.idHits.get(id) ?? [];
  }
  refsForClass(c: string): ScriptRef[] {
    return this.classHits.get(c) ?? [];
  }
  /** Script references for this element or any descendant (ids first, then classes). */
  refsForTree(el: Element, walkFn: (n: Element) => Iterable<Element>, limit = 12): ScriptRef[] {
    const out: ScriptRef[] = [];
    const seen = new Set<string>();
    for (const n of walkFn(el)) {
      const id = attr(n, "id");
      if (id) for (const r of this.refsForId(id)) addRef(out, seen, r, limit);
      for (const c of (attr(n, "class") ?? "").split(/\s+/)) if (c) for (const r of this.refsForClass(c)) addRef(out, seen, r, limit);
      if (out.length >= limit) break;
    }
    return out;
  }
  /**
   * True when the element (or a descendant) is targeted by an inline script via id, or via a class
   * used in a selector call. Plain string matches on class names alone are not enough.
   */
  treeIsScripted(el: Element, walkFn: (n: Element) => Iterable<Element>, ignoreClasses: Set<string> = new Set()): string | null {
    for (const n of walkFn(el)) {
      const id = attr(n, "id");
      if (id && this.refsForId(id).length) return `#${id} is referenced by script`;
      for (const c of (attr(n, "class") ?? "").split(/\s+/)) {
        if (c && !ignoreClasses.has(c) && this.strongClasses.has(c)) return `.${c} is selected by script`;
      }
      for (const a of n.attrs) {
        if (a.name.startsWith("data-") && !IGNORED_ATTRS.has(a.name) && this.strongAttrs.has(a.name)) return `[${a.name}] is selected by script`;
      }
    }
    return null;
  }
}

// Chassis attributes that scripts select but which do not make a region interactive by themselves.
const IGNORED_ATTRS = new Set(["data-beat", "data-clear", "data-need"]);

function push<K>(m: Map<K, ScriptRef[]>, k: K, v: ScriptRef) {
  const arr = m.get(k);
  if (arr) arr.push(v);
  else m.set(k, [v]);
}
function addRef(out: ScriptRef[], seen: Set<string>, r: ScriptRef, limit: number) {
  const key = `${r.scriptIndex}:${r.line}`;
  if (seen.has(key) || out.length >= limit) return;
  seen.add(key);
  out.push(r);
}
