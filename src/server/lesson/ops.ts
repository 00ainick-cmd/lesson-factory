import { z } from "zod";
import { nanoid } from "nanoid";
import { findBeat, findBlock, TableRowSchema, type Block, type LessonDocument, type Provenance } from "./model";
import { applyLeafEdit } from "./leaves";

/**
 * Document operations. Pure functions over the canonical model, shared by the editor (optimistic
 * local application, undo/redo) and the server (validation, Copilot proposal acceptance).
 */
export const OpSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("set-title"), title: z.string().min(1).max(300) }),
  z.object({
    type: z.literal("update-block"),
    blockId: z.string(),
    patch: z.object({
      html: z.string().optional(),
      level: z.number().min(1).max(6).optional(),
      alt: z.string().optional(),
      src: z.string().optional(),
      captionHtml: z.string().optional(),
      label: z.string().optional(),
      rows: z.array(TableRowSchema).optional(),
      variant: z.string().optional(),
    }),
  }),
  z.object({ type: z.literal("leaf-edit"), blockId: z.string(), leafIndex: z.number().int().min(0), html: z.string().optional(), alt: z.string().optional() }),
  z.object({ type: z.literal("set-block-hidden"), blockId: z.string(), hidden: z.boolean() }),
  z.object({ type: z.literal("delete-block"), blockId: z.string() }),
  z.object({ type: z.literal("duplicate-block"), blockId: z.string() }),
  z.object({ type: z.literal("move-block"), blockId: z.string(), direction: z.enum(["up", "down"]) }),
  z.object({
    type: z.literal("update-beat"),
    beatId: z.string(),
    patch: z.object({
      label: z.string().min(1).max(120).optional(),
      typeKey: z.string().optional(),
      purpose: z.string().optional(),
      objectiveCodes: z.array(z.string()).optional(),
      learnerAction: z.string().optional(),
      completionEvidence: z.string().optional(),
    }),
  }),
  z.object({ type: z.literal("set-beat-hidden"), beatId: z.string(), hidden: z.boolean() }),
  z.object({ type: z.literal("move-beat"), beatId: z.string(), toIndex: z.number().int().min(0) }),
  z.object({ type: z.literal("duplicate-beat"), beatId: z.string() }),
  z.object({ type: z.literal("delete-beat"), beatId: z.string() }),
  z.object({ type: z.literal("set-runtime"), standaloneShim: z.boolean() }),
]);
export type Op = z.infer<typeof OpSchema>;

export class OpError extends Error {}

export type OpContext = { provenance?: Provenance };

function clone<T>(v: T): T {
  return structuredClone(v);
}

function mark(block: Block, ctx: OpContext) {
  if (ctx.provenance) block.provenance = ctx.provenance;
}

function editableHtml(block: Block): string {
  if (block.kind === "custom" || block.kind === "opaque" || block.kind === "unsupported") return block.rawHtml;
  if (block.kind === "richtext" || block.kind === "callout" || block.kind === "heading") return block.html;
  throw new OpError(`Block kind ${block.kind} has no leaf-editable HTML`);
}

function reId(block: Block): Block {
  const next = clone(block);
  const stamp = nanoid(6);
  next.id = `${block.id}-copy-${stamp}`;
  if (next.attrs.id) next.attrs.id = `${next.attrs.id}-copy-${stamp}`;
  if (next.kind === "group") next.children = next.children.map(reId);
  return next;
}

