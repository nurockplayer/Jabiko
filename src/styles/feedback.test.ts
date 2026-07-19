import { describe, expect, it } from "vitest";
// ?raw import (typed via vite/client), same trick as staticPages.test.ts.
import css from "./feedback.css?raw";

describe("choice-option layout (#652)", () => {
  it("wraps long furigana option sentences (flex-wrap) instead of overflowing", () => {
    // Options inherit the global button's inline-flex; with furigana on, <Ruby>
    // makes each word a flex item. Without flex-wrap a long 用法 sentence option
    // overflows / squishes into a thin column. This guards the wrap fix.
    const start = css.indexOf(".choice-option {");
    expect(start).toBeGreaterThanOrEqual(0);
    const rule = css.slice(start, css.indexOf("}", start));
    expect(rule).toMatch(/flex-wrap:\s*wrap/);
  });
});
