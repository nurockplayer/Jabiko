import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs tooling module, no types
import {
  classifyPath,
  selectVerification,
  siblingTestCandidates
} from "./select-verification.mjs";

const sel = (paths: string[]) => selectVerification(paths);

describe("siblingTestCandidates", () => {
  it("maps a .tsx source to its co-located .test.tsx", () => {
    expect(siblingTestCandidates("src/components/MoreMenu.tsx")).toEqual([
      "src/components/MoreMenu.test.tsx"
    ]);
  });

  it("maps a .ts source to both .test.ts and .test.tsx candidates", () => {
    expect(siblingTestCandidates("src/hooks/useFurigana.ts")).toEqual([
      "src/hooks/useFurigana.test.ts",
      "src/hooks/useFurigana.test.tsx"
    ]);
  });

  it("maps a .i18n.ts source to its .i18n.test.ts sibling", () => {
    expect(siblingTestCandidates("src/domain/kanjiOnyomi.i18n.ts")).toEqual([
      "src/domain/kanjiOnyomi.i18n.test.ts"
    ]);
  });

  it("maps a scripts/*.mjs tool to its .test.ts sibling", () => {
    expect(siblingTestCandidates("scripts/build-furigana.mjs")).toContain(
      "scripts/build-furigana.test.ts"
    );
  });

  it("returns the test file itself for a changed test file", () => {
    expect(siblingTestCandidates("src/domain/conjugation.test.ts")).toEqual([
      "src/domain/conjugation.test.ts"
    ]);
  });
});

describe("classifyPath", () => {
  it("classifies representative surfaces", () => {
    expect(classifyPath("src/components/MoreMenu.tsx")).toBe("component");
    expect(classifyPath("src/domain/conjugation.ts")).toBe("domain");
    expect(classifyPath("src/domain/exam/items/n1.ts")).toBe("exam-content");
    expect(classifyPath("src/locales/en.ts")).toBe("i18n-locale");
    expect(classifyPath("src/domain/furiganaData.ts")).toBe("furigana-reading");
    expect(classifyPath("src/domain/articlesMeta.ts")).toBe("article-content");
    expect(classifyPath("package.json")).toBe("global-config");
    expect(classifyPath("src/App.tsx")).toBe("root-routing");
    expect(classifyPath("src/i18n.ts")).toBe("language-contract");
    expect(classifyPath("src/domain/types.ts")).toBe("cross-cutting-domain");
    expect(classifyPath("README.md")).toBe("docs");
    expect(classifyPath("src/unknown/newthing.ts")).toBe("unknown");
  });
});

describe("selectVerification — levels", () => {
  it("component change -> L1 with co-located sibling test", () => {
    const plan = sel(["src/components/MoreMenu.tsx"]);
    expect(plan.level).toBe("L1");
    expect(plan.tests).toContain("src/components/MoreMenu.test.tsx");
    expect(plan.commands).toEqual([]);
  });

  it("domain change -> L1 with co-located sibling test", () => {
    const plan = sel(["src/domain/conjugation.ts"]);
    expect(plan.level).toBe("L1");
    expect(plan.tests).toContain("src/domain/conjugation.test.ts");
  });

  it("hooks change -> L1", () => {
    const plan = sel(["src/hooks/useFurigana.ts"]);
    expect(plan.level).toBe("L1");
    expect(plan.tests).toContain("src/hooks/useFurigana.test.tsx");
  });

  it("exam content change -> L2 with check:exam + drift guards", () => {
    const plan = sel(["src/domain/exam/items/n1.ts"]);
    expect(plan.level).toBe("L2");
    expect(plan.commands).toContain("check:exam");
    expect(plan.tests).toContain("src/domain/contentStats.test.ts");
    expect(plan.tests).toContain("src/domain/furiganaData.test.ts");
    expect(plan.regenerate).toContain("build:furigana");
  });

  it("i18n locale change -> L2 with check:i18n", () => {
    const plan = sel(["src/locales/en.ts"]);
    expect(plan.level).toBe("L2");
    expect(plan.commands).toContain("check:i18n");
    expect(plan.tests).toContain("src/i18n.test.ts");
  });

  it("i18n overlay source (.i18n.ts) -> i18n gate, not exam", () => {
    const plan = sel(["src/domain/kanjiOnyomi.i18n.ts"]);
    expect(plan.level).toBe("L2");
    expect(plan.commands).toContain("check:i18n");
    expect(plan.commands).not.toContain("check:exam");
    expect(plan.tests).toContain("src/domain/kanjiOnyomi.i18n.test.ts");
  });

  it("furigana/reading change -> L2 with furigana drift guard + regenerate", () => {
    const plan = sel(["src/domain/furiganaData.ts"]);
    expect(plan.level).toBe("L2");
    expect(plan.tests).toContain("src/domain/furiganaData.test.ts");
    expect(plan.regenerate).toContain("build:furigana");
  });

  it("article/content change -> L2 with sitemap drift guard + regenerate", () => {
    const plan = sel(["src/domain/articlesMeta.ts"]);
    expect(plan.level).toBe("L2");
    expect(plan.tests).toContain("src/domain/sitemap.test.ts");
    expect(plan.regenerate).toContain("build:sitemap");
  });

  it("language contract (src/i18n.ts) -> L3", () => {
    expect(sel(["src/i18n.ts"]).level).toBe("L3");
  });

  it("global config -> L3", () => {
    for (const p of [
      "package.json",
      "pnpm-lock.yaml",
      "vite.config.ts",
      "tsconfig.json",
      ".github/workflows/ci.yml",
      "src/test/setup.ts",
      "scripts/build-furigana.mjs"
    ]) {
      expect(sel([p]).level, p).toBe("L3");
    }
  });

  it("root routing -> L3", () => {
    for (const p of ["src/main.tsx", "src/App.tsx", "src/components/index.ts", "src/domain/routes.ts"]) {
      expect(sel([p]).level, p).toBe("L3");
    }
  });

  it("cross-cutting domain contract -> L3", () => {
    for (const p of [
      "src/domain/types.ts",
      "src/domain/contentGuard.ts",
      "src/domain/contentStats.ts",
      "src/domain/examBlocks.ts"
    ]) {
      expect(sel([p]).level, p).toBe("L3");
    }
  });

  it("changed test file -> L1 and runs itself", () => {
    const plan = sel(["src/domain/contentGuard.test.ts"]);
    expect(plan.level).toBe("L1");
    expect(plan.tests).toContain("src/domain/contentGuard.test.ts");
  });

  it("unknown path -> L3 (fail-safe escalation)", () => {
    const plan = sel(["src/weird/newthing.ts"]);
    expect(plan.level).toBe("L3");
  });

  it("docs -> L1 with no tests or commands", () => {
    const plan = sel(["README.md", "docs/item-quality-rubric.md"]);
    expect(plan.level).toBe("L1");
    expect(plan.tests).toEqual([]);
    expect(plan.commands).toEqual([]);
  });
});

