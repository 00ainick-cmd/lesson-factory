import { describe, expect, it } from "vitest";
import type { Block } from "@/server/lesson/model";
import { buildRewriteOps, collectRewriteUnits, mockNoAiSlopRewrite, validateRewriteOutput } from "./no-ai-slop";

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
