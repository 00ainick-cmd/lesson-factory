"use client";
import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff, MoveDown, MoveUp, Trash2 } from "lucide-react";
import type { Beat, Block } from "@/server/lesson/model";
import { useEditor } from "./store";
import { Badge } from "../ui";

const KIND_LABEL: Record<string, string> = { heading: "H", richtext: "¶", callout: "!", image: "img", table: "tbl", button: "btn", group: "grp", custom: "sim", opaque: "emb", unsupported: "?" };

function blockTitle(b: Block): string {
  const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  switch (b.kind) {
    case "heading":
      return strip(b.html) || `h${b.level}`;
    case "richtext":
    case "callout":
      return strip(b.html).slice(0, 60) || b.tag;
    case "image":
      return b.alt || b.src.split("/").pop() || "image";
    case "table":
      return `table · ${b.rows.length} rows`;
    case "button":
      return strip(b.label) || "button";
    case "group":
      return `${b.tag}${b.attrs.class ? "." + b.attrs.class.split(" ")[0] : ""} · ${b.children.length}`;
    case "custom":
      return b.label;
    case "opaque":
      return b.reason;
    case "unsupported":
      return "unsupported";
  }
}

export function BeatMap({ canWrite }: { canWrite: boolean }) {
  const doc = useEditor((s) => s.doc);
  const selectedBeatId = useEditor((s) => s.selectedBeatId);
  const selectedBlockId = useEditor((s) => s.selectedBlockId);
  const hoverBlockId = useEditor((s) => s.hoverBlockId);
  const select = useEditor((s) => s.select);
  const apply = useEditor((s) => s.apply);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  if (!doc) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line px-3">
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Beat map</span>
        <span className="font-mono text-[10.5px] text-faint">{doc.beats.length} beats</span>
      </div>
      <ol className="min-h-0 flex-1 overflow-auto scroll-thin py-1" aria-label="Beats and blocks">
        {doc.beats.map((beat, bi) => {
          const open = !collapsed[beat.id];
          const active = beat.id === selectedBeatId && !selectedBlockId;
          return (
            <li key={beat.id} className="px-1.5">
              <div className={clsx("group flex items-center gap-1 rounded px-1 py-1", active ? "bg-panel-2" : "hover:bg-panel")}>
                <button type="button" aria-label={open ? "Collapse" : "Expand"} aria-expanded={open} onClick={() => setCollapsed({ ...collapsed, [beat.id]: open })} className="text-faint hover:text-ink">{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</button>
                <button type="button" onClick={() => select(null, beat.id)} className="min-w-0 flex-1 text-left" aria-current={active ? "true" : undefined}>
                  <span className="mr-1.5 font-mono text-[10.5px] text-faint">{String(bi + 1).padStart(2, "0")}</span>
                  <span className={clsx("text-[12.5px] font-medium", beat.hidden && "line-through text-faint")}>{beat.label}</span>
                  <span className="ml-1.5 font-mono text-[10px] uppercase text-faint">{beat.typeKey ?? "—"}</span>
                </button>
                {canWrite && (
                  <span className="hidden items-center gap-0.5 group-hover:inline-flex">
                    <IconBtn label="Move beat up" disabled={bi === 0} onClick={() => apply([{ type: "move-beat", beatId: beat.id, toIndex: bi - 1 }])}><MoveUp size={12} /></IconBtn>
                    <IconBtn label="Move beat down" disabled={bi === doc.beats.length - 1} onClick={() => apply([{ type: "move-beat", beatId: beat.id, toIndex: bi + 1 }])}><MoveDown size={12} /></IconBtn>
                    <IconBtn label={beat.hidden ? "Show beat" : "Hide beat"} onClick={() => apply([{ type: "set-beat-hidden", beatId: beat.id, hidden: !beat.hidden }])}>{beat.hidden ? <EyeOff size={12} /> : <Eye size={12} />}</IconBtn>
                  </span>
                )}
              </div>
              {open && (
                <ol className="ml-4 border-l border-line pl-1.5">
                  {beat.blocks.map((b, i) => (
                    <BlockRow key={b.id} block={b} beat={beat} index={i} count={beat.blocks.length} depth={0} selectedBlockId={selectedBlockId} hoverBlockId={hoverBlockId} canWrite={canWrite} />
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function BlockRow({ block: b, beat, index, count, depth, selectedBlockId, hoverBlockId, canWrite }: { block: Block; beat: Beat; index: number; count: number; depth: number; selectedBlockId: string | null; hoverBlockId: string | null; canWrite: boolean }) {
  const select = useEditor((s) => s.select);
  const apply = useEditor((s) => s.apply);
  const active = b.id === selectedBlockId;
  const hovered = b.id === hoverBlockId;
  const tone = b.classification === "managed" ? "text-ok" : b.classification === "wrapped-custom" ? "text-gold" : "text-bad";
  return (
    <li>
      <div className={clsx("group flex items-center gap-1.5 rounded px-1.5 py-[3px]", active ? "bg-accent/15 ring-1 ring-accent/40" : hovered ? "bg-panel-2" : "hover:bg-panel")}>
        <button type="button" onClick={() => select(b.id, beat.id)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left" aria-current={active ? "true" : undefined}>
          <span className={clsx("w-6 shrink-0 font-mono text-[9.5px] uppercase", tone)}>{KIND_LABEL[b.kind]}</span>
          <span className={clsx("truncate text-[12px]", b.hidden ? "line-through text-faint" : "text-ink/90")}>{blockTitle(b)}</span>
        </button>
        {canWrite && (
          <span className="hidden shrink-0 items-center gap-0.5 group-hover:inline-flex">
            <IconBtn label="Move up" disabled={index === 0} onClick={() => apply([{ type: "move-block", blockId: b.id, direction: "up" }])}><MoveUp size={11} /></IconBtn>
            <IconBtn label="Move down" disabled={index === count - 1} onClick={() => apply([{ type: "move-block", blockId: b.id, direction: "down" }])}><MoveDown size={11} /></IconBtn>
            <IconBtn label="Duplicate" onClick={() => apply([{ type: "duplicate-block", blockId: b.id }])}><Copy size={11} /></IconBtn>
            <IconBtn label={b.hidden ? "Show" : "Hide"} onClick={() => apply([{ type: "set-block-hidden", blockId: b.id, hidden: !b.hidden }])}>{b.hidden ? <EyeOff size={11} /> : <Eye size={11} />}</IconBtn>
            <IconBtn label="Delete" onClick={() => confirm(`Delete this ${b.kind} block? You can undo.`) && apply([{ type: "delete-block", blockId: b.id }])}><Trash2 size={11} /></IconBtn>
          </span>
        )}
      </div>
      {b.kind === "group" && depth < 3 && (
        <ol className="ml-3 border-l border-line/60 pl-1">
          {b.children.map((c, i) => <BlockRow key={c.id} block={c} beat={beat} index={i} count={b.children.length} depth={depth + 1} selectedBlockId={selectedBlockId} hoverBlockId={hoverBlockId} canWrite={canWrite} />)}
        </ol>
      )}
    </li>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={(e) => { e.stopPropagation(); onClick(); }} className="rounded p-0.5 text-faint hover:bg-rail hover:text-ink disabled:opacity-30">
      {children}
    </button>
  );
}

export function ClassBadge({ c }: { c: string }) {
  return <Badge tone={c === "managed" ? "ok" : c === "wrapped-custom" ? "gold" : "bad"}>{c}</Badge>;
}
