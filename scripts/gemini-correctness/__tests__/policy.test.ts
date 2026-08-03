// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import {
  isPathSafe,
  isProtected,
  isAllowlisted,
  isValidRegressionTest,
  resolveProductionDir,
  getDefaultAllowlist,
  getDefaultProtectedPaths,
  MAX_GREEN_PRODUCTION_FILES,
  MAX_GREEN_DIFF_LINES,
  parseUnifiedDiff
} from "../policy.mjs";

describe("getDefaultAllowlist", () => {
  const allowlist = getDefaultAllowlist();

  it("includes src/domain/**", () => {
    expect(allowlist).toContain("src/domain/**");
  });

  it("includes src/hooks/**", () => {
    expect(allowlist).toContain("src/hooks/**");
  });
});

describe("getDefaultProtectedPaths", () => {
  const protectedPaths = getDefaultProtectedPaths();

  it("includes contentGuard.ts", () => {
    expect(protectedPaths.some(p => p.includes("contentGuard"))).toBe(true);
  });

  it("includes exam items", () => {
    expect(protectedPaths.some(p => p.includes("exam/items"))).toBe(true);
  });

  it("includes furiganaData.ts", () => {
    expect(protectedPaths.some(p => p.includes("furiganaData"))).toBe(true);
  });

  it("includes .github/", () => {
    expect(protectedPaths.some(p => p.includes(".github"))).toBe(true);
  });

  it("includes .env files", () => {
    expect(protectedPaths.some(p => p.includes(".env"))).toBe(true);
  });
});

describe("isPathSafe", () => {
  it("rejects absolute paths", () => {
    expect(isPathSafe("/etc/passwd", [])).toBe(false);
    expect(isPathSafe("/src/domain/test.ts", [])).toBe(false);
  });

  it("rejects path traversal with ../", () => {
    expect(isPathSafe("../../etc/passwd", [])).toBe(false);
  });

  it("rejects symlink-like paths", () => {
    expect(isPathSafe("src/domain/link -> /etc/passwd", [])).toBe(false);
  });

  it("accepts relative paths within the repo", () => {
    expect(isPathSafe("src/domain/test.ts", [])).toBe(true);
    expect(isPathSafe("src/hooks/useAuth.ts", [])).toBe(true);
  });

  it("rejects empty path", () => {
    expect(isPathSafe("", [])).toBe(false);
  });

  it("rejects null path", () => {
    expect(isPathSafe(null, [])).toBe(false);
  });
});

describe("isProtected", () => {
  it("protects contentGuard.ts", () => {
    expect(isProtected("src/domain/contentGuard.ts")).toBe(true);
  });

  it("protects types.ts", () => {
    expect(isProtected("src/domain/types.ts")).toBe(true);
  });

  it("protects exam item files", () => {
    expect(isProtected("src/domain/exam/items/n5.ts")).toBe(true);
    expect(isProtected("src/domain/exam/items/n1.ts")).toBe(true);
  });

  it("protects furiganaData.ts", () => {
    expect(isProtected("src/domain/furiganaData.ts")).toBe(true);
  });

  it("protects i18n.ts", () => {
    expect(isProtected("src/i18n.ts")).toBe(true);
  });

  it("does NOT protect general domain files", () => {
    expect(isProtected("src/domain/vocabulary.ts")).toBe(false);
    expect(isProtected("src/domain/storage.ts")).toBe(false);
  });

  it("protects supabase migrations", () => {
    expect(isProtected("supabase/migrations/0001_create_attempts.sql")).toBe(true);
  });

  it("protects .github/ workflows", () => {
    expect(isProtected(".github/workflows/ci.yml")).toBe(true);
  });

  it("protects .env* files", () => {
    expect(isProtected(".env")).toBe(true);
    expect(isProtected(".env.local")).toBe(true);
    expect(isProtected(".env.example")).toBe(true);
    expect(isProtected(".envrc")).toBe(true);
  });

  it("protects pnpm-lock.yaml", () => {
    expect(isProtected("pnpm-lock.yaml")).toBe(true);
  });

  it("protects package.json dependency versions (detected as protected)", () => {
    expect(isProtected("package.json")).toBe(true);
  });

  it("protects generated files (examBlocks and furigana)", () => {
    expect(isProtected("src/domain/examBlocks.ts")).toBe(true);
    expect(isProtected("src/domain/furiganaExplanationData.ts")).toBe(true);
    expect(isProtected("src/domain/furiganaLearningData.ts")).toBe(true);
  });

  it("protects auth, remote persistence, and origin migration code plus tests", () => {
    expect(isProtected("src/hooks/useAuth.ts")).toBe(true);
    expect(isProtected("src/hooks/useProgressAttempts.test.tsx")).toBe(true);
    expect(isProtected("src/hooks/useOriginMigration.ts")).toBe(true);
    expect(isProtected("src/domain/attemptRemote.test.ts")).toBe(true);
    expect(isProtected("src/domain/feedbackRemote.ts")).toBe(true);
    expect(isProtected("src/domain/originMigration.test.ts")).toBe(true);
  });

  it("protects translation overlay files", () => {
    expect(isProtected("src/domain/vocabulary.i18n.ts")).toBe(true);
    expect(isProtected("src/domain/conjugationTables.i18n.test.ts")).toBe(true);
  });

  it("protects authored learning content and legal copy from repair targeting", () => {
    expect(isProtected("src/domain/articleBodies/restaurantOrdering.ts")).toBe(true);
    expect(isProtected("src/domain/articles.ts")).toBe(true);
    expect(isProtected("src/domain/cloze-data.ts")).toBe(true);
    expect(isProtected("src/domain/grammarDatabase.ts")).toBe(true);
    expect(isProtected("src/domain/legalContent.ts")).toBe(true);
    expect(isProtected("src/domain/legalLabels.ts")).toBe(true);
  });

  it("protects deployment and generated-site behavior", () => {
    expect(isProtected("src/domain/prerender/staticPages.ts")).toBe(true);
    expect(isProtected("src/domain/seo.ts")).toBe(true);
    expect(isProtected("src/domain/sitemap.test.ts")).toBe(true);
    expect(isProtected("src/hooks/usePwaUpdate.ts")).toBe(true);
  });
});