describe("selectVerification — aggregation & escalation", () => {
  it("max level wins (component + exam -> L2)", () => {
    const plan = sel(["src/components/MoreMenu.tsx", "src/domain/exam/items/n1.ts"]);
    expect(plan.level).toBe("L2");
    expect(plan.commands).toContain("check:exam");
    expect(plan.tests).toContain("src/components/MoreMenu.test.tsx");
  });

  it("any L3 category wins (component + package.json -> L3)", () => {
    const plan = sel(["src/components/MoreMenu.tsx", "package.json"]);
    expect(plan.level).toBe("L3");
    expect(plan.commands).toEqual(expect.arrayContaining(["lint", "test", "build"]));
  });

  it("unions gate commands across L2 categories (exam + i18n)", () => {
    const plan = sel(["src/domain/exam/items/n1.ts", "src/locales/en.ts"]);
    expect(plan.level).toBe("L2");
    expect(plan.commands).toEqual(expect.arrayContaining(["check:exam", "check:i18n"]));
  });

  it("L3 keeps non-subset path gate (check:i18n) but drops check:exam (subset of test)", () => {
    const plan = sel(["src/domain/exam/items/n1.ts", "package.json"]);
    expect(plan.level).toBe("L3");
    expect(plan.commands).toEqual(expect.arrayContaining(["lint", "test", "build"]));
    // check:exam is a vitest subset of `pnpm test` -> mechanically redundant at L3
    expect(plan.commands).not.toContain("check:exam");
  });

  it("empty change set -> L1, nothing to run", () => {
    const plan = sel([]);
    expect(plan.level).toBe("L1");
    expect(plan.tests).toEqual([]);
    expect(plan.commands).toEqual([]);
  });

  it("is deterministic (order-independent)", () => {
    const a = sel(["src/components/MoreMenu.tsx", "src/domain/exam/items/n1.ts", "src/locales/en.ts"]);
    const b = sel(["src/locales/en.ts", "src/domain/exam/items/n1.ts", "src/components/MoreMenu.tsx"]);
    expect(a.level).toBe(b.level);
    expect(a.tests).toEqual(b.tests);
    expect(a.commands).toEqual(b.commands);
    expect(a.regenerate).toEqual(b.regenerate);
  });

  it("known integration test for a shared surface (grammarDatabase -> sitemap)", () => {
    const plan = sel(["src/domain/grammarDatabase.ts"]);
    expect(plan.level).toBe("L2");
    expect(plan.tests).toContain("src/domain/sitemap.test.ts");
    expect(plan.tests).toContain("src/domain/grammarIndex.test.ts");
  });
});
