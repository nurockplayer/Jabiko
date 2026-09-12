import { describe, expect, it } from "vitest";

// The app tsconfig has browser-only types (no @types/node), so reach fs via a
// computed dynamic specifier — same trick as FocusBreakLayout.test.ts. (A css
// `?raw` import would resolve to an empty stub under the test runner.)
const nodeFsSpecifier = ["node", "fs"].join(":");
const { readFileSync } = (await import(/* @vite-ignore */ nodeFsSpecifier)) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
const css = readFileSync(new URL("./home.css", import.meta.url), "utf8");

describe("home dashboard presentation (points economy foundation)", () => {
  it("renders the points tile's number in the accent color", () => {
    // The points tile is the strip's one focal number (the balance a future
    // shop spends); every other tile stays in --ink so the accent reads.
    const start = css.indexOf(".home-stats-cell-points strong {");
    expect(start).toBeGreaterThanOrEqual(0);
    const rule = css.slice(start, css.indexOf("}", start));
    expect(rule).toMatch(/color:\s*var\(--vermilion\)/);
  });

  it("pairs the trend and type charts side by side on wide screens", () => {
    // Density pass: the two self-contained chart cards share one row once the
    // column fits two readable halves; title/strip/overview keep full width.
    const media = css.indexOf("@media (min-width: 900px)");
    expect(media).toBeGreaterThanOrEqual(0);
    const block = css.slice(media);
    const progress = block.indexOf(".home-progress {");
    expect(progress).toBeGreaterThanOrEqual(0);
    const rule = block.slice(progress, block.indexOf("}", progress));
    expect(rule).toMatch(/grid-template-columns:\s*1fr 1fr/);
    expect(block).toMatch(/\.home-overview-row\s*\{[^}]*grid-column:\s*1 \/ -1/);
  });
});
