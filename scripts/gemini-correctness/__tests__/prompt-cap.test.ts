// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { buildDiscoveryPrompt, MAX_TOTAL_CHARS } from "../prompt-builder.mjs";

describe("prompt-builder — MAX_TOTAL_CHARS hard cap", () => {
  it("throws when rules alone exceed MAX_TOTAL_CHARS (0 scanned files)", () => {
    const hugeRules = "x".repeat(MAX_TOTAL_CHARS);
    expect(() => buildDiscoveryPrompt({
      commitSha: "abc",
      rules: hugeRules,
      scannedFiles: [],
      stats: { totalFiles: 0, totalBytes: 0, protectedExcluded: 0 }
    })).toThrow(/MAX_TOTAL_CHARS|exceed/i);
  });

  it("throws when template + rules exceed MAX_TOTAL_CHARS", () => {
    const bigRules = "x".repeat(MAX_TOTAL_CHARS);
    expect(() => buildDiscoveryPrompt({
      commitSha: "abc",
      rules: bigRules,
      scannedFiles: [],
      stats: { totalFiles: 0, totalBytes: 0, protectedExcluded: 0 }
    })).toThrow(/MAX_TOTAL_CHARS|exceed/i);
  });

  it("never exceeds MAX_TOTAL_CHARS when template+rules+blocks are near the limit", () => {
    // Build enough file content to nearly fill available space
    const smallContent = "const a = 1;\n";
    const manyFiles = Array.from({ length: 20 }, (_, i) => ({
      path: `src/domain/f${i}.ts`,
      content: smallContent.repeat(3000),
      lineCount: 600,
      byteSize: Buffer.byteLength(smallContent.repeat(3000), "utf8"),
      truncated: false
    }));

    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "## Some rules\n- rule1\n- rule2\n",
      scannedFiles: manyFiles,
      stats: { totalFiles: manyFiles.length, totalBytes: 0, protectedExcluded: 0 }
    });

    expect(result.prompt.length).toBeLessThanOrEqual(MAX_TOTAL_CHARS);
    // No prompt.slice — all content should be complete blocks ending with ```
    if (result.manifest.length > 0) {
      expect(result.prompt.trimEnd().endsWith("```")).toBe(true);
    }
    // Every file in manifest must appear as complete block
    for (const fp of result.manifest) {
      expect(result.prompt).toContain(`### ${fp}`);
    }
  });

  it("does not cut rules or file blocks (no prompt.slice)", () => {
    const content = "line1\nline2\n";
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "Some rules that must be complete.",
      scannedFiles: [{ path: "src/domain/a.ts", content, lineCount: 2, byteSize: Buffer.byteLength(content, "utf8"), truncated: false }],
      stats: { totalFiles: 1, totalBytes: 0, protectedExcluded: 0 }
    });

    expect(result.prompt).toContain("Some rules that must be complete.");
    expect(result.prompt).toContain("1|line1");
    expect(result.prompt).toContain("2|line2");
    expect(result.prompt.trimEnd().endsWith("```")).toBe(true);
  });

  it("returns truncated=true and empty manifest when rules alone exceed limit", () => {
    // MAX_TOTAL_CHARS is 500K; template is ~2K.
    // Rules of MAX_TOTAL_CHARS bytes should definitely exceed the limit.
    const hugeRules = "x".repeat(MAX_TOTAL_CHARS);
    expect(() => buildDiscoveryPrompt({
      commitSha: "abc",
      rules: hugeRules,
      scannedFiles: [],
      stats: { totalFiles: 0, totalBytes: 0, protectedExcluded: 0 }
    })).toThrow(/MAX_TOTAL_CHARS|exceed/i);
  });
});
