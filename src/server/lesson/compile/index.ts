import { escapeHtml, openTag, wrapTag, VOID_TAGS } from "../import/dom";
import type { Beat, Block, LessonDocument } from "../model";
import { INSPECTOR_AGENT_SOURCE } from "./inspector-agent";
import { AEROLESSON_SHIM } from "./shim";

export type CompileMode = "preview" | "export";

export type CompileOptions = {
  mode: CompileMode;
  /** Preview only: show every beat regardless of lock state and inject the inspector agent. */
  authorMode?: boolean;
  /** Export: inline a minimal AeroLesson runtime so gate/completion calls resolve without the missing core script. */
  standaloneShim?: boolean;
  /** Export: drop <script src> tags whose files are not bundled (they only produce 404s). */
  dropMissingScripts?: string[];
};

const PREVIEW_STYLE = `<style id="lfs-preview-style">
[data-beat].is-locked{display:block !important}
[data-lfs-block]{outline:2px solid transparent;outline-offset:2px;transition:outline-color .12s}
[data-lfs-block].lfs-hover{outline-color:rgba(43,143,255,.55)}
[data-lfs-block].lfs-selected{outline-color:#2b8fff;box-shadow:0 0 0 4px rgba(43,143,255,.18)}
[data-lfs-block][data-lfs-classification="wrapped-custom"].lfs-hover{outline-color:rgba(245,166,35,.65)}
[data-lfs-block][data-lfs-classification="wrapped-custom"].lfs-selected{outline-color:#f5a623;box-shadow:0 0 0 4px rgba(245,166,35,.18)}
[data-lfs-block][data-lfs-classification="opaque-embed"].lfs-selected,[data-lfs-block][data-lfs-classification="unsupported"].lfs-selected{outline-color:#ff5d73;outline-style:dashed}
[data-lfs-hidden="true"]{opacity:.35;filter:grayscale(1)}
</style>`;

/** Serialize one block back to HTML. Managed blocks are rebuilt; everything else is verbatim. */
export function renderBlock(block: Block, opts: CompileOptions): string {
  const marker = opts.mode === "preview" ? { "data-lfs-block": block.id, "data-lfs-classification": block.classification, ...(block.hidden ? { "data-lfs-hidden": "true" } : {}) } : {};
  if (block.hidden && opts.mode === "export") return "";
  switch (block.kind) {
    case "heading":
      return wrapTag(`h${block.level}`, { ...block.attrs, ...marker }, block.html);
    case "richtext":
      if (block.tag === "span" && Object.keys(block.attrs).length === 0 && opts.mode === "export") return block.html;
      return wrapTag(block.tag, { ...block.attrs, ...marker }, block.html);
    case "callout":
      return wrapTag(block.tag, { ...block.attrs, ...marker }, block.html);
    case "image": {
      const imgAttrs = { ...block.imgAttrs, src: block.src, alt: block.alt };
      if (!block.wrapperTag) return openTag("img", { ...imgAttrs, ...marker });
      const img = openTag("img", imgAttrs);
      const cap = block.captionTag ? wrapTag(block.captionTag, block.captionAttrs, block.captionHtml ?? "") : block.captionHtml ? wrapTag("figcaption", {}, block.captionHtml) : "";
      return wrapTag(block.wrapperTag, { ...block.attrs, ...marker }, `\n  ${img}\n  ${cap}${block.extraHtml ?? ""}\n`);
    }
    case "table": {
      const cap = block.captionHtml !== undefined ? wrapTag("caption", {}, block.captionHtml) : "";
      const groups: Record<string, string[]> = { thead: [], tbody: [], tfoot: [] };
      for (const row of block.rows) {
        const cells = row.cells.map((c) => wrapTag(c.header ? "th" : "td", c.attrs, c.html)).join("");
        groups[row.section]!.push(wrapTag("tr", row.attrs, cells));
      }
      const body = ["thead", "tbody", "tfoot"].filter((g) => groups[g]!.length).map((g) => wrapTag(g, {}, "\n" + groups[g]!.join("\n") + "\n")).join("\n");
      return wrapTag("table", { ...block.attrs, ...marker }, `${cap}\n${body}\n`);
    }
    case "button": {
      if (!block.wrapperTag) return wrapTag("button", { ...block.attrs, ...marker }, block.label);
      const btn = wrapTag("button", block.attrs, block.label);
      return wrapTag(block.wrapperTag, { ...block.wrapperAttrs, ...marker }, `${block.beforeHtml}${btn}${block.afterHtml}`);
    }
    case "group": {
      const inner = block.children.map((c) => c.leadingHtml + renderBlock(c, opts)).join("") + block.trailingHtml;
      return wrapTag(block.tag, { ...block.attrs, ...marker }, inner);
    }
    case "custom":
    case "opaque":
    case "unsupported":
      return opts.mode === "preview" ? injectMarker(block.rawHtml, marker) : block.rawHtml;
  }
}

