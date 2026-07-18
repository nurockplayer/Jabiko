// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it, beforeEach, afterEach } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import {
  validateFindingWithRepo,
  validateEvidenceExists,
  validateEvidenceLines,
  validateProductionFileExists,
  validateReproductionParentDir,
  isFileInManifest
} from "../repo-validator.mjs";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const TEST_DIR = "/tmp/jabiko-repovalid-test-" + Date.now();

const SRC_FILE = path.join(TEST_DIR, "src", "domain", "example.ts");
const ANOTHER_SRC = path.join(TEST_DIR, "src", "domain", "other.ts");
const NONEXISTENT = path.join(TEST_DIR, "src", "domain", "missing.ts");
const PROTECTED_FILE = path.join(TEST_DIR, "src", "domain", "contentGuard.ts");
const OUTSIDE_SYMLINK = path.join(TEST_DIR, "src", "domain", "link_outside");

function createFixture() {
  fs.mkdirSync(path.join(TEST_DIR, "src", "domain"), { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, "src", "hooks"), { recursive: true });
  fs.writeFileSync(SRC_FILE, "line1\nline2\nline3\nline4\nline5\n");
  fs.writeFileSync(ANOTHER_SRC, "a\nb\nc\n");
  fs.writeFileSync(PROTECTED_FILE, "protected content\n");
}

function cleanupFixture() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

// Helper to build a finding
function makeFinding(overrides = {}) {
  return {
    schemaVersion: 1,
    status: "finding",
    title: "test bug",
    confidence: 0.95,
    category: "logic-error",
    evidence: [
      { file: "src/domain/example.ts", startLine: 1, endLine: 3, reason: "test" }
    ],
    expectedBehavior: "should work",
    actualBehavior: "broken",
    reproduction: { testFile: "src/domain/example.regression.test.ts", testName: "test" },
    productionFiles: ["src/domain/example.ts"],
    risk: "low",
    ...overrides
  };
}

describe("validateEvidenceExists", () => {
  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("passes for existing regular file", () => {
    const r = validateEvidenceExists("src/domain/example.ts", TEST_DIR);
    expect(r.valid).toBe(true);
  });

  it("fails for nonexistent file", () => {
    const r = validateEvidenceExists("src/domain/missing.ts", TEST_DIR);
    expect(r.valid).toBe(false);
  });

  it("fails for file outside repo (traversal)", () => {
    const r = validateEvidenceExists("../../etc/passwd", TEST_DIR);
    expect(r.valid).toBe(false);
  });
});

describe("validateEvidenceLines", () => {
  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("passes when line range is within file", () => {
    const r = validateEvidenceLines("src/domain/example.ts", 1, 5, TEST_DIR);
    expect(r.valid).toBe(true);
  });

  it("fails when endLine exceeds file line count", () => {
    const r = validateEvidenceLines("src/domain/example.ts", 1, 999, TEST_DIR);
    expect(r.valid).toBe(false);
  });

  it("fails when startLine exceeds file line count", () => {
    const r = validateEvidenceLines("src/domain/example.ts", 999, 1000, TEST_DIR);
    expect(r.valid).toBe(false);
  });

  it("fails for nonexistent file", () => {
    const r = validateEvidenceLines("src/domain/missing.ts", 1, 5, TEST_DIR);
    expect(r.valid).toBe(false);
  });

  it("fails for path outside repo", () => {
    const r = validateEvidenceLines("/etc/passwd", 1, 5, TEST_DIR);
    expect(r.valid).toBe(false);
  });
});

describe("validateProductionFileExists", () => {
  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("passes for existing allowlisted file", () => {
    const r = validateProductionFileExists("src/domain/example.ts", TEST_DIR, ["src/domain/**"]);
    expect(r.valid).toBe(true);
  });

  it("fails for nonexistent file", () => {
    const r = validateProductionFileExists("src/domain/missing.ts", TEST_DIR, ["src/domain/**"]);
    expect(r.valid).toBe(false);
  });

  it("fails for protected path", () => {
    const r = validateProductionFileExists("src/domain/contentGuard.ts", TEST_DIR, ["src/domain/**"]);
    expect(r.valid).toBe(false);
  });
});

