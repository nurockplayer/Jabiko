// =============================================================================
// Integration tests for the 4 remaining PR blockers
// =============================================================================
// These test the FULL pipeline, not individual helpers in isolation.
// =============================================================================

// @ts-expect-error -- plain .mjs module
import { describe, expect, it, beforeEach, afterEach } from "vitest";
// @ts-expect-error -- plain .mjs module
import { safeWritePath, isPathWithinRepo } from "../policy.mjs";
// @ts-expect-error -- plain .mjs module
import { scanRepository } from "../scanner.mjs";
// @ts-expect-error -- plain .mjs module
import { buildDiscoveryPrompt, MAX_TOTAL_CHARS } from "../prompt-builder.mjs";
// @ts-expect-error -- plain .mjs module
import { validateFindingWithRepo } from "../repo-validator.mjs";

import fs from "node:fs";
import path from "node:path";

// =============================================================================
// BLOCKER 1: safeWritePath must work on clean checkout (file doesn't exist)
//            and must reject .tmp symlink to outside
// =============================================================================
describe("BLOCKER 1 — safeWritePath on clean checkout", () => {
  const TMP = "/tmp/jabiko-b1-" + Date.now();
  const REPO = path.join(TMP, "repo");
  const OUTSIDE = path.join(TMP, "outside");

  beforeEach(() => {
    fs.mkdirSync(OUTSIDE, { recursive: true });
    fs.mkdirSync(REPO, { recursive: true });
    fs.writeFileSync(path.join(REPO, "CLAUDE.md"), "# repo");
  });
  afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }));

  it("accepts a new output path when .tmp does not yet exist (clean checkout)", () => {
    const tmpDir = path.join(REPO, ".tmp");
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });

    const result = safeWritePath("report.json", tmpDir, REPO);
    expect(result).not.toBeNull();
    // On macOS /tmp -> /private/tmp, path.resolve will use realpath
    // The result exists and points inside allowedDir — that's what matters
    expect(fs.existsSync(path.dirname(result))).toBe(true);
    expect(fs.existsSync(tmpDir)).toBe(true);
  });

  it("rejects when .tmp is a symlink outside the repo", () => {
    const tmpDir = path.join(REPO, ".tmp");
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.symlinkSync(OUTSIDE, tmpDir);

    const result = safeWritePath("report.json", tmpDir, REPO);
    expect(result).toBeNull();
  });

  it("rejects when intermediate dir on output path is a symlink outside", () => {
    const tmpDir = path.join(REPO, ".tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const subDir = path.join(tmpDir, "sub");
    fs.symlinkSync(OUTSIDE, subDir);

    const result = safeWritePath(path.join("sub", "deep", "out.json"), tmpDir, REPO);
    expect(result).toBeNull();
  });
});

// =============================================================================
// BLOCKER 2: visibleLineCount must come from scanner metadata, NOT Gemini
// =============================================================================
describe("BLOCKER 2 — visibleLineCount from scanner, not Gemini", () => {
  const TMP = "/tmp/jabiko-b2-" + Date.now();
  const REPO = path.join(TMP, "repo");

  beforeEach(() => {
    fs.mkdirSync(path.join(REPO, "src", "domain"), { recursive: true });
    // Create a 100-line file that will be truncated by maxBytesPerFile
    const bigContent = Array.from({ length: 100 }, (_, i) => `line${i + 1}`).join("\n");
    fs.writeFileSync(path.join(REPO, "src", "domain", "big.ts"), bigContent);
    fs.writeFileSync(path.join(REPO, "CLAUDE.md"), "# repo");
  });
  afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }));

  it("end-to-end: truncated file's unseen lines are rejected by validateFindingWithRepo", () => {
    // Step 1: Scan with small maxBytesPerFile (truncates the 100-line file)
    const scanResult = scanRepository({
      repoRoot: REPO,
      allowlist: ["src/domain/**"],
      protectedPaths: [],
      maxBytesPerFile: 30  // Forces truncation
    });

    const bigEntry = scanResult.scannedFiles.find(f => f.path === "src/domain/big.ts");
    expect(bigEntry).toBeDefined();
    expect(bigEntry.truncated).toBe(true);

    // The visible line count should be small (only what fits in 30 bytes)
    const visibleLines = bigEntry.lineCount;
    expect(visibleLines).toBeLessThan(10); // 30 bytes = ~3 lines

    // Step 2: Build a finding where Gemini claims evidence at lines well beyond
    // what was visible. We simulate a finding coming back from Gemini.
    // The key: ev.visibleLineCount must NOT be set — it must come from metadata.
    const finding = {
      schemaVersion: 1,
      status: "finding",
      title: "test big file bug",
      confidence: 0.95,
      category: "logic-error",
      evidence: [{
        file: "src/domain/big.ts",
        startLine: 50,  // Gemini claims line 50 — but it only saw ~3 lines!
        endLine: 55,
        reason: "something"
      }],
      expectedBehavior: "x",
      actualBehavior: "y",
      reproduction: {
        testFile: "src/domain/big.regression.test.ts",
        testName: "test"
      },
      productionFiles: ["src/domain/big.ts"],
      risk: "low"
    };

    // Step 3: validateFindingWithRepo must reject because evidence references
    // lines beyond what was visible. The visibleLineCount must come from
    // the scanned file metadata (the scannedFile entry), NOT from the finding.
    //
    // If the validator trusts `ev.visibleLineCount` from Gemini, it would pass.
    // If it reads from scanner metadata, it should fail because line 50 > visible.
    const result = validateFindingWithRepo(finding, {
      repoRoot: REPO,
      manifest: scanResult.manifest,
      allowlist: ["src/domain/**"],
      protectedPaths: [],
      // Pass the scanner's file metadata so the validator knows visible lines
      scannedFiles: scanResult.scannedFiles
    });

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/visible|line|50|truncat/i);
  });

  it("passes when evidence references lines within visible range of truncated file", () => {
    const scanResult = scanRepository({
      repoRoot: REPO,
      allowlist: ["src/domain/**"],
      protectedPaths: [],
      maxBytesPerFile: 30
    });

    const bigEntry = scanResult.scannedFiles.find(f => f.path === "src/domain/big.ts");
    const visibleLines = bigEntry.lineCount;

    const finding = {
      schemaVersion: 1,
      status: "finding",
      title: "valid truncated finding",
      confidence: 0.95,
      category: "logic-error",
      evidence: [{
        file: "src/domain/big.ts",
        startLine: 1,
        endLine: Math.min(visibleLines, 2),
        reason: "visible"
      }],
      expectedBehavior: "x",
      actualBehavior: "y",
      reproduction: {
        testFile: "src/domain/big.regression.test.ts",
        testName: "test"
      },
      productionFiles: ["src/domain/big.ts"],
      risk: "low"
    };

    const result = validateFindingWithRepo(finding, {
      repoRoot: REPO,
      manifest: scanResult.manifest,
      allowlist: ["src/domain/**"],
      protectedPaths: [],
      scannedFiles: scanResult.scannedFiles
    });

    expect(result.valid).toBe(true);
  });
});

