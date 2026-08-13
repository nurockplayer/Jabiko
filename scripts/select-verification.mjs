// =============================================================================
// select-verification.mjs — deterministic changed-path → verification selector
// (issue #760: tiered verification L0–L4)
// =============================================================================
//
// Pure, deterministic, fs-free: given a list of changed repo-relative paths,
// produce a verification plan (level + affected tests + gate commands +
// regeneration hints). No LLM guessing, no dependency graph — a small, explicit,
// auditable rule table that is easy to extend.
//
// Policy source of truth is CLAUDE.md (§ Verification ladder). This module is
// the *executable* expression of that policy; the two must stay in sync.
//
// Level contract (see CLAUDE.md):
//   L0 Targeted   — run the co-located test file for one changed source.
//   L1 Affected   — co-located/integration tests + changed test files.
//   L2 Feature    — L1 + path-aware domain gates (check:exam / check:i18n).
//   L3 Full       — repo-wide final verification (lint + test + build).
//
// Escalation rule: unknown or high-blast-radius changes classify to L3 rather
// than silently under-testing.
// =============================================================================

// ---------------------------------------------------------------------------
// Level ordering
// ---------------------------------------------------------------------------
export const LEVEL_RANK = { L0: 0, L1: 1, L2: 2, L3: 3 };

// ---------------------------------------------------------------------------
// Small explicit rule table. Each entry: { id, level, match, commands, tests,
// regenerate } where `match` is a predicate over a repo-relative path.
// First matching rule wins, so L3 (global/contract) rules come first.
// ---------------------------------------------------------------------------
const TEST_FILE_RE = /\.test\.(ts|tsx|mjs|mts|js)$/;

const isExact = (...paths) => (p) => paths.includes(p);
const isPrefix = (...prefixes) => (p) => prefixes.some((x) => p.startsWith(x));
const isBase = (re) => (p) => re.test(baseName(p));

// L2 gate commands that are mechanically subsumed by `pnpm test` (a vitest
// subset) and therefore must NOT run again at L3. check:exam =
// `vitest run src/domain/contentGuard.test.ts`, which is inside `pnpm test`'s
// project include globs. check:i18n is a separate Node scan, not subsumed.
const SUBSET_OF_TEST = new Set(["check:exam"]);

const RULES = [
  // ---- L3: high-blast-radius / contract surfaces -------------------------
  {
    id: "test-file",
    level: "L1",
    match: (p) => TEST_FILE_RE.test(p)
  },
  {
    id: "docs",
    level: "L1",
    match: (p) =>
      p.endsWith(".md") ||
      p.startsWith("docs/") ||
      isBase(/^\.(gitignore|editorconfig|prettierrc.*|npmrc|nvmrc)$/)(p) ||
      isBase(/^LICENSE$/)(p)
  },
  {
    id: "global-config",
    level: "L3",
    match: (p) =>
      isExact(
        "package.json",
        "pnpm-lock.yaml",
        "vite.config.ts",
        "vitest.config.ts",
        "index.html"
      )(p) ||
      isPrefix(".github/workflows/", "src/test/", "scripts/")(p) ||
      isBase(/^tsconfig(\..*)?\.json$/)(p) ||
      isBase(/^eslint\.config\./)(p) ||
      isBase(/^\.eslintrc/)(p)
  },
  {
    id: "root-routing",
    level: "L3",
    match: isExact(
      "src/main.tsx",
      "src/App.tsx",
      "src/components/index.ts",
      "src/domain/routes.ts"
    )
  },
  {
    id: "language-contract",
    level: "L3",
    match: isExact("src/i18n.ts")
  },
  {
    id: "cross-cutting-domain",
    level: "L3",
    match: isExact(
      "src/domain/types.ts",
      "src/domain/contentGuard.ts",
      "src/domain/contentStats.ts",
      "src/domain/examBlocks.ts"
    )
  },

  // ---- L2: path-aware domain gates ---------------------------------------
  {
    id: "i18n-locale",
    level: "L2",
    match: (p) =>
      p.startsWith("src/locales/") || (/\.i18n\.ts$/.test(p) && !TEST_FILE_RE.test(p)),
    commands: ["check:i18n"],
    tests: ["src/i18n.test.ts"]
  },
  {
    id: "exam-content",
    level: "L2",
    match: (p) =>
      p.startsWith("src/domain/exam/") ||
      isPrefix(
        "src/domain/vocabulary",
        "src/domain/cloze",
        "src/domain/grammar",
        "src/domain/sentencePatterns",
        "src/domain/learningBlock",
        "src/domain/kanjiOnyomi",
        "src/domain/wordOrder.ts",
        "src/domain/starterVocabulary.ts"
      )(p),
    commands: ["check:exam"],
    tests: ["src/domain/contentStats.test.ts", "src/domain/furiganaData.test.ts"],
    regenerate: ["build:furigana"]
  },
  {
    id: "furigana-reading",
    level: "L2",
    match: (p) =>
      p.startsWith("src/domain/furigana") ||
      p === "src/domain/readingConfusers.ts" ||
      p === "src/domain/readingLookup.ts",
    commands: [],
    tests: [
      "src/domain/furigana.test.ts",
      "src/domain/furiganaData.test.ts",
      "src/domain/furiganaExplanationLoader.test.ts",
      "src/domain/furiganaLearningLoader.test.ts"
    ],
    regenerate: ["build:furigana"]
  },
  {
    id: "article-content",
    level: "L2",
    match: (p) =>
      p.startsWith("src/domain/articles") ||
      p.startsWith("src/domain/articleBodies/") ||
      p.startsWith("src/domain/prerender/") ||
      p === "public/sitemap.xml",
    commands: [],
    tests: ["src/domain/sitemap.test.ts", "src/domain/articles.test.ts"],
    regenerate: ["build:sitemap"]
  },

  // ---- L1: leaf surfaces ------------------------------------------------
  { id: "component", level: "L1", match: (p) => p.startsWith("src/components/") },
  { id: "domain", level: "L1", match: (p) => p.startsWith("src/domain/") },
  { id: "hooks", level: "L1", match: (p) => p.startsWith("src/hooks/") },
  { id: "lib", level: "L1", match: (p) => p.startsWith("src/lib/") },

  // ---- fail-safe fallback ------------------------------------------------
  { id: "unknown", level: "L3", match: () => true }
];