describe("validateReproductionParentDir", () => {
  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("passes when parent dir exists and matches production file dir", () => {
    const r = validateReproductionParentDir("src/domain/example.regression.test.ts", "src/domain/example.ts", TEST_DIR);
    expect(r.valid).toBe(true);
  });

  it("fails when parent dir does not exist", () => {
    const r = validateReproductionParentDir("src/hooks/nonexistent.regression.test.ts", "src/domain/example.ts", TEST_DIR);
    expect(r.valid).toBe(false);
  });

  it("fails when test dir differs from production dir", () => {
    // hooks dir exists but example.ts is in domain
    const r = validateReproductionParentDir("src/hooks/example.regression.test.ts", "src/domain/example.ts", TEST_DIR);
    expect(r.valid).toBe(false);
  });
});

describe("isFileInManifest", () => {
  it("returns true for file in manifest", () => {
    expect(isFileInManifest("src/domain/example.ts", ["src/domain/example.ts", "src/domain/other.ts"])).toBe(true);
  });

  it("returns false for file not in manifest", () => {
    expect(isFileInManifest("src/domain/example.ts", ["src/domain/other.ts"])).toBe(false);
  });

  it("returns false for empty manifest", () => {
    expect(isFileInManifest("src/domain/example.ts", [])).toBe(false);
  });
});

describe("validateFindingWithRepo", () => {
  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("passes for valid finding with real files", () => {
    const finding = makeFinding();
    const manifest = ["src/domain/example.ts"];
    const r = validateFindingWithRepo(finding, { repoRoot: TEST_DIR, manifest, allowlist: ["src/domain/**"] });
    expect(r.valid).toBe(true);
  });

  it("fails when evidence file does not exist", () => {
    const finding = makeFinding({ evidence: [{ file: "src/domain/missing.ts", startLine: 1, endLine: 2, reason: "r" }] });
    const manifest = ["src/domain/missing.ts"];
    const r = validateFindingWithRepo(finding, { repoRoot: TEST_DIR, manifest, allowlist: ["src/domain/**"] });
    expect(r.valid).toBe(false);
  });

  it("fails when evidence line range exceeds file", () => {
    const finding = makeFinding({ evidence: [{ file: "src/domain/example.ts", startLine: 1, endLine: 999, reason: "r" }] });
    const manifest = ["src/domain/example.ts"];
    const r = validateFindingWithRepo(finding, { repoRoot: TEST_DIR, manifest, allowlist: ["src/domain/**"] });
    expect(r.valid).toBe(false);
  });

  it("fails when production file does not exist", () => {
    const finding = makeFinding({ productionFiles: ["src/domain/missing.ts"] });
    const manifest = ["src/domain/missing.ts"];
    const r = validateFindingWithRepo(finding, { repoRoot: TEST_DIR, manifest, allowlist: ["src/domain/**"] });
    expect(r.valid).toBe(false);
  });

  it("fails when evidence file is not in manifest", () => {
    const finding = makeFinding({ evidence: [{ file: "src/domain/not_scanned.ts", startLine: 1, endLine: 2, reason: "r" }] });
    const manifest = ["src/domain/example.ts"];
    const r = validateFindingWithRepo(finding, { repoRoot: TEST_DIR, manifest, allowlist: ["src/domain/**"] });
    expect(r.valid).toBe(false);
  });

  it("fails when production file is not in manifest", () => {
    const finding = makeFinding({ productionFiles: ["src/domain/not_scanned.ts"] });
    const manifest = ["src/domain/example.ts"];
    const r = validateFindingWithRepo(finding, { repoRoot: TEST_DIR, manifest, allowlist: ["src/domain/**"] });
    expect(r.valid).toBe(false);
  });

  it("fails when reproduction parent dir does not exist", () => {
    const finding = makeFinding({ reproduction: { testFile: "src/hooks/nonexistent.regression.test.ts", testName: "x" } });
    const manifest = ["src/domain/example.ts"];
    const r = validateFindingWithRepo(finding, { repoRoot: TEST_DIR, manifest, allowlist: ["src/domain/**"] });
    expect(r.valid).toBe(false);
  });
});
