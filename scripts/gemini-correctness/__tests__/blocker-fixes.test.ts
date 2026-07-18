// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it, beforeEach, afterEach } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { safeWritePath, isPathWithinRepo } from "../policy.mjs";
// @ts-expect-error -- plain .mjs module, no types
import { scanRepository, validateScanOptions } from "../scanner.mjs";
// @ts-expect-error -- plain .mjs module, no types
import { buildDiscoveryPrompt, MAX_TOTAL_CHARS } from "../prompt-builder.mjs";
// @ts-expect-error -- plain .mjs module, no types
import { validateEvidenceLines, validateFindingWithRepo } from "../repo-validator.mjs";

import fs from "node:fs";
import path from "node:path";

// =============================================================================
// 1. safeWritePath — .tmp symlink outside repo must be rejected
// =============================================================================
describe("safeWritePath — .tmp symlink containment", () => {
  const TEST_DIR = "/tmp/jabiko-safewrite-test-" + Date.now();
  const REPO_DIR = path.join(TEST_DIR, "repo");
  const OUTSIDE_DIR = path.join(TEST_DIR, "outside");
  const TMP_SYMLINK = path.join(REPO_DIR, ".tmp");

  function createFixture() {
    fs.mkdirSync(OUTSIDE_DIR, { recursive: true });
    fs.mkdirSync(path.join(REPO_DIR, "src"), { recursive: true });
    fs.writeFileSync(path.join(REPO_DIR, "CLAUDE.md"), "# repo");
    // .tmp is a symlink to outside
    fs.symlinkSync(OUTSIDE_DIR, TMP_SYMLINK);
  }

  function cleanupFixture() {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }

  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("rejects when .tmp is a symlink to outside the repo", () => {
    const result = safeWritePath("report.json", TMP_SYMLINK);
    expect(result).toBeNull();
  });

  it("rejects when intermediate dir is a symlink escape", () => {
    const deepDir = path.join(REPO_DIR, ".tmp", "sub");
    if (!fs.existsSync(deepDir)) fs.mkdirSync(deepDir, { recursive: true });
    // .tmp -> outside, so anything under it should be rejected
    const result = safeWritePath("sub/out.json", TMP_SYMLINK);
    expect(result).toBeNull();
  });
});