const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

// ---------------------------------------------------------------------------
// Known direct integration tests for important shared surfaces. Deliberately
// small and auditable (not a dependency graph). Extend as surfaces grow.
// ---------------------------------------------------------------------------
export const DEFAULT_EXTRA_TESTS = {
  "src/domain/grammarDatabase.ts": [
    "src/domain/grammarIndex.test.ts",
    "src/domain/sitemap.test.ts"
  ],
  "src/domain/grammarIndex.ts": ["src/domain/sitemap.test.ts"],
  "src/domain/practice.ts": ["src/domain/practiceMode.test.ts"],
  "src/domain/sessionPools.ts": ["src/domain/practice.test.ts"]
};

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------
function baseName(p) {
  const i = p.lastIndexOf("/");
  return i < 0 ? p : p.slice(i + 1);
}

// ---------------------------------------------------------------------------
// classifyPath(path) → rule id. Deterministic; first matching rule wins.
// ---------------------------------------------------------------------------
export function classifyPath(path) {
  const rule = RULES.find((r) => r.match(path));
  return rule ? rule.id : "unknown";
}

// ---------------------------------------------------------------------------
// siblingTestCandidates(path) → candidate co-located test path(s).
//
// Deterministic string mapping; the *runner* filters to files that actually
// exist (keeps this module fs-free and trivially testable).
// ---------------------------------------------------------------------------
export function siblingTestCandidates(path) {
  if (TEST_FILE_RE.test(path)) return [path];
  const slash = path.lastIndexOf("/");
  const dir = slash < 0 ? "" : path.slice(0, slash + 1);
  const base = path.slice(slash + 1);

  if (base.endsWith(".i18n.ts")) {
    const stem = base.slice(0, -3); // strip ".ts"
    return [`${dir}${stem}.test.ts`];
  }
  if (base.endsWith(".tsx")) {
    const stem = base.slice(0, -4);
    return [`${dir}${stem}.test.tsx`];
  }
  if (base.endsWith(".ts")) {
    const stem = base.slice(0, -3);
    return [`${dir}${stem}.test.ts`, `${dir}${stem}.test.tsx`];
  }
  if (base.endsWith(".mjs")) {
    const stem = base.slice(0, -4);
    return [`${dir}${stem}.test.ts`, `${dir}${stem}.test.mjs`];
  }
  return [];
}

// ---------------------------------------------------------------------------
// selectVerification(changedPaths, options) → plan
//
//   { level, matches, tests, commands, regenerate, reasons }
//
//   level      "L1" | "L2" | "L3"  (highest level among changed paths)
//   matches    [{ category, level, paths }]  — audit trail
//   tests      affected test file paths (L1/L2; empty at L3 — `pnpm test` covers all)
//   commands   gate script names to run (`check:exam`, `check:i18n`, … / `lint`,`test`,`build`)
//   regenerate `build:furigana` / `build:sitemap` hints (workflow, not a gate)
//   reasons    human-readable "path -> category (level)" lines, sorted
// ---------------------------------------------------------------------------
export function selectVerification(changedPaths, { extraTests = DEFAULT_EXTRA_TESTS } = {}) {
  const byCategory = new Map();
  for (const p of changedPaths) {
    const cat = classifyPath(p);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(p);
  }

  let level = "L1";
  const tests = new Set();
  const commands = new Set();
  const regenerate = new Set();
  const matches = [];
  const reasons = [];

  for (const [cat, paths] of byCategory) {
    const rule = RULE_BY_ID[cat];
    const ruleLevel = rule.level ?? "L1";
    matches.push({ category: cat, level: ruleLevel, paths: [...paths].sort() });
    reasons.push(`${paths.sort().join(", ")} → ${cat} (${ruleLevel})`);
    if (LEVEL_RANK[ruleLevel] > LEVEL_RANK[level]) level = ruleLevel;
    for (const c of rule.commands ?? []) commands.add(c);
    for (const t of rule.tests ?? []) tests.add(t);
    for (const r of rule.regenerate ?? []) regenerate.add(r);
  }

  // Affected tests: co-located siblings + known integration edges + changed tests.
  for (const p of changedPaths) {
    for (const cand of siblingTestCandidates(p)) tests.add(cand);
    const extra = extraTests[p];
    if (extra) for (const t of extra) tests.add(t);
  }

  if (level === "L3") {
    // Full gate subsumes focused tests; keep only non-subset path gates
    // (check:i18n), drop check:exam (a vitest subset of `pnpm test`).
    const pathGates = [...commands].filter((c) => !SUBSET_OF_TEST.has(c)).sort();
    return {
      level,
      matches,
      tests: [],
      commands: ["lint", "test", "build", ...pathGates],
      regenerate: [],
      reasons: reasons.sort()
    };
  }

  return {
    level,
    matches,
    tests: [...tests].sort(),
    commands: [...commands].sort(),
    regenerate: [...regenerate].sort(),
    reasons: reasons.sort()
  };
}