// =============================================================================
// BLOCKER 3: MAX_TOTAL_CHARS must be a true hard cap
//            (full candidate prompt after ALL replacements must be checked)
// =============================================================================
describe("BLOCKER 3 — MAX_TOTAL_CHARS true hard cap", () => {
  it("final prompt.length never exceeds MAX_TOTAL_CHARS, even with large commitSha and rules", () => {
    // Build many scanned files that together approach the limit
    const contentPerFile = "x".repeat(10_000);
    const manyFiles = Array.from({ length: 60 }, (_, i) => ({
      path: `src/domain/file${String(i).padStart(3, "0")}.ts`,
      content: contentPerFile,
      lineCount: 1,
      byteSize: Buffer.byteLength(contentPerFile, "utf8"),
      truncated: false
    }));

    const result = buildDiscoveryPrompt({
      commitSha: "a".repeat(80),  // long commit SHA
      rules: "## Important\n" + "R".repeat(5000),  // large rules section
      scannedFiles: manyFiles,
      stats: { totalFiles: manyFiles.length, totalBytes: 0, protectedExcluded: 0 }
    });

    // The prompt must NEVER exceed MAX_TOTAL_CHARS
    expect(result.prompt.length).toBeLessThanOrEqual(MAX_TOTAL_CHARS);

    // Every file in manifest must have a complete block
    for (const fp of result.manifest) {
      expect(result.prompt).toContain(`### ${fp}`);
      expect(result.prompt).toContain("```");
    }

    // No partial file at the end
    if (result.truncated) {
      // If truncated, the last manifest entry should be a complete block
      // (no prompt.slice remnants)
      const trimmed = result.prompt.trimEnd();
      expect(trimmed.endsWith("```")).toBe(true);
    }
  });
});

// =============================================================================
// BLOCKER 4: exact-file allowlist must re-verify after realpath resolution
// =============================================================================
describe("BLOCKER 4 — exact-file allowlist realpath re-verification", () => {
  const TMP = "/tmp/jabiko-b4-" + Date.now();
  const REPO = path.join(TMP, "repo");

  beforeEach(() => {
    fs.mkdirSync(path.join(REPO, "src", "domain"), { recursive: true });
    fs.writeFileSync(path.join(REPO, "CLAUDE.md"), "# repo");
    // allowed.ts is in the allowlist; redirect.ts is not
    fs.writeFileSync(path.join(REPO, "src", "domain", "allowed.ts"), "allowed content\n");
    fs.writeFileSync(path.join(REPO, "src", "domain", "redirect.ts"), "this should NOT be allowed\n");
    // Create a symlink in the exact allowlist that points to a file outside the allowlist
    fs.symlinkSync(
      path.join(REPO, "src", "domain", "redirect.ts"),
      path.join(REPO, "src", "domain", "linked_to_redirect.ts")
    );
  });
  afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }));

  it("rejects exact-file allowlist entry whose realpath resolves to a non-allowlisted file", () => {
    // Pass "linked_to_redirect.ts" as an exact allowlist entry.
    // Its realpath resolves to "redirect.ts" which is NOT in the allowlist.
    // The scanner must detect this and exclude it.
    const result = scanRepository({
      repoRoot: REPO,
      allowlist: ["src/domain/linked_to_redirect.ts"],
      protectedPaths: []
    });

    const paths = result.scannedFiles.map(f => f.path);
    // linked_to_redirect.ts resolves to redirect.ts, which is not in the exact list
    // So it should not be scanned
    expect(paths).not.toContain("src/domain/linked_to_redirect.ts");
    expect(paths).not.toContain("src/domain/redirect.ts");
  });

  it("accepts exact-file allowlist entry whose realpath matches the allowlist", () => {
    const result = scanRepository({
      repoRoot: REPO,
      allowlist: ["src/domain/allowed.ts"],
      protectedPaths: []
    });

    const paths = result.scannedFiles.map(f => f.path);
    expect(paths).toContain("src/domain/allowed.ts");
  });
});
