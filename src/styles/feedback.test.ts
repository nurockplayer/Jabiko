import { describe, expect, it } from "vitest";

// The app tsconfig has browser-only types (no @types/node), so reach fs via a
// computed dynamic specifier — same trick as FocusBreakLayout.test.ts. (This
// test originally used a `?raw` import, which resolves to an empty stub under
// the test runner — and no vitest project included src/styles anyway, so the
// guard silently never ran.)
const nodeFsSpecifier = ["node", "fs"].join(":");
const { readFileSync } = (await import(/* @vite-ignore */ nodeFsSpecifier)) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
const css = readFileSync(new URL("./feedback.css", import.meta.url), "utf8");

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
