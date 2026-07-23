// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { buildDiscoveryPrompt, MAX_TOTAL_CHARS } from "../prompt-builder.mjs";

describe("prompt-builder — MAX_TOTAL_CHARS hard cap", () => {
  it("omits rules that alone exceed MAX_TOTAL_CHARS without breaking prompt structure", () => {
    const hugeRules =
      "DO_NOT_INCLUDE_OVERSIZED_RULE_PREFIX\n" +
      "x".repeat(MAX_TOTAL_CHARS) +
      "😀tail";
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: hugeRules,
      scannedFiles: [],
      stats: { totalFiles: 0, totalBytes: 0, protectedExcluded: 0 }
    });

    expect(result.prompt.length).toBeLessThanOrEqual(MAX_TOTAL_CHARS);
    expect(result.manifest).toEqual([]);
    expect(result.rulesTruncated).toBe(true);
    expect(result.prompt).toContain("[Project rules omitted");
    expect(result.prompt).not.toContain("DO_NOT_INCLUDE_OVERSIZED_RULE_PREFIX");
    expect(result.prompt).toContain("## End project rules");
    expect(result.prompt).toContain("## Scanned files");
    expect(result.prompt).toContain("## File contents");
    for (const codePoint of result.prompt) {
      expect(codePoint.length === 1 && /[\uD800-\uDFFF]/.test(codePoint)).toBe(false);
    }
  });

  it("handles huge rules with a commit SHA and zero scanned files", () => {
    const commitSha = "a".repeat(64);
    const result = buildDiscoveryPrompt({
      commitSha,
      rules: "rule\n".repeat(MAX_TOTAL_CHARS),
      scannedFiles: [],
      stats: { totalFiles: 0, totalBytes: 0, protectedExcluded: 0 }
    });

    expect(result.prompt).toContain(`Commit SHA: ${commitSha}`);
    expect(result.prompt.length).toBeLessThanOrEqual(MAX_TOTAL_CHARS);
    expect(result.manifest).toEqual([]);
    expect(result.rulesTruncated).toBe(true);
  });

  it("keeps only complete file blocks and an exact manifest with huge rules", () => {
    const content = "const a = 1;\n".repeat(4000);
    const manyFiles = Array.from({ length: 20 }, (_, i) => ({
      path: `src/domain/f${i}.ts`,
      content,
      lineCount: 4000,
      byteSize: Buffer.byteLength(content, "utf8"),
      truncated: false
    }));

    const result = buildDiscoveryPrompt({
      commitSha: "b".repeat(64),
      rules: "R".repeat(MAX_TOTAL_CHARS * 2),
      scannedFiles: manyFiles,
      stats: { totalFiles: manyFiles.length, totalBytes: 0, protectedExcluded: 0 }
    });

    expect(result.prompt.length).toBeLessThanOrEqual(MAX_TOTAL_CHARS);
    expect(result.rulesTruncated).toBe(true);
    expect(result.manifest.length).toBeGreaterThan(1);
    expect(result.manifest.length).toBeLessThan(manyFiles.length);

    const blockPaths = Array.from(
      result.prompt.matchAll(/^### (src\/domain\/f\d+\.ts) \(/gm),
      match => match[1]
    );
    expect(blockPaths).toEqual(result.manifest);

    for (const filePath of result.manifest) {
      const escapedPath = filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(result.prompt).toMatch(
        new RegExp(`### ${escapedPath} \\([^\\n]+\\)\\n\\\`\\\`\\\`\\n[\\s\\S]*?\\n\\\`\\\`\\\`(?=\\n\\n###|$)`)
      );
    }
    expect(result.prompt.trimEnd().endsWith("```")).toBe(true);
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

  it("never exceeds MAX_TOTAL_CHARS across hostile input combinations", () => {
    const cases = [
      { commitSha: "abc", rules: "x".repeat(MAX_TOTAL_CHARS * 2), scannedFiles: [] },
      { commitSha: "c".repeat(MAX_TOTAL_CHARS), rules: "", scannedFiles: [] },
      {
        commitSha: "def",
        rules: "x".repeat(MAX_TOTAL_CHARS * 2),
        scannedFiles: [{
          path: "src/domain/huge.ts",
          content: "y".repeat(MAX_TOTAL_CHARS * 2),
          lineCount: 1,
          byteSize: MAX_TOTAL_CHARS * 2,
          truncated: false
        }]
      }
    ];

    for (const input of cases) {
      const result = buildDiscoveryPrompt({
        ...input,
        stats: { totalFiles: input.scannedFiles.length, totalBytes: 0, protectedExcluded: 0 }
      });
      expect(result.prompt.length).toBeLessThanOrEqual(MAX_TOTAL_CHARS);
    }
  });

  it("does not treat placeholder-like input text as prompt template structure", () => {
    const result = buildDiscoveryPrompt({
      commitSha: "abc{{rulesSection}}{{fileCount}}",
      rules: "Keep these literal tokens: {{manifestSection}} {{fileContentsSection}} $& $` $'.",
      scannedFiles: [{
        path: "src/domain/a.ts",
        content: "const value = '{{fileCount}}';\n",
        lineCount: 1,
        byteSize: 31,
        truncated: false
      }],
      stats: { totalFiles: 1, totalBytes: 31, protectedExcluded: 0 }
    });

    expect(result.prompt).toContain("Commit SHA: abc{{rulesSection}}{{fileCount}}");
    expect(result.prompt).toContain("Keep these literal tokens: {{manifestSection}} {{fileContentsSection}} $& $` $'.");
    expect(result.prompt).toContain("const value = '{{fileCount}}';");
    expect(result.prompt).toContain("## Scanned files (1 files");
    expect(result.manifest).toEqual(["src/domain/a.ts"]);
  });
});
