import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Focus Break constrained-height layout", () => {
  it("keeps the dialog and controls scrollable at every viewport width", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/focus.css"), "utf8");
    const dialogRule = css.match(/\.focus-break-dialog\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(dialogRule).toContain("max-height: calc(100dvh - 2rem)");
    expect(dialogRule).toContain("overflow-y: auto");
  });
});
