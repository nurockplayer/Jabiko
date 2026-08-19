import { describe, expect, it } from "vitest";
import { isFocusBreakAdEligible } from "./adEligibility";

describe("Focus Break ad eligibility", () => {
  it("requires at least one completed answer in the current focus cycle", () => {
    expect(isFocusBreakAdEligible({ answered: 0 })).toBe(false);
    expect(isFocusBreakAdEligible({ answered: 1 })).toBe(true);
  });
});
