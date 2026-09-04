import { z } from "zod";

/**
 * Canonical lesson document.
 *
 * This is the project's source of truth. Raw HTML is never the only representation: managed
 * blocks carry structured content, and custom / opaque regions carry verbatim HTML plus a
 * source reference so they can be written back without loss (see docs/decisions.md D3).
 */

export const SourceRefSchema = z.object({
  domPath: z.string(), // e.g. body > section#bench > div.wrap > p:nth-of-type(2)
  nodeIndexPath: z.array(z.number()), // child-index path from <html>, stable against the original
  elementId: z.string().optional(),
  tag: z.string(),
  classes: z.array(z.string()).default([]),
  dataAttrs: z.record(z.string(), z.string()).default({}),
  lineStart: z.number().optional(),
  lineEnd: z.number().optional(),
  startOffset: z.number().optional(),
  endOffset: z.number().optional(),
  relatedScripts: z
    .array(z.object({ scriptIndex: z.number(), line: z.number(), snippet: z.string(), via: z.string() }))
    .default([]),
  confidence: z.number().min(0).max(1).default(1),
});
export type SourceRef = z.infer<typeof SourceRefSchema>;

export const ClassificationSchema = z.enum(["managed", "wrapped-custom", "opaque-embed", "unsupported"]);
export type Classification = z.infer<typeof ClassificationSchema>;

