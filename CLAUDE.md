# Jabiko Project Rules

## Technical Artifact Language Policy

**English is the canonical language for new technical artifacts**: code-facing comments/docstrings, developer errors/logs, tests, architecture/API/schema documentation, CI/CD documentation, implementation plans, branch/commit messages, and detailed issue/PR technical specifications.

- Concise Japanese summaries in team-facing issue/PR descriptions are allowed when useful; detailed engineering specifications must be in English.
- **Never translated by this policy:** user-facing product localization, Japanese-learning content, test fixtures/test data whose language is part of behavior, and external/public contracts.
- Legacy documents that predate this policy follow **touch-to-migrate** — they are migrated to English only when a concrete maintenance edit touches them, never in a blind repository-wide translation pass. See “Touch-to-migrate” below.
- `CLAUDE.md` is the authoritative project rules; `AGENTS.md` is its concise mirror. On conflict, `CLAUDE.md` wins.

### Touch-to-migrate (legacy Traditional Chinese artifacts)

These documents still contain Traditional Chinese and are migrated on touch (a concrete maintenance edit), not proactively:

- `docs/item-quality-rubric.md` — question-quality rubric used by the exam content pipeline
- `docs/future-development-directions.md` — future-direction vision notes
- `docs/exam-grammar-original-question-list.md`, `docs/exam-grammar-rewrite-backlog.md`, `docs/exam-public-practice-quality-review-and-batch-2.md` — exam content working notes
- `docs/claude-exam-batch-2-short-prompt.md`, `docs/claude-exam-grammar-review-prompt.md` — exam batch prompt drafts
- `docs/learning-tracking-system-proposal.md`, `docs/llm-judge-quality.md` — proposals
- `docs/superpowers/specs/*.md`, `docs/superpowers/plans/*.md` — 2026-05/06 historical design drafts (already flagged as non-authoritative in `AGENTS.md`); out of scope for migration
- `.planning/codebase/*.md` are already English and serve as the English source of truth for architecture/testing/structure/stack/conventions/integrations/concerns.
- The Japanese-learning content itself (`src/domain/**`, `src/locales/**`) is product content and is out of scope for this policy.

## Tech Stack

- React 19 + TypeScript strict mode + Vite 7 + Vitest 4 + jsdom
- pnpm package management
- Domain-driven design: `src/domain/` (business logic), `src/components/` (React UI), `src/hooks/`

## Read Before Modifying

- `src/domain/vocabulary.ts` and `src/domain/vocabulary-jlpt.ts` are hot paths
- `src/domain/types.ts` defines all domain types
- `src/domain/contentGuard.test.ts` is the correctness gate for item content
- Before modifying any domain file, read its corresponding `.test.ts` to understand expected behavior
- Before adding/modifying exam items, read [`docs/item-quality-rubric.md`](docs/item-quality-rubric.md) (item-quality rubric: unique correct answer, distractors, no leaks, format)

## Verification Ladder (L0–L3, issue #760)

Development verification is tiered; the closer to delivery, the stronger the verification. **Do not** use a repo-wide full verification run as the minimal TDD unit.

| Level | When | What to run |
| --- | --- | --- |
| **L0 Targeted** | each TDD RED/GREEN iteration | tests in the same directory as the file under test: `pnpm vitest run <file>.test.ts` |
| **L1 Affected** | after one implementation/refactor unit | affected tests (same-directory siblings + known integration tests + the changed test files) |
| **L2 Feature Gate** | before commit / PR-ready | L1 + path-aware domain gate (`check:exam` / `check:i18n`) + drift guard |
| **L3 Full** | PR ready / final review / before merge | `pnpm lint`, `pnpm test`, `pnpm build` (+ non-test-subset path gates) |

**Executor:** `pnpm verify` picks L1/L2 automatically from git changed paths (escalating to L3 when necessary); `pnpm verify --dry-run` only shows the plan; **`pnpm verify:full` is the single final-delivery command** (= `--level 3`: L3 full + applicable non-test path gates retained by changed paths, e.g. `check:i18n`). The selector lives in [`scripts/select-verification.mjs`](scripts/select-verification.mjs) and is a deterministic, testable, conservative explicit rule table (**no LLM guessing**, no dependency graph).

**Escalation (fail-safe):** unknown or high-blast-radius changes always escalate to L3 — prefer over-verification over silently testing less. At minimum this covers: test setup/config, Vite/Vitest/TS/build config, `package.json`/lockfile, shared routing, cross-cutting domain contract/type, language/fallback contracts, and the verification tooling itself (incl. `scripts/*.test.ts`); a failing base diff, or production source with no existing affected test, also escalates to L3 (never a no-op).

