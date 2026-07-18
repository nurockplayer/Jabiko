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
  getDefaultProtectedPaths
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
  });

  it("protects pnpm-lock.yaml", () => {
    expect(isProtected("pnpm-lock.yaml")).toBe(true);
  });

  it("protects package.json dependency versions (detected as protected)", () => {
    expect(isProtected("package.json")).toBe(true);
  });

  it("protects generated files (examBlocks and furigana)", () => {
    expect(isProtected("src/domain/exam/examBlocks.ts")).toBe(true);
    expect(isProtected("src/domain/furiganaExplanationData.ts")).toBe(true);
    expect(isProtected("src/domain/furiganaLearningData.ts")).toBe(true);
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
