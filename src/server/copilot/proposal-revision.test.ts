import { describe, expect, it } from "vitest";
import { assertProposalRevision } from "./proposal-revision";

describe("proposal revision safety", () => {
  it("rejects a proposal drafted before the current manual edit", () => {
    expect(() => assertProposalRevision(4, 5)).toThrow(/older revision/i);
  });

  it("allows a proposal drafted against the current revision", () => {
    expect(() => assertProposalRevision(5, 5)).not.toThrow();
  });
});