export const ProvenanceSchema = z.object({
  origin: z.enum(["import", "author", "copilot"]),
  at: z.string(),
  userId: z.string().optional(),
  copilotRunId: z.string().optional(),
  proposalId: z.string().optional(),
  promptVersion: z.string().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

const attrs = z.record(z.string(), z.string());

const BlockBase = {
  id: z.string(),
  classification: ClassificationSchema,
  hidden: z.boolean().default(false),
  attrs: attrs.default({}), // attributes of the block's root element (kept verbatim on export)
  leadingHtml: z.string().default(""), // whitespace / comments that preceded the block in the source
  complex: z.boolean().default(false), // contains SVG or nested markup; edit as HTML source, not rich text
  source: SourceRefSchema.optional(),
  provenance: ProvenanceSchema.optional(),
  a11y: z
    .object({
      exceptions: z.array(z.object({ ruleKey: z.string(), reason: z.string() })).default([]),
    })
    .default({ exceptions: [] }),
};

export const HeadingBlock = z.object({
  ...BlockBase,
  kind: z.literal("heading"),
  level: z.number().min(1).max(6),
  html: z.string(), // inline HTML (strong, em, span allowed)
});
export const RichTextBlock = z.object({
  ...BlockBase,
  kind: z.literal("richtext"),
  tag: z.string(), // p | ul | ol | blockquote | div
  html: z.string(),
});
export const CalloutBlock = z.object({
  ...BlockBase,
  kind: z.literal("callout"),
  tag: z.string(),
  html: z.string(),
  variant: z.string().optional(),
});
export const ImageBlock = z.object({
  ...BlockBase,
  kind: z.literal("image"),
  // For <figure><img><figcaption> the root is the figure; for a bare <img> the root is the img.
  wrapperTag: z.string().optional(),
  imgAttrs: attrs.default({}),
  src: z.string(),
  alt: z.string(),
  captionHtml: z.string().optional(),
  captionTag: z.string().optional(),
  captionAttrs: attrs.default({}),
  // HTML siblings inside a figure other than img and caption, kept verbatim
  extraHtml: z.string().optional(),
});
export const TableCell = z.object({ html: z.string(), header: z.boolean(), attrs: attrs.default({}) });
export const TableRowSchema = z.object({ attrs: attrs.default({}), cells: z.array(TableCell), section: z.enum(["thead", "tbody", "tfoot"]).default("tbody") });
export type TableRow = z.infer<typeof TableRowSchema>;
export const TableBlock = z.object({
  ...BlockBase,
  kind: z.literal("table"),
  captionHtml: z.string().optional(),
  rows: z.array(TableRowSchema),
});
export const ButtonBlock = z.object({
  ...BlockBase,
  kind: z.literal("button"),
  label: z.string(),
  // wrapper (e.g. div.gatebar) that contains the button; sibling markup is kept verbatim around it
  wrapperTag: z.string().optional(),
  wrapperAttrs: attrs.default({}),
  beforeHtml: z.string().default(""),
  afterHtml: z.string().default(""),
});
export const CustomBlock = z.object({
  ...BlockBase,
  kind: z.literal("custom"),
  label: z.string(),
  rawHtml: z.string(), // verbatim outer HTML from the original
  interactionIds: z.array(z.string()).default([]),
  reasons: z.array(z.string()).default([]),
  eventContract: z
    .object({
      declared: z.array(z.string()).default([]),
      detected: z.array(z.string()).default([]),
    })
    .optional(),
});
export const OpaqueBlock = z.object({
  ...BlockBase,
  kind: z.literal("opaque"),
  rawHtml: z.string(),
  reason: z.string(),
});
export const UnsupportedBlock = z.object({
  ...BlockBase,
  kind: z.literal("unsupported"),
  rawHtml: z.string(),
  reason: z.string(),
});

type LeafBlock =
  | z.infer<typeof HeadingBlock>
  | z.infer<typeof RichTextBlock>
  | z.infer<typeof CalloutBlock>
  | z.infer<typeof ImageBlock>
  | z.infer<typeof TableBlock>
  | z.infer<typeof ButtonBlock>
  | z.infer<typeof CustomBlock>
  | z.infer<typeof OpaqueBlock>
  | z.infer<typeof UnsupportedBlock>;

export type GroupBlock = z.infer<typeof HeadingBlock> extends infer _ ? {
  kind: "group";
  tag: string;
  children: Block[];
  trailingHtml: string;
} & Omit<z.infer<typeof HeadingBlock>, "kind" | "level" | "html"> : never;

export type Block = LeafBlock | GroupBlock;

// A static container (e.g. div.workbook) whose children are themselves blocks.
export const GroupBlockSchema: z.ZodType<GroupBlock> = z.lazy(() =>
  z.object({
    ...BlockBase,
    kind: z.literal("group"),
    tag: z.string(),
    children: z.array(BlockSchema),
    trailingHtml: z.string().default(""),
  }),
) as unknown as z.ZodType<GroupBlock>;

export const BlockSchema: z.ZodType<Block> = z.lazy(() =>
  z.union([
    HeadingBlock,
    RichTextBlock,
    CalloutBlock,
    ImageBlock,
    TableBlock,
    ButtonBlock,
    CustomBlock,
    OpaqueBlock,
    UnsupportedBlock,
    GroupBlockSchema,
  ]),
) as unknown as z.ZodType<Block>;

export const GateSchema = z.object({
  kind: z.enum(["read", "lab", "check", "completion", "none"]),
  need: z.number().optional(),
  clearId: z.string().optional(),
  noteHtml: z.string().optional(),
});

export const BeatSchema = z.object({
  id: z.string(),
  label: z.string(),
  tag: z.string().default("section"),
  attrs: attrs.default({}),
  typeKey: z.string().optional(), // key in workspace beat_types
  typeConfidence: z.number().min(0).max(1).optional(),
  purpose: z.string().optional(),
  objectiveCodes: z.array(z.string()).default([]),
  learnerAction: z.string().optional(),
  completionEvidence: z.string().optional(),
  gate: GateSchema.default({ kind: "read" }),
  hidden: z.boolean().default(false),
  // Verbatim HTML that sat between the previous beat and this one (beat-local <style>, comments).
  leadingHtml: z.string().default(""),
  trailingHtml: z.string().default(""), // whitespace/comments after the last block inside the innermost wrapper
  blocks: z.array(BlockSchema),
  // Wrapper chain between the beat root and its blocks, e.g. [{tag:'div', attrs:{class:'wrap'}}]
  wrappers: z.array(z.object({ tag: z.string(), attrs: attrs.default({}) })).default([]),
  source: SourceRefSchema.optional(),
  provenance: ProvenanceSchema.optional(),
});
export type Beat = z.infer<typeof BeatSchema>;

export const AssetRefSchema = z.object({
  path: z.string(),
  kind: z.enum(["image", "audio", "video", "script", "style", "font", "other"]),
  status: z.enum(["present", "missing", "external", "inline"]),
  referencedBy: z.array(z.string()).default([]), // block or beat ids or 'head'
  host: z.string().optional(),
  allowed: z.boolean().optional(),
});
export type AssetRef = z.infer<typeof AssetRefSchema>;

export const LessonDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  title: z.string(),
  lang: z.string().default("en"),
  origin: z.enum(["import", "new"]),
  meta: z
    .object({
      course: z.string().optional(),
      number: z.string().optional(),
      minutes: z.number().optional(),
      description: z.string().optional(),
      chassis: z.string().optional(), // detected chassis profile, e.g. electric-ink
    })
    .default({}),
  objectives: z.array(z.object({ code: z.string(), wording: z.string().optional() })).default([]),
  flow: z
    .object({
      mode: z.enum(["free", "soft", "completion", "mastery"]).default("completion"),
      passN: z.number().optional(),
      itemCount: z.number().optional(),
    })
    .default({ mode: "completion" }),
  theme: z
    .object({ family: z.string().optional(), tokens: z.record(z.string(), z.string()).default({}) })
    .default({ tokens: {} }),
  // Imported shell: verbatim regions outside the beats. Offsets index into the original artifact.
  shell: z
    .object({
      preHtml: z.string(), // from byte 0 to the start of the first beat (includes <head>, dock)
      postHtml: z.string(), // from the end of the last beat to EOF (scripts, </body></html>)
      titleOffset: z.tuple([z.number(), z.number()]).optional(), // offsets of <title> inner text in preHtml
    })
    .optional(),
  beats: z.array(BeatSchema),
  assets: z.array(AssetRefSchema).default([]),
  accessibility: z
    .object({
      exceptions: z.array(z.object({ ruleKey: z.string(), reason: z.string(), blockId: z.string().optional() })).default([]),
    })
    .default({ exceptions: [] }),
  runtime: z
    .object({
      standaloneShim: z.boolean().default(false),
      removedScripts: z.array(z.string()).default([]),
    })
    .default({ standaloneShim: false, removedScripts: [] }),
  provenance: z.record(z.string(), ProvenanceSchema).default({}), // by block/beat id
});
export type LessonDocument = z.infer<typeof LessonDocumentSchema>;