describe("isAllowlisted", () => {
  it("accepts paths matching the allowlist", () => {
    expect(isAllowlisted("src/domain/vocabulary.ts", ["src/domain/**"])).toBe(true);
    expect(isAllowlisted("src/hooks/useAuth.ts", ["src/domain/**", "src/hooks/**"])).toBe(true);
  });

  it("rejects paths not matching the allowlist", () => {
    expect(isAllowlisted("src/components/Button.tsx", ["src/domain/**"])).toBe(false);
    expect(isAllowlisted("package.json", ["src/domain/**"])).toBe(false);
  });

  it("accepts test files alongside production code", () => {
    expect(isAllowlisted("src/domain/vocabulary.test.ts", ["src/domain/**"])).toBe(true);
  });

  it("rejects exam items even with src/domain/** allowlist (protected dominates)", () => {
    // Note: allowlist is a separate check from protected. A file can be
    // both allowlisted AND protected. It's the validator's job to check both.
    // This test just confirms the allowlist check passes for any src/domain path.
    expect(isAllowlisted("src/domain/exam/items/n5.ts", ["src/domain/**"])).toBe(true);
    expect(isAllowlisted("src/i18n.ts", ["src/hooks/**", "src/domain/**"])).toBe(false);
  });
});

describe("isValidRegressionTest", () => {
  it("accepts .regression.test.ts in the same directory", () => {
    expect(isValidRegressionTest("src/domain/example.regression.test.ts", "src/domain/example.ts")).toBe(true);
  });

  it("accepts .regression.test.tsx in the same directory", () => {
    expect(isValidRegressionTest("src/domain/example.regression.test.tsx", "src/domain/example.ts")).toBe(true);
  });

  it("rejects .test.ts (not .regression.test.ts)", () => {
    expect(isValidRegressionTest("src/domain/example.test.ts", "src/domain/example.ts")).toBe(false);
  });

  it("rejects test in a different directory", () => {
    expect(isValidRegressionTest("src/hooks/example.regression.test.ts", "src/domain/example.ts")).toBe(false);
  });

  it("rejects test with empty path", () => {
    expect(isValidRegressionTest("", "src/domain/example.ts")).toBe(false);
  });

  it("rejects missing productionFile", () => {
    expect(isValidRegressionTest("src/domain/x.regression.test.ts", "")).toBe(false);
  });
});

describe("resolveProductionDir", () => {
  it("returns directory for a file path", () => {
    expect(resolveProductionDir("src/domain/example.ts")).toBe("src/domain");
  });

  it("handles nested paths", () => {
    expect(resolveProductionDir("src/domain/sub/module.ts")).toBe("src/domain/sub");
  });

  it("throws for empty path", () => {
    expect(() => resolveProductionDir("")).toThrow();
  });

  it("throws for null path", () => {
    expect(() => resolveProductionDir(null)).toThrow();
  });
});

