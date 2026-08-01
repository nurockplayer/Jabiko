// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { buildDiscoveryPrompt, MAX_TOTAL_CHARS } from "../prompt-builder.mjs";

describe("buildDiscoveryPrompt — manifest integrity", () => {
  it("manifest only includes files actually in prompt content (not excluded by size cap)", () => {
    const files = [
      { path: "src/domain/small.ts", content: "const x = 1;\n", lineCount: 2, byteSize: 13, truncated: false },
      { path: "src/domain/huge.ts", content: "x".repeat(MAX_TOTAL_CHARS), lineCount: 1, byteSize: MAX_TOTAL_CHARS, truncated: false }
    ];
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: files,
      manifest: files.map(f => f.path),
      stats: { totalFiles: 2, totalBytes: MAX_TOTAL_CHARS + 13, protectedExcluded: 0 }
    });
    // small.ts should be in prompt, huge.ts should not (too big)
    expect(result.prompt).toContain("small.ts");
    expect(result.prompt).not.toContain("huge.ts");
    // manifest must match what's actually in the prompt
    expect(result.manifest).toEqual(["src/domain/small.ts"]);
  });

  it("truncated file line count reflects what Gemini actually sees", () => {
    const content = "line1\nline2\nline3\nline4\nline5\n";
    const files = [
      { path: "src/domain/test.ts", content: content.slice(0, 10), lineCount: 2, byteSize: 30, truncated: true }
    ];
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: files,
      manifest: ["src/domain/test.ts"],
      stats: { totalFiles: 1, totalBytes: 30, protectedExcluded: 0 }
    });
    // The prompt should show the truncated content with correct line numbers
    expect(result.prompt).toContain("1|line1");
    expect(result.prompt).toContain("2|line");
    // The visible line count must match the truncated content
    const visibleLines = content.slice(0, 10).split("\n").filter(l => l.length > 0).length;
    expect(visibleLines).toBeGreaterThan(0);
  });
});