export function applyOp(input: LessonDocument, op: Op, ctx: OpContext = {}): LessonDocument {
  const doc = clone(input);
  switch (op.type) {
    case "set-title":
      doc.title = op.title;
      return doc;
    case "set-runtime":
      doc.runtime.standaloneShim = op.standaloneShim;
      return doc;
    case "update-block": {
      const hit = findBlock(doc, op.blockId);
      if (!hit) throw new OpError(`Block ${op.blockId} not found`);
      const b = hit.block;
      if (b.classification !== "managed") throw new OpError("Only managed blocks accept structured edits; use leaf-edit for custom regions");
      const p = op.patch;
      switch (b.kind) {
        case "heading":
          if (p.html !== undefined) b.html = p.html;
          if (p.level !== undefined) b.level = p.level;
          break;
        case "richtext":
          if (p.html !== undefined) b.html = p.html;
          break;
        case "callout":
          if (p.html !== undefined) b.html = p.html;
          if (p.variant !== undefined) b.variant = p.variant;
          break;
        case "image":
          if (p.alt !== undefined) b.alt = p.alt;
          if (p.src !== undefined) b.src = p.src;
          if (p.captionHtml !== undefined) b.captionHtml = p.captionHtml;
          break;
        case "table":
          if (p.rows !== undefined) b.rows = p.rows;
          if (p.captionHtml !== undefined) b.captionHtml = p.captionHtml;
          break;
        case "button":
          if (p.label !== undefined) b.label = p.label;
          break;
        case "group":
          throw new OpError("Edit the children of a group, not the group itself");
        default:
          throw new OpError(`Block kind ${b.kind} is not editable`);
      }
      mark(b, ctx);
      return doc;
    }
    case "leaf-edit": {
      const hit = findBlock(doc, op.blockId);
      if (!hit) throw new OpError(`Block ${op.blockId} not found`);
      const b = hit.block;
      if (b.kind === "unsupported") throw new OpError("Unsupported regions are read-only");
      const html = editableHtml(b);
      const next = applyLeafEdit(html, { leafIndex: op.leafIndex, html: op.html, alt: op.alt });
      if (b.kind === "custom" || b.kind === "opaque") b.rawHtml = next;
      else if (b.kind === "richtext" || b.kind === "callout" || b.kind === "heading") b.html = next;
      mark(b, ctx);
      return doc;
    }
    case "set-block-hidden": {
      const hit = findBlock(doc, op.blockId);
      if (!hit) throw new OpError(`Block ${op.blockId} not found`);
      hit.block.hidden = op.hidden;
      return doc;
    }
    case "delete-block": {
      const hit = findBlock(doc, op.blockId);
      if (!hit) throw new OpError(`Block ${op.blockId} not found`);
      hit.parent.splice(hit.blockIndex, 1);
      return doc;
    }
    case "duplicate-block": {
      const hit = findBlock(doc, op.blockId);
      if (!hit) throw new OpError(`Block ${op.blockId} not found`);
      if (hit.block.classification !== "managed") throw new OpError("Custom interactions cannot be duplicated: their scripts are bound to unique element ids");
      const copy = reId(hit.block);
      mark(copy, ctx);
      hit.parent.splice(hit.blockIndex + 1, 0, copy);
      return doc;
    }
    case "move-block": {
      const hit = findBlock(doc, op.blockId);
      if (!hit) throw new OpError(`Block ${op.blockId} not found`);
      const to = op.direction === "up" ? hit.blockIndex - 1 : hit.blockIndex + 1;
      if (to < 0 || to >= hit.parent.length) return doc;
      const [b] = hit.parent.splice(hit.blockIndex, 1);
      hit.parent.splice(to, 0, b!);
      return doc;
    }
    case "update-beat": {
      const hit = findBeat(doc, op.beatId);
      if (!hit) throw new OpError(`Beat ${op.beatId} not found`);
      Object.assign(hit.beat, Object.fromEntries(Object.entries(op.patch).filter(([, v]) => v !== undefined)));
      if (ctx.provenance) hit.beat.provenance = ctx.provenance;
      return doc;
    }
    case "set-beat-hidden": {
      const hit = findBeat(doc, op.beatId);
      if (!hit) throw new OpError(`Beat ${op.beatId} not found`);
      hit.beat.hidden = op.hidden;
      return doc;
    }
    case "move-beat": {
      const hit = findBeat(doc, op.beatId);
      if (!hit) throw new OpError(`Beat ${op.beatId} not found`);
      const to = Math.min(Math.max(op.toIndex, 0), doc.beats.length - 1);
      const [b] = doc.beats.splice(hit.index, 1);
      doc.beats.splice(to, 0, b!);
      return doc;
    }
    case "duplicate-beat": {
      const hit = findBeat(doc, op.beatId);
      if (!hit) throw new OpError(`Beat ${op.beatId} not found`);
      const hasCustom = (list: Block[]): boolean => list.some((b) => b.classification !== "managed" || (b.kind === "group" && hasCustom(b.children)));
      if (hasCustom(hit.beat.blocks)) throw new OpError("Beats that contain custom interactions cannot be duplicated in this phase");
      const copy = clone(hit.beat);
      const stamp = nanoid(6);
      copy.id = `${hit.beat.id}-copy-${stamp}`;
      copy.label = `${hit.beat.label} (copy)`;
      copy.blocks = copy.blocks.map(reId);
      if (copy.gate.clearId) copy.gate.clearId = copy.id;
      if (ctx.provenance) copy.provenance = ctx.provenance;
      doc.beats.splice(hit.index + 1, 0, copy);
      return doc;
    }
    case "delete-beat": {
      const hit = findBeat(doc, op.beatId);
      if (!hit) throw new OpError(`Beat ${op.beatId} not found`);
      if (doc.beats.length === 1) throw new OpError("A lesson needs at least one beat");
      doc.beats.splice(hit.index, 1);
      return doc;
    }
  }
}

export function applyOps(doc: LessonDocument, ops: Op[], ctx: OpContext = {}): LessonDocument {
  return ops.reduce((d, op) => applyOp(d, op, ctx), doc);
}