describe("GREEN hard constants", () => {
  it("caps production files and diff lines at the Issue #637 budgets", () => {
    expect(MAX_GREEN_PRODUCTION_FILES).toBe(3);
    expect(MAX_GREEN_DIFF_LINES).toBe(250);
  });
});

describe("parseUnifiedDiff", () => {
  it("parses a single-file unified diff with per-file add/delete counts", () => {
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1,3 +1,4 @@\n" +
      " export function read() {\n" +
      "-  return \"stale\";\n" +
      "+  return \"safe\";\n" +
      "+  // added line\n" +
      " }\n";
    const result = parseUnifiedDiff(diff);

    expect(result.valid).toBe(true);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toEqual({
      path: "src/domain/example.ts",
      additions: 2,
      deletions: 1,
      addedLines: ['  return "safe";', "  // added line"],
      removedLines: ['  return "stale";']
    });
    expect(result.totalAdditions).toBe(2);
    expect(result.totalDeletions).toBe(1);
  });

  it("parses a multi-file unified diff and rejects paths outside the repo", () => {
    const diff =
      "diff --git a/src/domain/a.ts b/src/domain/a.ts\n" +
      "--- a/src/domain/a.ts\n" +
      "+++ b/src/domain/a.ts\n" +
      "@@ -1 +1 @@\n" +
      "-old\n" +
      "+new\n" +
      "diff --git a/src/domain/b.ts b/src/domain/b.ts\n" +
      "--- a/src/domain/b.ts\n" +
      "+++ b/src/domain/b.ts\n" +
      "@@ -1 +1 @@\n" +
      "-x\n" +
      "+y\n";
    const result = parseUnifiedDiff(diff);

    expect(result.valid).toBe(true);
    expect(result.files.map(file => file.path))
      .toEqual(["src/domain/a.ts", "src/domain/b.ts"]);
    expect(result.totalAdditions).toBe(2);
    expect(result.totalDeletions).toBe(2);
  });

  it.each([
    ["an empty string", "", /empty/i],
    ["a non-string input", 42, /string/i],
    ["a null input", null, /string/i]
  ])("rejects %s", (_label, input, pattern) => {
    const result = parseUnifiedDiff(input);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(pattern);
  });

  it("rejects a diff that references a path outside the repository", () => {
    const diff =
      "diff --git a/../../etc/passwd b/../../etc/passwd\n" +
      "--- a/../../etc/passwd\n" +
      "+++ b/../../etc/passwd\n" +
      "@@ -1 +1 @@\n" +
      "-root\n" +
      "+hacked\n";
    const result = parseUnifiedDiff(diff);
    expect(result.valid).toBe(false);
  });

  it("rejects a diff with an absolute path", () => {
    const diff =
      "diff --git a//etc/passwd b//etc/passwd\n" +
      "--- a//etc/passwd\n" +
      "+++ b//etc/passwd\n" +
      "@@ -1 +1 @@\n" +
      "-root\n" +
      "+hacked\n";
    const result = parseUnifiedDiff(diff);
    expect(result.valid).toBe(false);
  });

  it("rejects a diff with an index/similarity header or no file header", () => {
    const bare =
      "@@ -1 +1 @@\n- old\n+ new\n";
    expect(parseUnifiedDiff(bare).valid).toBe(false);

    const similarity =
      "similarity index 100%\n" +
      "rename from a.ts\n" +
      "rename to b.ts\n";
    expect(parseUnifiedDiff(similarity).valid).toBe(false);
  });

  it("rejects a hunk body that has no file attribution", () => {
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1,3 +1,3 @@\n" +
      " export function readEmptyQueue() {\n" +
      '-  return "stale";\n' +
      '+  return "safe";\n' +
      " }\n" +
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "@@ -2,1 +2,1 @@\n" +
      " }\n" +
      "+// smuggled line\n";
    const result = parseUnifiedDiff(diff);
    expect(result.valid).toBe(false);
  });

  it("counts hunk header context lines without counting them as additions", () => {
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1,5 +1,5 @@\n" +
      " export function read() {\n" +
      "+  return \"safe\";\n" +
      "   const value = 1;\n" +
      " }\n";
    const result = parseUnifiedDiff(diff);
    expect(result.valid).toBe(true);
    expect(result.files[0].additions).toBe(1);
    expect(result.files[0].deletions).toBe(0);
    expect(result.totalAdditions).toBe(1);
    expect(result.totalDeletions).toBe(0);
  });
});