// =============================================================================
// 2. prompt-builder must not use prompt.slice() — only complete file blocks
// =============================================================================
describe("buildDiscoveryPrompt — no partial blocks", () => {
  it("never uses prompt.slice() — only whole file blocks", () => {
    // Build prompt with enough files to nearly fill MAX_TOTAL_CHARS
    const bigContent = "x".repeat(100_000);
    const files = Array.from({ length: 20 }, (_, i) => ({
      path: `src/domain/file${i}.ts`,
      content: bigContent,
      lineCount: 1,
      byteSize: Buffer.byteLength(bigContent, "utf8"),
      truncated: false
    }));

    const result = buildDiscoveryPrompt({
      commitSha: "abc",
      rules: "",
      scannedFiles: files,
      stats: { totalFiles: files.length, totalBytes: 0, protectedExcluded: 0 }
    });

    // Verify: every file in the prompt must be COMPLETE (end with the closing ```)
    const blocks = result.prompt.split("```");
    // Odd-indexed blocks are code blocks
    for (let i = 0; i < result.manifest.length; i++) {
      expect(result.prompt).toContain("### " + result.manifest[i]);
    }

    // No partial line numbers at the end
    const trimmed = result.prompt.trim();
    expect(trimmed.endsWith("```")).toBe(true);

    // manifest length must match actual number of blocks in prompt
    const blockCount = (result.prompt.match(/### src\/domain\/file/g) || []).length;
    expect(result.manifest.length).toBe(blockCount);
  });
});

// =============================================================================
// 3. repo validation must use visible line count for truncated files
// =============================================================================
describe("validateEvidenceLines — truncated file visible lines", () => {
  const TEST_DIR = "/tmp/jabiko-visiblelines-test-" + Date.now();

  function createFixture() {
    fs.mkdirSync(path.join(TEST_DIR, "src", "domain"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "src", "domain", "long.ts"),
      Array.from({ length: 100 }, (_, i) => `line${i + 1}`).join("\n"));
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# test");
  }

  function cleanupFixture() {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }

  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("rejects line number beyond what Gemini actually saw (truncated file)", () => {
    // File has 100 lines but truncated content only has 20
    const fullContent = fs.readFileSync(path.join(TEST_DIR, "src/domain/long.ts"), "utf8");
    const truncatedContent = fullContent.split("\n").slice(0, 20).join("\n");

    // Validate with scannedFile entry showing visibleLineCount
    const result = validateEvidenceLines(
      "src/domain/long.ts",
      25, // Gemini claims line 25 — but it only saw 20 lines
      30,
      TEST_DIR,
      { visibleLineCount: 20 }  // scanner truncated the file
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/exceed|visible|line count/i);
  });
});

// =============================================================================
// 4. protectedExcluded must be accurate
// =============================================================================
describe("scanRepository — protectedExcluded accuracy", () => {
  const TEST_DIR = "/tmp/jabiko-protcount-test-" + Date.now();

  function createFixture() {
    fs.mkdirSync(path.join(TEST_DIR, "src", "domain"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "src", "domain", "ok.ts"), "ok");
    fs.writeFileSync(path.join(TEST_DIR, "src", "domain", "contentGuard.ts"), "protected");
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# test");
  }

  function cleanupFixture() {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }

  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("counts only protected files (not binary/skip)", () => {
    const result = scanRepository({
      repoRoot: TEST_DIR,
      allowlist: ["src/domain/**"],
      protectedPaths: ["src/domain/contentGuard.ts"]
    });
    // ok.ts is scanned, contentGuard.ts is protected => 1 protected excluded
    expect(result.stats.protectedExcluded).toBe(1);
    expect(result.stats.totalFiles).toBe(1);
  });
});

// =============================================================================
// 5. scanner exact-file allowlist — symlink outside repo must be rejected
// =============================================================================
describe("scanRepository — exact-file allowlist symlink escape", () => {
  const TEST_DIR = "/tmp/jabiko-exactfile-test-" + Date.now();
  const REPO_DIR = path.join(TEST_DIR, "repo");
  const OUTSIDE_FILE = path.join(TEST_DIR, "outside.ts");

  function createFixture() {
    fs.mkdirSync(path.join(REPO_DIR, "src", "domain"), { recursive: true });
    fs.writeFileSync(path.join(REPO_DIR, "CLAUDE.md"), "# repo");
    fs.writeFileSync(OUTSIDE_FILE, "outside content\n");
    // Exact-file pattern that resolves outside repo via symlink
    fs.symlinkSync(OUTSIDE_FILE, path.join(REPO_DIR, "src", "domain", "linked.ts"));
  }

  function cleanupFixture() {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }

  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("rejects exact-file allowlist entry pointing outside repo via symlink", () => {
    const result = scanRepository({
      repoRoot: REPO_DIR,
      allowlist: ["src/domain/linked.ts"],
      protectedPaths: []
    });
    const paths = result.scannedFiles.map(f => f.path);
    expect(paths).not.toContain("src/domain/linked.ts");
  });
});

// =============================================================================
// 6. scanner parameter validation
// =============================================================================
describe("scanRepository — parameter validation", () => {
  it("throws for maxFiles <= 0", () => {
    expect(() => scanRepository({
      repoRoot: "/tmp",
      allowlist: [],
      protectedPaths: [],
      maxFiles: 0
    })).toThrow(/maxFiles/i);
  });

  it("throws for maxFiles exceeding hard maximum", () => {
    expect(() => scanRepository({
      repoRoot: "/tmp",
      allowlist: [],
      protectedPaths: [],
      maxFiles: 99999
    })).toThrow(/maxFiles/i);
  });

  it("throws for maxBytesPerFile <= 0", () => {
    expect(() => scanRepository({
      repoRoot: "/tmp",
      allowlist: [],
      protectedPaths: [],
      maxBytesPerFile: -1
    })).toThrow(/maxBytesPerFile/i);
  });

  it("throws for maxTotalBytes exceeding hard maximum", () => {
    expect(() => scanRepository({
      repoRoot: "/tmp",
      allowlist: [],
      protectedPaths: [],
      maxTotalBytes: 999999999
    })).toThrow(/maxTotalBytes/i);
  });
});
