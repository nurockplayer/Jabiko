# Jabiko — Codex Agent Guidelines

> **Source of truth: `CLAUDE.md`.** This file is a concise mirror for Codex; on conflict, `CLAUDE.md` wins. (#314)

## Language

- Always reply in Taiwan Traditional Chinese. Japanese is used only for learning materials, example sentences, UI labels, or grammar explanations.
- Per the Technical Artifact Language Policy in `CLAUDE.md`, technical artifacts (code comments/docstrings, developer errors/logs, tests, architecture/API/schema docs, CI/CD docs, implementation plans, branches/commits, and detailed issue/PR technical specifications) are written in English; concise Japanese summaries in team-facing issue/PR descriptions are optional.

## Project Positioning (current as of 2026-07)

Jabiko (jabiko.app) is a free, registration-free **JLPT N5–N1 self-study room**: grammar / vocabulary / kanji readings / official question types / mock exams. Item bank 3,600+, learning sections 73+.

- Tech stack: React 19 + TypeScript strict + Vite 7 + Vitest 4 + jsdom, pnpm, PWA (vite-plugin-pwa)
- Data: local-first (localStorage) + **optional** Supabase cross-device sync (Google login); Cloudflare Pages deployment + prerender
- i18n: launched languages zh-Hant / ja / en (`LAUNCHED_LANGUAGES`); ko/th/id/vi/my Copy files present but not launched

The old description (a 《大家的日本語》verb-conjugation tool with no backend and no login) is outdated; don't make design assumptions from it. `docs/superpowers/specs/` are 2026-05 historical design drafts, not the current spec.

## Shell Commands

Run commands directly (**there is no `rtk` tool** — leftover from an old convention; don't wait for it or claim it's missing to skip verification).

- Node/frontend tooling is always `pnpm`; never use npm/yarn/bun (and never generate their lockfiles)
- Verification ladder (#760, source of truth = the "Verification Ladder" section of `CLAUDE.md`): **L0** targeted `pnpm vitest run <file>` → **L1** affected → **L2** path gate (`pnpm verify` picks the level by changed paths) → **L3** full `pnpm lint && pnpm test && pnpm build`. Always run L3 before a PR
- After adding/modifying **articles**, always run `pnpm build:sitemap` (the sitemap drift guard blocks CI — historically the step Codex most often misses)
- After adding exam example sentences/stems, run `pnpm build:furigana`

## Policy Key Rules (CLAUDE.md summary; violating = blocks merge)

- **TDD mandatory**: write the test and observe RED first; exceptions only for one-off prototypes, pure config files, auto-generated code (tell the user first)
- **contentGuard invariant**: don't change the validation rules in `src/domain/contentGuard.ts` except through issue discussion
- **Language isolation**: `*Zh` fields must not be rendered to languages other than zh-Hant unless via `pickLocalized()` with a valid i18n overlay; `isZhHant` is the only gate variable; don't touch `LAUNCHED_LANGUAGES` / `LocaleCode` / the `pickLocalized()` fallback
- **Layering**: domain logic in `src/domain/`, React components don't hold business logic; TypeScript strict, no `any`
- **Bundle discipline**: examBlocks / furigana data / article bodies may only enter lazy chunks; don't import them from eager paths (App / components barrel / home page)
- **EOL**: `exam/items/*.ts` is `-text`; stage with `git -c core.autocrlf=false add <files>` (list files explicitly); `git diff --cached --check` must be clean before committing

## Scope Boundaries

- Don't mix unrequested features, refactors, or future work into the same change
- When you need a new dependency, an architecture change, or scope growth, report the reason and alternatives first
- Content batches (item banks / articles) are naturally large diffs; that's normal, no apology needed for diff size

## Git / PR Conventions

- Branch naming `codex/<short-description>`; concise commit messages (English imperative or `<type>: <desc>`)
- Don't use `git add -A` / `git add .`; stage only this task's files
- GitHub/git commands must be non-interactive
- **Set the PR to ready when opened** (draft blocks merge)
- **Don't open stacked PRs** (base pointing at another PR's branch): when the earlier PR is squash-merged and its branch deleted, the later ones get auto-closed by GitHub and can't be reopened. Open each content PR from main
- The only required CI gate is "Test and build"; a CodeRabbit green check may be a rate-limit skip, not a real review

## Supply Chain Security

- Don't add dependencies on your own unless the task requires it and the reason is stated in the report
- Don't run `npx`, `pnpm dlx`, `npm exec`, `curl | bash`, `wget | sh`, or similar remote ad-hoc executions
- `package.json` and lockfile changes must be explicitly explained in the report

## Content Quality (item banks / articles)

- Before writing items, read `docs/item-quality-rubric.md`: unique correct answer, distractor lure answers, no leaks, format
- Biggest traps = near-synonym double answers and continuation instant-kills; biggest teaching-sentence trap = **customer sentences asking the listener's action with 〜ますか** (subject misplacement)
- Articles don't reproduce lyrics (external links + fragment placeholders); example sentences are always original

## Testing and Verification

- Verification ladder (#760): L0 targeted → L1 affected → L2 path gate → L3 full. Executor: `pnpm verify` (level selected by changed paths), `pnpm verify --dry-run`, `pnpm verify:full`. Selector = `scripts/select-verification.mjs` (deterministic explicit rules, not LLM guessing); unknown / high-blast-radius changes fail-safe to L3. Full mapping in `CLAUDE.md` and that file; not duplicated here.
- Before claiming completion, report the actual verification executed (highest level + commands + pass/fail). Priority tests: changed logic (音便 / ない形 / irregular), answer normalization, contentGuard/contentStats drift, main practice flows.

## Report Format

- List only key changes: file + one-line explanation
- Test results: report only pass/fail and failure reasons, not full logs
- On errors, give a diagnosis and suggested fix first, then ask whether to continue
