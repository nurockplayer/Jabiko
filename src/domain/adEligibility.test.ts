import { describe, expect, it } from "vitest";
import { isFocusBreakAdEligible } from "./adEligibility";

describe("Focus Break ad eligibility", () => {
  it("requires a local attempt recorded during the current focus cycle", () => {
    expect(isFocusBreakAdEligible({ localAnswered: 0 })).toBe(false);
    expect(isFocusBreakAdEligible({ localAnswered: 1 })).toBe(true);
  });
});