**Representative mapping** (full rules in `scripts/select-verification.mjs`):
- component / domain / hooks / lib → L1 sibling test
- exam/content (`src/domain/exam/**`, vocabulary/grammar/sentencePatterns/learningBlocks/kanjiOnyomi/wordOrder/cloze/starterVocabulary) → L2 `check:exam` + contentStats/furigana drift
- i18n (`src/locales/**`, `*.i18n.ts`) → L2 `check:i18n` + `i18n.test.ts`
- furigana/reading (`src/domain/furigana*`, readingConfusers/readingLookup) → L2 furigana drift + (`build:furigana` regeneration)
- article/content (`src/domain/articles*`, articleBodies, prerender, public/sitemap.xml) → L2 `sitemap.test.ts` drift + (`build:sitemap` regeneration)
- `src/i18n.ts`, `src/domain/types.ts`, `contentGuard.ts`, `contentStats.ts`, `examBlocks.ts`, `src/App.tsx`/`main.tsx`/`routes.ts`/`components/index.ts` → L3

**Deduplication** (only skip a physical run when mechanically equivalent — never weaken a semantic gate):
- `pnpm typecheck` (`tsc --noEmit`) is the first stage of `pnpm build` → no separate typecheck run needed at L3.
- `pnpm check:exam` (`vitest run contentGuard.test.ts`) ⊂ `pnpm test` → no separate run needed at L3 or in CI.
- Only proven semantic equivalence may eliminate a physical duplicate run; never delete a verification step without proof.

Other existing rules:
- After TypeScript changes, run `pnpm build` to ensure it compiles
- After domain-logic changes, run `pnpm test` to ensure no regression
- When a build fails, read the error first and fix it, don't blindly retry

## TDD Development Workflow (mandatory)

All development must follow the **Red-Green-Refactor** loop (mapped onto the verification ladder):

1. **RED** — write the test first; use **L0** to run that test file and confirm it fails because the feature doesn't exist (`pnpm vitest run <file>.test.ts`)
2. **GREEN** — write the minimal code to make that test (L0) pass
3. **REFACTOR** — after refactoring, run **L1** (affected) to stay green
4. Before commit — run **L2** path-specific gate
5. Before PR ready / final review / merge — run **L3** full

Every report must state the **highest level actually completed** and the **exact commands/results run** (pass/fail), never just “tested”.

### Iron rules

- **No production code without a test written first**
- Every new feature / bug fix must have a corresponding test
- Passing without ever observing a test failure means you tested the wrong thing
- If you wrote code before thinking of the test, delete and start over
- Exceptions (waivable after informing the user): one-off prototypes, pure config files, auto-generated code

## Invariants

- Don't change the validation rules in `src/domain/contentGuard.ts` except through issue discussion
- `src/domain/types.ts` types are a contract; don't delete or break backward compatibility casually
- All domain logic must live in `src/domain/`; don't put business logic in `src/components/`
- pnpm is the only package manager; never generate an npm/yarn/bun lockfile

## Content Visibility Rules (content visibility — product ownership boundary)

These are product decisions, not engineering decisions. AI is **forbidden** to change them without explicit human approval.

### Language isolation rules

- `*Zh`-suffixed fields (`meaningZh`, `hintZh`, `instructionZh`, `lineZh`, `contextZh`,
  `promptContextZh`, `explanation`, `commonMistakes`) are untranslated Chinese content and **must
  not** be rendered to any language other than `zh-Hant`, unless through `pickLocalized()` or
  `pickLocalizedOptional()` with a valid i18n overlay.
- `formation` is a one-direction Chinese continuation rule; treat it like `meaningZh`.
- `lineZh` and `contextZh` must be guarded by `isZhHant` even inside child components.
- `isZhHant` (`language === "zh-Hant"`) is the only gate variable. **No** other gate conventions allowed.

### Forbidden (AI must ask first)

- Removing the `isZhHant` guard that protects `*Zh` fields.
- Adding components that render `*Zh` fields without a language gate.
- Changing `LAUNCHED_LANGUAGES` in `src/i18n.ts` (it decides which languages users see).
- Adding a language code to `LocaleCode` (requires a content translation plan).
- Changing the behavior of `pickLocalized()` or its fallback chain.
- If you think a language gate should be removed: **stop and ask the user**. The correct approach
  is to add an i18n overlay field to the data model first (e.g. `meaningI18n` on `GrammarPattern`)
  and route through `pickLocalized()`. This is a product decision, not an engineering decision.

## Workspace Isolation

- All implementation tasks that modify files **must** be done in a git worktree (`EnterWorktree`); never modify the working directory directly
- Pure queries, reads, and searches don't need a worktree

## Code Conventions

