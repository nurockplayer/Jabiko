// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { buildDiscoveryPrompt, DEFAULT_MODEL, MAX_TOTAL_CHARS } from "../prompt-builder.mjs";

describe("buildDiscoveryPrompt", () => {
  it("includes commit SHA", () => {
    const result = buildDiscoveryPrompt({
      commitSha: "abc123",
      rules: "",
      scannedFiles: [{ path: "src/domain/a.ts", content: "const x = 1;\n", lineCount: 2, byteSize: 15, truncated: false }],
      manifest: ["src/domain/a.ts"],
      stats: { totalFiles: 1, totalBytes: 15, protectedExcluded: 0 }
    });
    expect(result.prompt).toContain("abc123");
  });

  it("includes file contents with paths and line numbers", () => {
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: [{ path: "src/domain/a.ts", content: "const x = 1;\nconst y = 2;\n", lineCount: 2, byteSize: 24, truncated: false }],
      manifest: ["src/domain/a.ts"],
      stats: { totalFiles: 1, totalBytes: 24, protectedExcluded: 0 }
    });
    expect(result.prompt).toContain("src/domain/a.ts");
    expect(result.prompt).toContain("const x = 1;");
    expect(result.prompt).toContain("1|");
  });

  it("includes stats (file count, excluded count)", () => {
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: [],
      manifest: [],
      stats: { totalFiles: 0, totalBytes: 0, protectedExcluded: 3 }
    });
    expect(result.prompt).toContain("protected");
  });

  it("includes project rules when provided", () => {
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "## Important\nDo not modify tests.",
      scannedFiles: [],
      manifest: [],
      stats: { totalFiles: 0, totalBytes: 0, protectedExcluded: 0 }
    });
    expect(result.prompt).toContain("Do not modify tests");
  });

  it("includes strict JSON schema instruction", () => {
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: [],
      manifest: [],
      stats: { totalFiles: 0, totalBytes: 0, protectedExcluded: 0 }
    });
    expect(result.prompt).toMatch(/schemaVersion|json|strict/i);
  });

  it("lists scanned file manifest for reference", () => {
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: [{ path: "src/domain/a.ts", content: "", lineCount: 0, byteSize: 0, truncated: false }],
      manifest: ["src/domain/a.ts"],
      stats: { totalFiles: 1, totalBytes: 0, protectedExcluded: 0 }
    });
    expect(result.manifest).toEqual(["src/domain/a.ts"]);
  });

  it("enforces MAX_TOTAL_CHARS limit on total prompt", () => {
    const bigFile = {
      path: "src/domain/big.ts",
      content: "x".repeat(MAX_TOTAL_CHARS + 1000),
      lineCount: 1,
      byteSize: MAX_TOTAL_CHARS + 1000,
      truncated: false
    };
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: [bigFile],
      manifest: ["src/domain/big.ts"],
      stats: { totalFiles: 1, totalBytes: MAX_TOTAL_CHARS + 1000, protectedExcluded: 0 }
    });
    expect(result.prompt.length).toBeLessThanOrEqual(MAX_TOTAL_CHARS);
  });

  it("indicates when results are truncated", () => {
    const bigFile = {
      path: "src/domain/big.ts",
      content: "x".repeat(MAX_TOTAL_CHARS + 1000),
      lineCount: 1,
      byteSize: MAX_TOTAL_CHARS + 1000,
      truncated: false
    };
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: [bigFile],
      manifest: ["src/domain/big.ts"],
      stats: { totalFiles: 1, totalBytes: MAX_TOTAL_CHARS + 1000, protectedExcluded: 0 }
    });
    expect(result.truncated).toBe(true);
  });

  it("returns length for monitoring", () => {
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: [{ path: "src/domain/a.ts", content: "hello\n", lineCount: 1, byteSize: 6, truncated: false }],
      manifest: ["src/domain/a.ts"],
      stats: { totalFiles: 1, totalBytes: 6, protectedExcluded: 0 }
    });
    expect(result.length).toBe(result.prompt.length);
  });

  it("contains the JSON output format instructions", () => {
    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: [],
      manifest: [],
      stats: { totalFiles: 0, totalBytes: 0, protectedExcluded: 0 }
    });
    expect(result.prompt).toContain("no-finding");
    expect(result.prompt).toContain("schemaVersion");
  });
});

describe("DEFAULT_MODEL", () => {
  it("is a non-empty string", () => {
    expect(typeof DEFAULT_MODEL).toBe("string");
    expect(DEFAULT_MODEL.length).toBeGreaterThan(0);
  });
});

describe("MAX_TOTAL_CHARS", () => {
  it("is a positive integer", () => {
    expect(MAX_TOTAL_CHARS).toBeGreaterThan(0);
  });
});
