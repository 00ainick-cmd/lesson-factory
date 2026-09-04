"use client";
import { create } from "zustand";
import type { Block, LessonDocument } from "@/server/lesson/model";
import { findBlock } from "@/server/lesson/model";
import { applyOp, type Op } from "@/server/lesson/ops";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";
export type Live = { patch: string[]; reload: boolean };

type State = {
  projectId: string;
  wsId: string;
  doc: LessonDocument | null;
  revision: number;
  past: LessonDocument[];
  future: LessonDocument[];
  lastCoalesce: { key: string; at: number } | null;
  selectedBlockId: string | null;
  selectedBeatId: string | null;
  hoverBlockId: string | null;
  saveState: SaveState;
  saveError: string | null;
  pendingOpTypes: string[];
  live: Live; // preview work queued since last flush
  liveSeq: number; // bumps whenever live changes so effects can react
  scrollY: number;
  previewErrors: { message: string; at: number }[];
  rightTab: "inspector" | "copilot";
  previewMode: "author" | "learner";

  init: (p: { projectId: string; wsId: string; doc: LessonDocument; revision: number }) => void;
  replaceDoc: (doc: LessonDocument, revision: number) => void;
  apply: (ops: Op[], opts?: { coalesceKey?: string; live?: Partial<Live> }) => void;
  undo: () => void;
  redo: () => void;
  select: (blockId: string | null, beatId?: string | null) => void;
  setHover: (blockId: string | null) => void;
  setSave: (s: SaveState, err?: string | null) => void;
  markSaved: (revision: number) => void;
  takeLive: () => Live;
  takeOpTypes: () => string[];
  setScrollY: (y: number) => void;
  pushPreviewError: (m: string) => void;
  setRightTab: (t: "inspector" | "copilot") => void;
  setPreviewMode: (m: "author" | "learner") => void;
};

const MANAGED_LIVE_KINDS = new Set(["heading", "richtext", "callout", "image", "table", "button", "group"]);

/** Decide how the preview should reflect an op without a full reload where possible. */
function liveFor(doc: LessonDocument, op: Op): Partial<Live> {
  switch (op.type) {
    case "update-block":
    case "set-block-hidden": {
      const loc = findBlock(doc, op.blockId);
      const b: Block | undefined = loc?.block;
      if (b && MANAGED_LIVE_KINDS.has(b.kind)) return { patch: [op.blockId] };
      return { reload: true };
    }
    case "set-title":
    case "update-beat":
    case "set-runtime":
      return {};
    default:
      return { reload: true };
  }
}

export const useEditor = create<State>((set, get) => ({
  projectId: "",
  wsId: "",
  doc: null,
  revision: 0,
  past: [],
  future: [],
  lastCoalesce: null,
  selectedBlockId: null,
  selectedBeatId: null,
  hoverBlockId: null,
  saveState: "idle",
  saveError: null,
  pendingOpTypes: [],
  live: { patch: [], reload: false },
  liveSeq: 0,
  scrollY: 0,
  previewErrors: [],
  rightTab: "inspector",
  previewMode: "author",

  init: ({ projectId, wsId, doc, revision }) => set({ projectId, wsId, doc, revision, past: [], future: [], saveState: "idle", selectedBlockId: null, selectedBeatId: doc.beats[0]?.id ?? null }),
  replaceDoc: (doc, revision) => set((s) => ({ doc, revision, past: [], future: [], saveState: "idle", pendingOpTypes: [], live: { patch: s.live.patch, reload: true }, liveSeq: s.liveSeq + 1 })),

  apply: (ops, opts = {}) => {
    const s = get();
    if (!s.doc) return;
    let next = s.doc;
    const live: Live = { ...s.live, patch: [...s.live.patch] };
    for (const op of ops) {
      const l = liveFor(next, op);
      next = applyOp(next, op, { provenance: { origin: "author", at: new Date().toISOString() } });
      if (l.reload) live.reload = true;
      for (const id of l.patch ?? []) if (!live.patch.includes(id)) live.patch.push(id);
    }
    const now = Date.now();
    const coalesce = opts.coalesceKey && s.lastCoalesce && s.lastCoalesce.key === opts.coalesceKey && now - s.lastCoalesce.at < 2500;
    set({
      doc: next,
      past: coalesce ? s.past : [...s.past.slice(-99), s.doc],
      future: [],
      lastCoalesce: opts.coalesceKey ? { key: opts.coalesceKey, at: now } : null,
      saveState: "dirty",
      pendingOpTypes: [...s.pendingOpTypes, ...ops.map((o) => o.type)],
      live: { ...live, ...(opts.live ?? {}) , patch: [...live.patch, ...(opts.live?.patch ?? [])] },
      liveSeq: s.liveSeq + 1,
    });
  },
  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev || !s.doc) return;
    set({ doc: prev, past: s.past.slice(0, -1), future: [s.doc, ...s.future], lastCoalesce: null, saveState: "dirty", pendingOpTypes: [...s.pendingOpTypes, "undo"], live: { patch: [], reload: true }, liveSeq: s.liveSeq + 1 });
  },
  redo: () => {
    const s = get();
    const nxt = s.future[0];
    if (!nxt || !s.doc) return;
    set({ doc: nxt, past: [...s.past, s.doc], future: s.future.slice(1), lastCoalesce: null, saveState: "dirty", pendingOpTypes: [...s.pendingOpTypes, "redo"], live: { patch: [], reload: true }, liveSeq: s.liveSeq + 1 });
  },
  select: (blockId, beatId) => {
    const s = get();
    let beat = beatId ?? null;
    if (blockId && !beat && s.doc) beat = findBlock(s.doc, blockId)?.beat.id ?? null;
    set({ selectedBlockId: blockId, selectedBeatId: beat ?? s.selectedBeatId, rightTab: "inspector" });
  },
  setHover: (hoverBlockId) => set({ hoverBlockId }),
  setSave: (saveState, saveError = null) => set({ saveState, saveError }),
  markSaved: (revision) => set((s) => ({ revision, saveState: s.saveState === "dirty" ? "dirty" : "saved" })),
  takeLive: () => {
    const l = get().live;
    set({ live: { patch: [], reload: false } });
    return l;
  },
  takeOpTypes: () => {
    const t = get().pendingOpTypes;
    set({ pendingOpTypes: [] });
    return t;
  },
  setScrollY: (scrollY) => set({ scrollY }),
  pushPreviewError: (message) => set((s) => ({ previewErrors: [...s.previewErrors.slice(-19), { message, at: Date.now() }] })),
  setRightTab: (rightTab) => set({ rightTab }),
  setPreviewMode: (previewMode) => set((s) => ({ previewMode, live: { ...s.live, reload: true }, liveSeq: s.liveSeq + 1 })),
}));