- TypeScript strict mode fully on; `any` forbidden unless explicitly justified in a comment
- Test files live next to source files, named `*.test.ts` or `*.test.tsx`
- React components are function components + hooks, never class components
- Imports use ES module paths (relative paths)

## Exam Content Pipeline

Adding exam items (grammar/vocabulary, etc.) always goes through this loop, one PR per batch:

1. **Verify the gap**: grep existing items in `src/domain/exam/items/<level>.ts`, searching **both** surface and expectedAnswer, kanji and kana, to confirm the point isn't already covered by another question type.
2. **Double-blinded design**: a subagent and codex each produce a draft in parallel (2 items per point), then **cross-review** (codex reviews the subagent file, the subagent reviews the codex file), and finally one **final-review** subagent scans for double answers / instant continuation kills / leaks.
   - Biggest traps = **near-synonym double answers** and **continuation instant-kills**. Locking approach: put full predicates in options, use antonyms for distractors, lock the direction with context/time adverbs. codex is usually better than the subagent at catching double answers.
   - codex usage: `codex exec --skip-git-repo-check "$(cat prompt.txt)" < /dev/null` (stdin must be closed or it hangs). codex sometimes writes explanations in Japanese; translate them to Traditional Chinese when consolidating.
3. **Convert**: convert the simplified shape (`question/answer/...`) into the importer's `ExamQuestionInput` (`id,level,surface,reading,meaningZh,promptLabel,instructionZh,promptText,promptContextZh,hintZh,expectedAnswer,options[4],explanation`) in `scripts/exam-batches/<name>.json`.
   - **contentGuard hard rules**: `hintZh` non-empty and **sharing no ≥2-char substring with `meaningZh`**; exactly 4 mutually distinct `options`; `expectedAnswer ∈ options`; `promptLabel` must not contain N1–N5 strings.
4. **Verify**: pass `node scripts/import-exam-items.mjs <file> --dry-run`, then run `--dry-run` without the actual append.
5. **contentStats sync** (`src/domain/contentStats.ts`, hardcoded numbers; `contentStats.test.ts` is the drift guard):
   - `examItems` counts **all** levels; `n1Grammar` counts only N1 grammar form-selection items.
   - **N1 batches: both `examItems` and `n1Grammar` +N; N2/N3 batches: only `examItems`.**
   - **furigana regeneration** (#134 P4): when the batch has new exam example sentences/stems, run `pnpm build:furigana` to regenerate `src/domain/furiganaData.ts` (baked from vocab + jlpt + exam sources; new sentences' readings appear, kanji-reading stems are auto-excluded). Add kuromoji misreadings to the script's `READING_OVERRIDES` (use compound-word keys, not ambiguous single kanji like 後/九). `furiganaData` only goes into the lazy challenge chunk; don't import it from eager paths ([[jabiko-bundle-codesplit]]).
6. **EOL**: `exam/items/*.ts` is `-text` in git; CRLF is reported by `git diff --check`. Stage with `git -c core.autocrlf=false add <files>`, and confirm `git diff --cached --check` EXIT=0 before committing.
7. **Three gates + build**: `pnpm check:exam`, `pnpm test` (incl. contentGuard/contentStats drift), `pnpm build` (confirm `examBlocks` is still a lazy independent chunk and `index` doesn't grow).
8. **PR**: branch → push (pre-push hook runs build) → `gh pr create`. **The only required CI gate is `Test and build`**; CodeRabbit/Cloudflare are often rate-limit skips and don't block. After green, `gh pr merge --squash --delete-branch`.
   - ⚠ Don't start a background CI waiter infinite loop (after PR merge + branch deletion `gh` returns empty, `jq` throws on null, and the condition never holds → zombie). To wait, use a **bounded loop with an iteration cap**, or query `gh pr checks` inline.

## Current Progress Snapshot (2026-06-25)

- **JLPT grammar coverage complete**: N1(#164)/N2(#165)/N3(#166) sub-issues closed, parent #157 wrapped up.
- **N1 characters & vocabulary (文字・語彙) rebalancing complete** (#152, three N1 vocab usage/synonym/cloze batches). `examItems = 989`, `n1Grammar = 265`.
- **Cross-device sync (#151) complete and end-to-end verified**: Supabase `attempts` table + RLS + explicit grant (#196 added; **don't rely on Supabase implicit default privileges**); prod test confirmed 1065 cloud rows match local. #181/#151 closed. See user memory `jabiko-cross-device-sync`.
- Batch source JSONs are kept in `scripts/exam-batches/`; grammar-loop details are in user memory `jabiko-grammar-coverage-loop`.
- **Next-step candidates** (start only after discussing with the user): #195 kanji-reading lookup table expansion to all levels, #135 SRS modernization epic, #134 furigana toggle, #124 question-type distribution rebalancing.
