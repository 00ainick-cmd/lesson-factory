import { describe, expect, it } from "vitest";
import type { Block } from "@/server/lesson/model";
import { buildNoAiSlopAudit, buildRewriteOps, collectRewriteUnits, mockNoAiSlopRewrite, scanNoAiSlopDocument, validateRewriteOutput } from "./no-ai-slop";
import type { LessonDocument } from "@/server/lesson/model";

const base = {
  classification: "managed" as const,
  hidden: false,
  attrs: {},
  leadingHtml: "",
  complex: false,
  a11y: { exceptions: [] },
};

describe("no-ai-slop block rewriting", () => {
  it("rewrites text while preserving inline HTML", () => {
    const block: Block = {
      ...base,
      id: "block-1",
      kind: "richtext",
      tag: "p",
      html: 'It is important to note that this <strong class="term">robust</strong> tool leverages checks.',
    };
    const units = collectRewriteUnits(block);
    const output = mockNoAiSlopRewrite(units);
    const { ops } = buildRewriteOps(block, units, output);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({
      type: "update-block",
      blockId: "block-1",
      patch: { html: 'This <strong class="term">reliable</strong> tool uses checks.' },
    });
    expect(() => validateRewriteOutput(units, output)).not.toThrow();
  });

  it("rejects a model response that changes HTML structure", () => {
    const block: Block = {
      ...base,
      id: "block-2",
      kind: "heading",
      level: 2,
      html: "A <strong>robust</strong> workflow",
    };
    const units = collectRewriteUnits(block);
    expect(() =>
      validateRewriteOutput(units, {
        rewrites: [{ id: "html", content: "A reliable workflow" }],
        summary: "Removed inflated wording.",
      }),
    ).toThrow(/changed HTML structure/);
  });

  it("combines changed table cells into one structured block update", () => {
    const block: Block = {
      ...base,
      id: "table-1",
      kind: "table",
      rows: [
        {
          attrs: {},
          section: "tbody",
          cells: [
            { html: "Leverage the meter", header: false, attrs: {} },
            { html: "Record volts", header: false, attrs: {} },
          ],
        },
      ],
    };
    const units = collectRewriteUnits(block);
    const { ops, changedUnits } = buildRewriteOps(block, units, mockNoAiSlopRewrite(units));

    expect(changedUnits).toEqual(["Row 1, cell 1"]);
    expect(ops[0]).toMatchObject({
      type: "update-block",
      blockId: "table-1",
      patch: { rows: [{ cells: [{ html: "Use the meter" }, { html: "Record volts" }] }] },
    });
  });

  it("returns no operations when the block already reads naturally", () => {
    const block: Block = { ...base, id: "button-1", kind: "button", label: "Check voltage", wrapperAttrs: {}, beforeHtml: "", afterHtml: "" };
    const units = collectRewriteUnits(block);
    expect(buildRewriteOps(block, units, mockNoAiSlopRewrite(units))).toEqual({ ops: [], changedUnits: [] });
  });
});

describe("no-ai-slop lesson check", () => {
  it("creates one reviewable rewrite proposal per editable block", () => {
    const doc = {
      beats: [
        {
          id: "beat-1",
          label: "Meter setup",
          hidden: false,
          blocks: [
            {
              ...base,
              id: "copy-1",
              kind: "richtext",
              tag: "p",
              html: '<p class="instruction">It is important to note that this <strong>robust</strong> method utilizes a meter.</p>',
            },
            { ...base, id: "copy-2", kind: "richtext", tag: "p", html: "Connect the meter in parallel." },
          ],
        },
      ],
    } as unknown as LessonDocument;

    const findings = scanNoAiSlopDocument(doc);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      ruleKey: "writing.no-ai-slop",
      blockId: "copy-1",
      beatId: "beat-1",
      evidence: { patterns: expect.arrayContaining(["empty opener", "banned word"]) },
      proposal: {
        kind: "rewrite",
        ops: [
          {
            type: "update-block",
            blockId: "copy-1",
            patch: { html: '<p class="instruction">This <strong>reliable</strong> method uses a meter.</p>' },
          },
        ],
      },
    });
    expect(buildNoAiSlopAudit(doc).summary).toMatchObject({
      rulesEvaluated: 1,
      counts: { error: 0, warning: 1, info: 0 },
      exportReady: true,
    });
  });

  it("flags unsupported attribution without creating an unsafe rewrite", () => {
    const doc = {
      beats: [
        {
          id: "beat-1",
          label: "Claim",
          hidden: false,
          blocks: [{ ...base, id: "claim-1", kind: "richtext", tag: "p", html: "Experts agree this prevents every wiring fault." }],
        },
      ],
    } as unknown as LessonDocument;

    const finding = scanNoAiSlopDocument(doc)[0];
    expect(finding).toMatchObject({
      evidence: { patterns: ["weasel attribution"] },
    });
    expect(finding?.proposal).toBeUndefined();
  });
});
