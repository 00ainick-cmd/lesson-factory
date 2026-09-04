"use client";
import { useEffect, useState } from "react";
import type { Beat, Block, LessonDocument, TableRow } from "@/server/lesson/model";
import { findBlock } from "@/server/lesson/model";
import type { Op } from "@/server/lesson/ops";
import { useEditor } from "./store";
import { RichEditor } from "./rich-editor";
import { ClassBadge } from "./beat-map";
import { Badge, Field, Input, Select, Textarea } from "../ui";
import { api } from "@/lib/api";

export function Inspector({ canWrite, beatTypes, objectives }: { canWrite: boolean; beatTypes: { key: string; name: string }[]; objectives: { code: string; wording: string }[] }) {
  const doc = useEditor((s) => s.doc);
  const selectedBlockId = useEditor((s) => s.selectedBlockId);
  const selectedBeatId = useEditor((s) => s.selectedBeatId);
  if (!doc) return null;
  const loc = selectedBlockId ? findBlock(doc, selectedBlockId) : null;
  const beat = loc?.beat ?? doc.beats.find((b) => b.id === selectedBeatId) ?? null;
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b border-line px-3">
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Inspector</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto scroll-thin p-3 space-y-4">
        {loc ? <BlockPanel key={loc.block.id} block={loc.block} beat={loc.beat} doc={doc} canWrite={canWrite} /> : beat ? <BeatPanel key={beat.id} beat={beat} index={doc.beats.findIndex((b) => b.id === beat.id)} canWrite={canWrite} beatTypes={beatTypes} objectives={objectives} /> : <p className="text-[13px] text-muted">Click a region in the preview or pick a beat in the map.</p>}
        {loc && beat && (
          <details className="rounded border border-line">
            <summary className="cursor-pointer px-3 py-2 text-[12px] text-muted">Parent beat: {beat.label}</summary>
            <div className="border-t border-line p-3"><BeatPanel beat={beat} index={doc.beats.findIndex((b) => b.id === beat.id)} canWrite={canWrite} beatTypes={beatTypes} objectives={objectives} compact /></div>
          </details>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-faint">{title}</h3>
      {children}
    </section>
  );
}

function BeatPanel({ beat, index, canWrite, beatTypes, objectives, compact }: { beat: Beat; index: number; canWrite: boolean; beatTypes: { key: string; name: string }[]; objectives: { code: string; wording: string }[]; compact?: boolean }) {
  const apply = useEditor((s) => s.apply);
  const up = (patch: Record<string, unknown>, key: string) => apply([{ type: "update-beat", beatId: beat.id, patch } as Op], { coalesceKey: `beat:${beat.id}:${key}` });
  const ro = !canWrite;
  return (
    <div className="space-y-3">
      {!compact && (
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Beat {String(index + 1).padStart(2, "0")} · {beat.id}</p>
          <div className="mt-1 flex flex-wrap gap-1.5"><Badge tone="accent">gate: {beat.gate.kind}{beat.gate.need ? ` ${beat.gate.need}` : ""}</Badge>{beat.typeConfidence != null && <Badge tone="info">type {Math.round(beat.typeConfidence * 100)}%</Badge>}{beat.hidden && <Badge tone="bad">hidden</Badge>}</div>
        </div>
      )}
      <Field label="Label" id="b-label"><Input id="b-label" readOnly={ro} defaultValue={beat.label} onChange={(e) => up({ label: e.target.value }, "label")} /></Field>
      <Field label="Beat type" id="b-type">
        <Select id="b-type" disabled={ro} value={beat.typeKey ?? ""} onChange={(e) => up({ typeKey: e.target.value || undefined }, "type")}>
          <option value="">— unclassified —</option>
          {beatTypes.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
        </Select>
      </Field>
      <Field label="Instructional purpose" id="b-purpose" hint="Why this beat exists: what the learner should be able to do after it."><Textarea id="b-purpose" rows={2} readOnly={ro} defaultValue={beat.purpose ?? ""} onChange={(e) => up({ purpose: e.target.value }, "purpose")} /></Field>
      <Field label="Objective codes" id="b-obj" hint="Comma-separated codes from the workspace objective register.">
        <Input id="b-obj" readOnly={ro} defaultValue={beat.objectiveCodes.join(", ")} list="objective-codes" onChange={(e) => up({ objectiveCodes: e.target.value.split(/[,\s]+/).filter(Boolean) }, "obj")} />
        <datalist id="objective-codes">{objectives.map((o) => <option key={o.code} value={o.code}>{o.wording.slice(0, 80)}</option>)}</datalist>
      </Field>
      <Field label="Learner action" id="b-action"><Input id="b-action" readOnly={ro} defaultValue={beat.learnerAction ?? ""} onChange={(e) => up({ learnerAction: e.target.value }, "action")} /></Field>
      <Field label="Completion evidence" id="b-evidence"><Input id="b-evidence" readOnly={ro} defaultValue={beat.completionEvidence ?? ""} onChange={(e) => up({ completionEvidence: e.target.value }, "evidence")} /></Field>
      {!compact && beat.source && <SourceInfo source={beat.source} />}
    </div>
  );
}

function BlockPanel({ block, beat, doc, canWrite }: { block: Block; beat: Beat; doc: LessonDocument; canWrite: boolean }) {
  const apply = useEditor((s) => s.apply);
  const patch = (p: Record<string, unknown>, key: string) => apply([{ type: "update-block", blockId: block.id, patch: p } as Op], { coalesceKey: `block:${block.id}:${key}` });
  const ro = !canWrite;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-[14px] font-semibold capitalize">{block.kind === "custom" ? "Custom interactive" : block.kind}</p>
          <ClassBadge c={block.classification} />
        </div>
        <p className="font-mono text-[10.5px] text-faint">{block.id}{block.hidden ? " · hidden" : ""}{block.complex ? " · complex markup" : ""}</p>
      </div>

      {block.kind === "heading" && (
        <>
          <Field label="Level" id="h-level"><Select id="h-level" disabled={ro} value={block.level} onChange={(e) => patch({ level: Number(e.target.value) }, "level")}>{[1, 2, 3, 4, 5, 6].map((l) => <option key={l} value={l}>h{l}</option>)}</Select></Field>
          <Field label="Heading text" id="h-html"><Input id="h-html" readOnly={ro} defaultValue={block.html} onChange={(e) => patch({ html: e.target.value }, "html")} /></Field>
        </>
      )}
      {(block.kind === "richtext" || block.kind === "callout") && (
        <Section title={block.kind === "callout" ? `Callout${block.variant ? ` · ${block.variant}` : ""}` : `Rich text · <${block.tag}>`}>
          {block.complex ? (
            <Textarea aria-label="HTML source" readOnly={ro} rows={8} className="font-mono text-[12px]" defaultValue={block.html} onChange={(e) => patch({ html: e.target.value }, "html")} />
          ) : (
            <RichEditor html={block.html} tag={block.tag} disabled={ro} onChange={(h) => patch({ html: h }, "html")} />
          )}
          {block.kind === "callout" && <Field label="Variant" id="c-variant"><Input id="c-variant" readOnly={ro} defaultValue={block.variant ?? ""} onChange={(e) => patch({ variant: e.target.value }, "variant")} /></Field>}
          {block.complex && <p className="mt-1 text-[11.5px] text-faint">This region contains nested or SVG markup, so it is edited as HTML source to avoid losing structure.</p>}
        </Section>
      )}
      {block.kind === "image" && (
        <>
          <Field label="Alt text" id="i-alt" hint="Describe the instructional content of the image. Leave empty only for decorative images."><Textarea id="i-alt" rows={2} readOnly={ro} defaultValue={block.alt} onChange={(e) => patch({ alt: e.target.value }, "alt")} /></Field>
          <Field label="Source" id="i-src"><Input id="i-src" readOnly={ro} defaultValue={block.src} onChange={(e) => patch({ src: e.target.value }, "src")} /></Field>
          {block.wrapperTag && <Field label="Caption" id="i-cap"><Input id="i-cap" readOnly={ro} defaultValue={block.captionHtml ?? ""} onChange={(e) => patch({ captionHtml: e.target.value }, "cap")} /></Field>}
        </>
      )}
      {block.kind === "table" && <TableEditor rows={block.rows} caption={block.captionHtml} ro={ro} onRows={(rows) => patch({ rows }, "rows")} onCaption={(c) => patch({ captionHtml: c }, "caption")} />}
      {block.kind === "button" && (
        <Field label="Button label" id="btn-label" hint="Only the visible label is editable; the button's handlers and attributes are preserved."><Input id="btn-label" readOnly={ro} defaultValue={block.label} onChange={(e) => patch({ label: e.target.value }, "label")} /></Field>
      )}
      {block.kind === "group" && <p className="text-[12.5px] text-muted">Container with {block.children.length} child blocks. Select a child in the map or preview to edit it.</p>}
      {(block.kind === "custom" || block.kind === "opaque" || block.kind === "unsupported") && <CustomPanel block={block} canWrite={canWrite} />}

      <Section title="Source">
        <dl className="grid grid-cols-[88px_1fr] gap-y-1 text-[12px]">
          <dt className="text-faint">Beat</dt><dd>{beat.label}</dd>
          {block.attrs.id && <><dt className="text-faint">id</dt><dd className="font-mono">{block.attrs.id}</dd></>}
          {block.attrs.class && <><dt className="text-faint">classes</dt><dd className="font-mono break-all">{block.attrs.class}</dd></>}
          {Object.entries(block.attrs).filter(([k]) => k.startsWith("data-")).map(([k, v]) => <><dt key={k + "k"} className="text-faint font-mono">{k}</dt><dd key={k + "v"} className="font-mono break-all">{v}</dd></>)}
          {block.provenance && <><dt className="text-faint">provenance</dt><dd>{block.provenance.origin}{block.provenance.proposalId ? " (proposal)" : ""} · {new Date(block.provenance.at).toLocaleString()}</dd></>}
        </dl>
        {block.source && <SourceInfo source={block.source} />}
      </Section>
      {doc.beats.length === 0 && null}
    </div>
  );
}

function SourceInfo({ source }: { source: NonNullable<Block["source"]> }) {
  return (
    <div className="mt-2 rounded border border-line bg-rail p-2 text-[11.5px]">
      <p className="break-all font-mono text-muted">{source.domPath}</p>
      <p className="mt-1 font-mono text-faint">original lines {source.lineStart ?? "?"}–{source.lineEnd ?? "?"}{source.confidence < 1 ? ` · confidence ${Math.round(source.confidence * 100)}%` : ""}</p>
      {source.relatedScripts.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer text-gold">Referenced by {source.relatedScripts.length} script location{source.relatedScripts.length > 1 ? "s" : ""}</summary>
          <ul className="mt-1 space-y-1">{source.relatedScripts.map((r, i) => <li key={i} className="font-mono text-faint">script #{r.scriptIndex} line {r.line} · {r.via}<br /><span className="text-muted">{r.snippet}</span></li>)}</ul>
        </details>
      )}
    </div>
  );
}

function TableEditor({ rows, caption, ro, onRows, onCaption }: { rows: TableRow[]; caption?: string; ro: boolean; onRows: (r: TableRow[]) => void; onCaption: (c: string) => void }) {
  const [local, setLocal] = useState(rows);
  const setCell = (ri: number, ci: number, html: string) => {
    const next = local.map((r, i) => (i === ri ? { ...r, cells: r.cells.map((c, j) => (j === ci ? { ...c, html } : c)) } : r));
    setLocal(next);
    onRows(next);
  };
  return (
    <Section title={`Table · ${rows.length} rows`}>
      {caption !== undefined && <Field label="Caption" id="t-cap"><Input id="t-cap" readOnly={ro} defaultValue={caption} onChange={(e) => onCaption(e.target.value)} /></Field>}
      <div className="mt-2 overflow-auto rounded border border-line">
        <table className="w-full text-[12px]">
          <tbody>
            {local.map((r, ri) => (
              <tr key={ri} className="border-b border-line/60 last:border-0">
                {r.cells.map((c, ci) => (
                  <td key={ci} className={`p-0 ${c.header ? "bg-panel-2" : ""}`}>
                    <input aria-label={`Row ${ri + 1} cell ${ci + 1}`} readOnly={ro} value={c.html} onChange={(e) => setCell(ri, ci, e.target.value)} className={`w-full min-w-[80px] bg-transparent px-2 py-1 font-mono text-[11.5px] outline-none focus:bg-rail ${c.header ? "font-semibold" : ""}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[11px] text-faint">Cell contents are inline HTML. Row/column structure is preserved.</p>
    </Section>
  );
}

type Leaf = { index: number; tag: string; kind: "text" | "image"; id?: string; classes: string[]; html: string; alt?: string; src?: string; scripted: boolean };

function CustomPanel({ block, canWrite }: { block: Extract<Block, { kind: "custom" | "opaque" | "unsupported" }>; canWrite: boolean }) {
  const projectId = useEditor((s) => s.projectId);
  const apply = useEditor((s) => s.apply);
  const [leaves, setLeaves] = useState<Leaf[] | null>(null);
  const [showSource, setShowSource] = useState(false);
  useEffect(() => {
    let alive = true;
    api<{ leaves: Leaf[] }>(`/api/projects/${projectId}/leaves?blockId=${encodeURIComponent(block.id)}`).then((r) => alive && setLeaves(r.leaves)).catch(() => alive && setLeaves([]));
    return () => {
      alive = false;
    };
  }, [projectId, block.id, block.rawHtml]);
  const editable = leaves?.filter((l) => !l.scripted) ?? [];
  return (
    <>
      {block.kind === "custom" && (
        <Section title="Wrapped custom interaction">
          <p className="text-[12.5px] text-muted">Preserved verbatim from the original; scripts and structure are never rewritten. Only safe text and image leaves are editable.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{block.reasons.map((r) => <Badge key={r} tone="gold">{r}</Badge>)}</div>
          {block.interactionIds.length > 0 && <p className="mt-2 font-mono text-[11px] text-faint">script-bound ids: {block.interactionIds.join(", ")}</p>}
          {block.eventContract && (block.eventContract.declared.length > 0 || block.eventContract.detected.length > 0) && (
            <p className="mt-1 font-mono text-[11px] text-faint">events · declared: {block.eventContract.declared.join(", ") || "—"} · detected: {block.eventContract.detected.join(", ") || "—"}</p>
          )}
        </Section>
      )}
      {block.kind === "opaque" && <Section title="Opaque embed"><p className="text-[12.5px] text-muted">{block.reason}. Kept byte-for-byte; not editable in the inspector.</p></Section>}
      {block.kind === "unsupported" && <Section title="Unsupported / risky"><p className="text-[12.5px] text-bad">Kept verbatim. Review before export.</p></Section>}
      <Section title={`Editable leaves (${editable.length}${leaves && leaves.length !== editable.length ? ` of ${leaves.length}` : ""})`}>
        {leaves === null ? <p className="text-[12px] text-faint">Scanning…</p> : editable.length === 0 ? <p className="text-[12px] text-faint">No safely editable text found. Script-written regions are locked.</p> : (
          <ul className="space-y-2">
            {editable.map((l) => (
              <li key={l.index} className="rounded border border-line bg-rail p-2">
                <p className="mb-1 font-mono text-[10.5px] text-faint">&lt;{l.tag}&gt;{l.id ? `#${l.id}` : ""}{l.classes.length ? `.${l.classes[0]}` : ""}</p>
                {l.kind === "text" ? (
                  <Textarea aria-label={`Text leaf ${l.index}`} rows={Math.min(6, Math.max(1, Math.ceil(l.html.length / 48)))} readOnly={!canWrite} defaultValue={l.html} className="font-mono text-[12px]" onChange={(e) => apply([{ type: "leaf-edit", blockId: block.id, leafIndex: l.index, html: e.target.value }], { coalesceKey: `leaf:${block.id}:${l.index}` })} />
                ) : (
                  <Field label={`Alt text · ${l.src?.split("/").pop() ?? "image"}`} id={`leaf-${l.index}`}><Input id={`leaf-${l.index}`} readOnly={!canWrite} defaultValue={l.alt ?? ""} onChange={(e) => apply([{ type: "leaf-edit", blockId: block.id, leafIndex: l.index, alt: e.target.value }], { coalesceKey: `leaf:${block.id}:${l.index}` })} /></Field>
                )}
              </li>
            ))}
          </ul>
        )}
        {leaves && leaves.some((l) => l.scripted) && <p className="mt-2 text-[11px] text-faint">{leaves.filter((l) => l.scripted).length} leaves are written by scripts and locked.</p>}
      </Section>
      <button type="button" className="text-[12px] text-muted underline" onClick={() => setShowSource(!showSource)}>{showSource ? "Hide" : "Show"} verbatim source ({block.rawHtml.length.toLocaleString()} chars)</button>
      {showSource && <pre className="max-h-72 overflow-auto rounded border border-line bg-rail p-2 font-mono text-[11px] leading-snug text-muted scroll-thin">{block.rawHtml}</pre>}
    </>
  );
}