export function parseLessonDocument(input: unknown): LessonDocument {
  return LessonDocumentSchema.parse(input);
}

export type BlockLocation = { beat: Beat; block: Block; beatIndex: number; blockIndex: number; parent: Block[]; path: string[] };

/** Depth-first search for a block by id, descending into group blocks. */
export function findBlock(doc: LessonDocument, blockId: string): BlockLocation | null {
  for (let bi = 0; bi < doc.beats.length; bi++) {
    const beat = doc.beats[bi]!;
    const hit = searchBlocks(beat.blocks, blockId, []);
    if (hit) return { beat, beatIndex: bi, ...hit };
  }
  return null;
}

function searchBlocks(list: Block[], id: string, path: string[]): { block: Block; blockIndex: number; parent: Block[]; path: string[] } | null {
  for (let i = 0; i < list.length; i++) {
    const b = list[i]!;
    if (b.id === id) return { block: b, blockIndex: i, parent: list, path };
    if (b.kind === "group") {
      const hit = searchBlocks(b.children, id, [...path, b.id]);
      if (hit) return hit;
    }
  }
  return null;
}

export function* iterateBlocks(doc: LessonDocument): Generator<{ beat: Beat; block: Block; depth: number }> {
  for (const beat of doc.beats) yield* iterateList(beat, beat.blocks, 0);
}
function* iterateList(beat: Beat, list: Block[], depth: number): Generator<{ beat: Beat; block: Block; depth: number }> {
  for (const b of list) {
    yield { beat, block: b, depth };
    if (b.kind === "group") yield* iterateList(beat, b.children, depth + 1);
  }
}

export function findBeat(doc: LessonDocument, beatId: string): { beat: Beat; index: number } | null {
  const index = doc.beats.findIndex((b) => b.id === beatId);
  if (index < 0) return null;
  return { beat: doc.beats[index]!, index };
}
