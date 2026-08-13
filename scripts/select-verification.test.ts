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
    expect(classifyPath("public/sitemap.xml")).toBe("article-content");
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
    const plan = sel(["src/domain/prerender/staticPages.ts"]);
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

describe("selectVerification — review fixes (#760 re-review)", () => {
  it("verification-tooling test change -> L3, not L1 (scripts/*.test.ts)", () => {
    for (const p of ["scripts/verify.test.ts", "scripts/select-verification.test.ts"]) {
      expect(sel([p]).level, p).toBe("L3");
    }
  });

  it("forced L3 retains applicable non-test path gate (i18n)", () => {
    const plan = selectVerification(["src/locales/en.ts"], { forceL3: true });
    expect(plan.level).toBe("L3");
    expect(plan.commands).toEqual(["lint", "test", "build", "check:i18n"]);
  });

  it("forced L3 on a non-i18n change has no path gate", () => {
    const plan = selectVerification(["src/components/MoreMenu.tsx"], { forceL3: true });
    expect(plan.level).toBe("L3");
    expect(plan.commands).toEqual(["lint", "test", "build"]);
  });

  it("production source with no existing affected test escalates to L3 (fail-safe)", () => {
    const plan = selectVerification(["src/components/RulesPanel.tsx"], { exists: () => false });
    expect(plan.level).toBe("L3");
    expect(plan.commands).toEqual(["lint", "test", "build"]);
  });

  it("production source WITH an existing sibling test stays L1", () => {
    const exists = (p: string) => p === "src/components/MoreMenu.test.tsx";
    const plan = selectVerification(["src/components/MoreMenu.tsx"], { exists });
    expect(plan.level).toBe("L1");
    expect(plan.tests).toContain("src/components/MoreMenu.test.tsx");
  });

  it("docs-only change stays L1 and does not escalate (not a production source)", () => {
    const plan = selectVerification(["README.md"], { exists: () => false });
    expect(plan.level).toBe("L1");
  });
});

describe("selectVerification — rename + L2 fail-safe (#762 re-review)", () => {
  it("rename of an L3 source -> ordinary path still selects L3", () => {
    const plan = sel(["src/App.tsx", "src/components/MovedApp.tsx"]);
    expect(plan.level).toBe("L3");
  });

  it("rename of an i18n-sensitive source preserves its required gate", () => {
    const plan = sel(["src/locales/en.ts", "docs/translations/en.md"]);
    expect(plan.level).toBe("L2");
    expect(plan.commands).toContain("check:i18n");
  });

  it("cloze.ts (mapped) stays L2 and runs its covering practice/session-pool tests", () => {
    const exists = (p: string) =>
      ["src/domain/practice.test.ts", "src/domain/sessionPools.test.ts"].includes(p);
    const plan = selectVerification(["src/domain/cloze.ts"], { exists });
    expect(plan.level).toBe("L2");
    expect(plan.tests).toContain("src/domain/practice.test.ts");
    expect(plan.tests).toContain("src/domain/sessionPools.test.ts");
  });

  it("exam/items (gate-covered L2) stays L2, not escalated", () => {
    const plan = selectVerification(["src/domain/exam/items/n1.ts"], { exists: () => false });
    expect(plan.level).toBe("L2");
  });

  it("readingLookup.ts (no test, not gate-covered) escalates to L3", () => {
    const plan = selectVerification(["src/domain/readingLookup.ts"], { exists: () => false });
    expect(plan.level).toBe("L3");
  });
});

describe("selectVerification — mapping audit corrections", () => {
  it("sentencePatterns.ts (builder logic) maps to starterPatterns + sessionPools", () => {
    const exists = (p: string) =>
      ["src/domain/starterPatterns.test.ts", "src/domain/sessionPools.test.ts"].includes(p);
    const plan = selectVerification(["src/domain/sentencePatterns.ts"], { exists });
    expect(plan.level).toBe("L2");
    expect(plan.tests).toContain("src/domain/starterPatterns.test.ts");
    expect(plan.tests).toContain("src/domain/sessionPools.test.ts");
  });

  it("sentencePatterns.ts escalates to L3 when its builder tests are absent (not gate-covered)", () => {
    const plan = selectVerification(["src/domain/sentencePatterns.ts"], { exists: () => false });
    expect(plan.level).toBe("L3");
  });

  it("practice.ts maps to sessionPools.test.ts, not practiceMode.test.ts", () => {
    const exists = (p: string) =>
      ["src/domain/practice.test.ts", "src/domain/sessionPools.test.ts"].includes(p);
    const plan = selectVerification(["src/domain/practice.ts"], { exists });
    expect(plan.level).toBe("L1");
    expect(plan.tests).toContain("src/domain/sessionPools.test.ts");
    expect(plan.tests).not.toContain("src/domain/practiceMode.test.ts");
  });
});