/** Add preview marker attributes to the root start tag of a verbatim HTML fragment. */
function injectMarker(rawHtml: string, marker: Record<string, string>): string {
  const m = rawHtml.match(/^(\s*)<([a-zA-Z][\w:-]*)/);
  if (!m) return rawHtml;
  const attrs = Object.entries(marker)
    .map(([k, v]) => ` ${k}="${escapeHtml(v)}"`)
    .join("");
  const idx = m[0].length;
  return rawHtml.slice(0, idx) + attrs + rawHtml.slice(idx);
}

export function renderBeat(beat: Beat, opts: CompileOptions): string {
  if (beat.hidden && opts.mode === "export") return beat.leadingHtml; // keep beat-local styles; drop the section
  const inner = beat.blocks.map((b) => b.leadingHtml + renderBlock(b, opts)).join("") + beat.trailingHtml;
  let body = inner;
  for (let i = beat.wrappers.length - 1; i >= 0; i--) {
    const w = beat.wrappers[i]!;
    body = `\n  ${openTag(w.tag, w.attrs)}${body}</${w.tag}>\n`;
  }
  const attrs: Record<string, string> = { ...beat.attrs, id: beat.id, "data-beat": beat.label };
  if (opts.mode === "preview") {
    attrs["data-lfs-beat"] = beat.id;
    if (beat.hidden) attrs["data-lfs-hidden"] = "true";
  }
  return beat.leadingHtml + wrapTag(beat.tag, attrs, body);
}

/**
 * Compile the canonical document to a full HTML page.
 * For imported lessons the shell (head, dock, scripts) is emitted verbatim from the original,
 * with the <title> patched in place, and beats are rebuilt between the shell halves.
 */
export function compileLesson(doc: LessonDocument, opts: CompileOptions): string {
  if (!doc.shell) throw new Error("compileLesson: documents without a shell are not supported yet (Phase 2 native renderer)");
  let pre = doc.shell.preHtml;
  if (doc.shell.titleOffset) {
    const [s, e] = doc.shell.titleOffset;
    pre = pre.slice(0, s) + escapeHtml(doc.title) + pre.slice(e);
  }
  let post = doc.shell.postHtml;
  if (opts.mode === "export" && opts.dropMissingScripts?.length) {
    for (const src of opts.dropMissingScripts) {
      post = post.replace(new RegExp(`<script[^>]*src=["']${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>\\s*</script>\\n?`, "g"), `<!-- lfs: removed unbundled script ${escapeHtml(src)} -->\n`);
    }
  }
  const beats = doc.beats.map((b) => renderBeat(b, opts)).join("");
  let html = pre + beats + post;

  const inject: string[] = [];
  if (opts.mode === "export" && (opts.standaloneShim ?? doc.runtime.standaloneShim)) inject.push(AEROLESSON_SHIM);
  if (opts.mode === "preview") {
    inject.push(PREVIEW_STYLE);
    if (opts.authorMode !== false) inject.push(`<script id="lfs-inspector-agent">${INSPECTOR_AGENT_SOURCE}</script>`);
  }
  if (inject.length) {
    // The shim must load before the lesson's inline scripts; the inspector agent after the body.
    const shimIdx = inject.findIndex((s) => s === AEROLESSON_SHIM);
    if (shimIdx >= 0) {
      const headClose = html.indexOf("</head>");
      html = headClose >= 0 ? html.slice(0, headClose) + AEROLESSON_SHIM + "\n" + html.slice(headClose) : AEROLESSON_SHIM + html;
      inject.splice(shimIdx, 1);
    }
    if (inject.length) {
      const bodyClose = html.lastIndexOf("</body>");
      html = bodyClose >= 0 ? html.slice(0, bodyClose) + inject.join("\n") + "\n" + html.slice(bodyClose) : html + inject.join("\n");
    }
  }
  return html;
}

export { VOID_TAGS };
