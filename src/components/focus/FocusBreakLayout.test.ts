import { describe, expect, it } from "vitest";

describe("Focus Break constrained-height layout", () => {
  it("keeps the dialog and controls scrollable at every viewport width", async () => {
    const nodeFsSpecifier = ["node", "fs"].join(":");
    const { readFileSync } = (await import(/* @vite-ignore */ nodeFsSpecifier)) as {
      readFileSync: (path: string, encoding: "utf8") => string;
    };
    const runtimeProcess = (globalThis as typeof globalThis & {
      process: { cwd: () => string };
    }).process;
    const css = readFileSync(`${runtimeProcess.cwd()}/src/styles/focus.css`, "utf8");
    const dialogRule = css.match(/\.focus-break-dialog\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(dialogRule).toContain("max-height: calc(100dvh - 2rem)");
    expect(dialogRule).toContain("overflow-y: auto");
  });
});
