# Codebase Concerns

**Analysis Date:** 2026-07-07

## Tech Debt

### Exam Items Files Are Massively Large Monoliths
- Issue: Each JLPT level exam file is a single enormous TypeScript file. n1.ts is 13,494 lines (2.3MB on disk), n2.ts is 10,885 lines (1.7MB), n3.ts is 8,000 lines (1.2MB). Total across all five levels: 41,086 lines (~6.5MB raw). These files contain embedded data objects; editing a single question requires navigating a file with thousands of siblings.
- Files: `src/domain/exam/items/n1.ts`, `src/domain/exam/items/n2.ts`, `src/domain/exam/items/n3.ts`, `src/domain/exam/items/n4.ts`, `src/domain/exam/items/n5.ts`
- Impact: Slow IDE performance, difficult diff reviews for content PRs, high risk of merge conflicts when multiple content batches target the same level. CI build time is dominated by processing these files.
- Fix approach: Split each level file into smaller thematic files (e.g., `n1-grammar.ts`, `n1-vocab.ts`, `n1-kanji.ts`, `n1-reading.ts`), aggregated by `exam/items/n1/index.ts`. The `examBlocks.ts` comment itself notes this module "is slated to be split by section." The import pipeline (`scripts/import-exam-items.mjs`) already handles JSON-to-appending workflow, so the files just need structural splitting. This is a mechanical change, not a semantic one.

### GrammarPattern Has No i18n Overlay Fields
- Issue: The `GrammarPattern` type in `grammarDatabase.ts` has `meaningZh`, `formation`, `commonMistakes` (all arrays/strings), and `MediaLineExample.lineZh` -- all Chinese-only fields. There are no `meaningI18n`, `formationI18n`, `commonMistakesI18n`, or `lineI18n` overlay fields. PR #514 removed language gates from GrammarPointPage so all languages can view the database, but non-Chinese users currently see raw Chinese text for meaning, formation, common mistakes, and media example translations.
- Files: `src/domain/grammarDatabase.ts`, `src/domain/types.ts` (GrammarPattern type), `src/components/GrammarPointPage.tsx`
- Impact: Degraded UX for ja/en users viewing grammar detail pages. Non-Chinese learners see Chinese explanations they cannot read.
- Fix approach: Issue #516 tracks this. Add `meaningI18n`, `formationI18n`, `commonMistakesI18n` overlay fields to `GrammarPattern` and `lineI18n` to `MediaLineExample`. Wire them through `pickLocalized()` in `GrammarPointPage.tsx`. Requires translation work per pattern (92 patterns currently).

### contentStats Is Hardcoded and Prone to Drift
- Issue: `CONTENT_STATS` in `src/domain/contentStats.ts` is a hardcoded object with counts for `examItems`, `n1Grammar`, `patternChecks`, `vocab`, `kanjiReadings`, `grammarPatterns`. These numbers must be manually updated when content batches ship. The guard test `contentStats.test.ts` fails on drift, but it only catches the problem in CI -- if someone skips running tests locally, the home page silently displays stale counts.
- Files: `src/domain/contentStats.ts`, `src/domain/contentStats.test.ts`
- Impact: Home dashboard shows incorrect content counts after content batches if the stats are not manually updated. This is a recurring maintenance chore (every content batch requires a stats update).
- Fix approach: The hardcoding is intentional (avoids importing heavy data modules in the eager home bundle), but a build-time codegen step could automate it. Add a build script that generates `contentStats.ts` from the live data sources, or add a pre-commit hook that runs `pnpm test` before push to catch drift early.

### originMigration Bridge Infrastructure Still Active
- Issue: The `originMigration.ts` module implements a bridge-based redirect system (`migration-bridge.html`) for users migrating from the old domain (`jabiko.pages.dev`) to the new one. This includes `window.postMessage` listeners, localStorage-based attempt counting, and a dedicated hook (`useOriginMigration`). The bridge infrastructure adds complexity to the entry point (`main.tsx`) for a one-time migration scenario.
- Files: `src/domain/originMigration.ts`, `src/hooks/useOriginMigration.ts`, `src/main.tsx`
- Impact: Additional code in the eager entry path that serves a diminishing number of users. Testing the bridge flow is fragile (relies on `window.postMessage` and localStorage state).
- Fix approach: Monitor whether users still arrive from the old domain. Once traffic drops below a threshold, remove the bridge infrastructure entirely. This is a product decision, not an engineering one.

### Five Unlaunched Locale Files Maintained but Invisible
- Issue: `src/locales/th.ts`, `id.ts`, `ko.ts`, `vi.ts`, `my.ts` all contain complete Copy translations (~424 lines each), but these locales are excluded from `LAUNCHED_LANGUAGES` in `src/i18n.ts`. The locale files are maintained and compiled but inaccessible to users. The exam items DO have partial i18n overlays for some of these languages (evidence: `meaningI18n: { "ja": "...", "en": "..." }` patterns in exam items).
- Files: `src/i18n.ts` (LAUNCHED_LANGUAGES constant), `src/locales/th.ts`, `src/locales/id.ts`, `src/locales/ko.ts`, `src/locales/vi.ts`, `src/locales/my.ts`
- Impact: Maintenance burden without user benefit. Every new i18n key added requires translation into 8 locales even though only 3 are launched. CI builds compile dead locale code.
- Fix approach: Either launch these locales (add to `LAUNCHED_LANGUAGES`) or remove the unlaunched locale files until their exam content translations are complete. The comment in `i18n.ts` line 15 explains: "th/id/ko/vi/my ship their Copy files already; launching one later is just adding it here" -- meaning the files are ready but the exam content overlays are not. Either finish the exam content translations or accept partial UX.

### examBlocks Chunk Size Is Extremely Large (6.0MB)
- Issue: The `examBlocks-CZ7SttzE.js` chunk in the production build is 6.0MB (uncompressed). This is the exam items data for all five JLPT levels, loaded eagerly when the user enters any practice mode. The `ChallengePanel-UYUP11QW.js` chunk is an additional 1.4MB.
- Files: `src/domain/examBlocks.ts`, `src/domain/exam/items/*.ts`
- Impact: Slow initial load when entering practice mode, especially on mobile. Users on slow connections experience a noticeable delay between clicking "Start Practice" and seeing the challenge panel. The chunk is lazy-loaded (via `React.lazy`), so it does not affect the home page load, but it impacts the practice entry transition.
- Fix approach: Split exam items into per-level chunks that load on demand based on the user's level selection. Currently the entire bank loads regardless of whether the user selects N1-N3 or N4-N5. The `buildExamQuestionPool` function already filters by level, so the data could be split into separate lazy chunks: `examBlocks-n1.ts`, `examBlocks-n2.ts`, etc.

### SpeakButton Chunk Unusually Large (108KB)
- Issue: The `SpeakButton-BbcDhYMg.js` chunk is 108KB (uncompressed), unexpectedly large for a component that wraps the browser's `SpeechSynthesis` API.
- Files: `src/components/SpeakButton.tsx`, `src/lib/speech.ts`
- Impact: Higher-than-necessary chunk loaded whenever the TTS button appears. The component is used across multiple views (exam, grammar, kanji).
- Fix approach: Investigate what is being pulled into the SpeakButton chunk. If it's importing vocabulary or conjugation data, those should be deferred. The component should only need `src/lib/speech.ts` and React.

## Known Issues

### Grammar Database Media Examples Rely on Unverified Quotes
- Issue: Many `MediaLineExample` entries in `grammarDatabase.ts` have `confidence: "inspired_by"` -- meaning the Japanese line is reconstructed from memory, not verified against the actual source material. The file's header comment acknowledges this: "台詞例句如有不確定，以 confidence 如實標記，不偽造 verified 資料。" While the honesty is commendable, these quotes may contain subtle errors.
- Files: `src/domain/grammarDatabase.ts` (search for `confidence: "inspired_by"`)
- Impact: Learners may study from slightly inaccurate Japanese. Since the point is grammar pattern recognition, the risk is moderate -- the pattern in `grammarHighlight` is correct, but the surrounding sentence may not be authentic.
- Workaround: Current approach of honest confidence labeling is appropriate. Long-term: replace inspired_by examples with verified ones when source material can be rechecked.

### PR #476 (Zaraz Analytics) Not Yet Merged
- Issue: The Zaraz analytics Phase 1 implementation (PR #476, branch `worktree-zaraz-analytics-404`) has CI green and Codex SAFE verdict but is not merged. The PR was blocked by base branch policy requiring human reviewer approval.
- Files: `src/lib/analytics.ts` (NEW, on branch), `src/App.tsx` (8 event wiring spots, on branch), `src/hooks/usePracticeSession.ts` (on branch)
- Impact: No production analytics data being collected. The deployment-side work (Zaraz snippet in Cloudflare dashboard, `VITE_ZARAZ_ENABLED=true` in prod env) is also incomplete.
- Workaround: Await human reviewer. The deploy-side work is separately scoped.

### KanjiOnyomi Module Has Partial Coverage (20 Kanji)
- Issue: The kanji onyomi speed-reference table (`src/domain/kanjiOnyomi.ts`) covers approximately 20 kanji grouped by homophone families. This is a small fraction of the 2,136 常用漢字. The i18n module `kanjiOnyomi.i18n.ts` is 2,706 lines, suggesting significant content exists but only a subset is surfaced.
- Files: `src/domain/kanjiOnyomi.ts`, `src/domain/kanjiOnyomi.i18n.ts`
- Impact: Limited utility for learners wanting comprehensive kanji reading reference. The CLAUDE.md "next steps" mention "#195 漢字讀音速查表擴充全等級" as a candidate.
- Fix approach: Issue #195 (tracked in CLAUDE.md). Expand coverage systematically across JLPT levels.

## Security Considerations

### Supabase Anon Key in Client Bundle (Design Constraint, Not a Leak)
- Issue: The Supabase anon key (`VITE_SUPABASE_ANON_KEY`) is a Vite-prefixed env var, meaning it is embedded in the client bundle at build time. This is by design for Supabase (anon key is meant to be public), but it means the key is visible in the browser's JS source.
- Files: `src/lib/supabase.ts`, `.env` (present but NOT read for this analysis)
- Current mitigation: All database access is through Row-Level Security (RLS) policies in `supabase/migrations/0001_create_attempts.sql`, `0002_create_feedback.sql`, and `0003_rls_perf.sql`. Users can only read/write their own rows (scoped by JWT `user_id`). The `authenticated` role has explicit GRANTs. Feedback table has INSERT-only policy for anon users; SELECT is service_role only.
- Recommendations: Current RLS setup is solid. Continue auditing new tables with the same pattern: RLS enabled, explicit GRANTs, INSERT-only for public-facing tables.

### Content Visibility: Zh Fields Exposed to All Languages
- Issue: PR #514 removed language gates from `GrammarPointPage`, exposing `meaningZh`, `formation`, `commonMistakes` (all Chinese text) to non-Chinese users. While this is a deliberate product decision (better to show Chinese than show nothing), it contradicts the content visibility rules in CLAUDE.md which state `*Zh` fields must not render for non-`zh-Hant` locales without `pickLocalized()`.
- Files: `src/components/GrammarPointPage.tsx`, `src/domain/grammarDatabase.ts`
- Current mitigation: The CLAUDE.md notes this is the correct approach pending Issue #516 (i18n overlays for GrammarPattern). The `pickLocalized()` function is used where i18n overlays exist, but for fields without overlays, the raw Zh content is shown.
- Recommendations: Prioritize Issue #516 (GrammarPattern i18n overlays) to restore proper language isolation. Until then, the current behavior is intentional but should be documented as a temporary state.

### Browser SpeechSynthesis API Has Cross-Browser Inconsistencies
- Issue: `src/lib/speech.ts` uses the browser's built-in `SpeechSynthesis` API with `lang: "ja-JP"` and `rate: 0.95`. This API has known issues: Safari throttles/ignores `rate` and `pitch`, Chrome sometimes cuts off long utterances, Firefox has limited Japanese voice availability. The code handles the `voiceschanged` event but has no fallback.
- Files: `src/lib/speech.ts`, `src/components/SpeakButton.tsx`
- Current mitigation: `SpeakButton` checks `speechSynthesisSupported()` and renders nothing if unsupported. Voices are preloaded eagerly. The `utterance.onerror` and `utterance.onend` events are handled.
- Recommendations: Add a visible error state or toast when TTS fails (currently silent failure). Consider adding a `setTimeout` safety net for the `voiceschanged` event that never fires on some browsers.

## Performance Bottlenecks

### examBlocks 6.0MB Lazy Chunk Blocks Practice Entry
- Problem: The entire question bank (all 1,999 exam items across N1-N5) loads as a single chunk before any practice mode can start. On a slow 3G connection (~750 KB/s), this is an ~8 second delay.
- Files: `src/domain/examBlocks.ts`, `src/components/ChallengePanel.tsx`
- Cause: The `React.lazy(() => import("./components/ChallengePanel"))` boundary includes `examBlocks.ts` and all five level files. The chunk is monolithic.
- Improvement path: Split exam items into per-level chunks. Use dynamic imports inside `buildExamQuestionPool` to load only the levels needed by the user's selection. For the "all" default, load N1+N2 first (they make up the bulk of exam items), then stream in N3 warm-up as needed.

### furiganaData.ts Is 3,647 Lines of Generated Data
- Problem: `src/domain/furiganaData.ts` is a 3,647-line auto-generated file mapping words to their furigana readings. It is regenerated via `pnpm build:furigana` whenever vocabulary or exam items change. The file is imported lazily only when furigana rendering is needed, but at 3,647 lines it adds significant weight to its chunk.
- Files: `src/domain/furiganaData.ts`, `scripts/build-furigana.mjs`
- Cause: The furigana data is a comprehensive mapping from all vocabulary sources (vocab, JLPT vocab, and all exam item sentences). Every sentence token that kuromoji recognizes gets an entry.
- Improvement path: Consider compressing the data format (e.g., using shared prefix tries for readings). Per CLAUDE.md: "furiganaData 只進 lazy challenge chunk，勿從 eager 路徑匯入" -- the lazy loading is already in place, so the performance impact is limited to the challenge chunk.

### grammarDatabase.ts Not Lazy-Split
- Problem: All 92 grammar patterns (1,581 lines) are in a single file, including media examples with long description text. The `grammarIndex-BjJynXc-.js` chunk is 44.6KB uncompressed, which is reasonable, but adding more patterns linearly increases this chunk.
- Files: `src/domain/grammarDatabase.ts`
- Cause: Single-file design for a growing dataset. Currently 92 patterns; if expanded to hundreds, the file will become unwieldy.
- Improvement path: When the database surpasses ~200 patterns, consider splitting into per-level files (`n5Patterns.ts`, `n4Patterns.ts`, etc.) with a barrel export, similar to the exam items pattern. The current structure (five arrays concatenated at the bottom) already anticipates this.

## Fragile Areas

### contentGuard.test.ts Is the Sole Automated Quality Gate for Exam Content
- File: `src/domain/contentGuard.test.ts`
- Why fragile: This test file validates all 1,999 exam items for: option count, unique IDs, expected answer membership, no JLPT level leak in promptLabel, no answer gloss leak in hintZh, kana-only options for kanji reading items, no duplicate options, non-empty explanations, vocabNote i18n completeness, shuffleable word order prompts, and duplicate promptText. If this test is bypassed or broken, content quality regressions go undetected.
- Safe modification: The test imports `examStyleQuestions` directly, so it always validates the live data. Adding new checks is safe. Do NOT change the existing check logic without discussion -- these rules encode lessons from issues #64, #87, #89, #109, #120, #130, #136, #139, and #140.
- Test coverage: The guard itself has no meta-test (tests that test the guard). If a future refactor introduces a false negative (guard says OK but content is bad), it would go undetected. Priority: Low (the guard has held up well).

### contentStats.test.ts Is the Drift Canary -- If It Fails, Home Page Shows Wrong Numbers
- File: `src/domain/contentStats.test.ts`
- Why fragile: This test compares the hardcoded `CONTENT_STATS` against live data from `buildExamQuestionPool`, `buildSentencePatternPool`, `jlptVocabulary`, `kanjiOnyomi`, and `grammarPatterns`. If someone adds/removes content but forgets to update `CONTENT_STATS`, this test fails. If this test is skipped or CI doesn't run it, the home page silently shows stale counts.
- Safe modification: Always run `pnpm test` before committing content changes. The test imports heavy data modules (examBlocks etc.) but that's fine in test context. Update the hardcoded numbers in `contentStats.ts` when tests show drift.
- Test coverage: The test is comprehensive (covers all 6 stat fields) but has no guard against the guard being removed. Priority: Low.

### exam/items/*.ts Files Are Hand-Edited with EOL Sensitivity
- Files: `src/domain/exam/items/n1.ts` through `n5.ts`
- Why fragile: These files are marked `-text` in `.gitattributes` to prevent CRLF conversion. Editing them on Windows or with certain editors can introduce CRLF line endings, which `git diff --check` will flag. The CLAUDE.md Section 6 documents this: files must be staged with `git -c core.autocrlf=false add <files>` and verified with `git diff --cached --check`.
- Safe modification: Always use the import pipeline (`scripts/import-exam-items.mjs`) for batch additions. For manual edits, follow the EOL workflow documented in CLAUDE.md.
- Test coverage: No automated CRLF check in CI. The `pnpm check:exam` test would catch malformed data but not line ending issues. Priority: Low (workflow is documented).

### grammarPoints.ts and grammarIndex.ts Bridge Two Data Sources
- Files: `src/domain/grammarPoints.ts`, `src/domain/grammarIndex.ts`, `src/components/GrammarPointPage.tsx`
- Why fragile: The `GrammarPointPage` component queries two independent data sources: `buildGrammarPoint(surface)` (from examBlocks) and `findPatternBySurface(surface)` (from grammarDatabase). The rendering logic branches on which sources have data: both available, exam-only, database-only, or neither. This dual-source architecture creates four rendering paths that must all be maintained.
- Safe modification: When adding content to either examBlocks or grammarDatabase, verify the GrammarPointPage renders correctly for all four data scenarios. The `GrammarPointPage.test.tsx` covers some paths but not all database-only patterns.
- Test coverage: `grammarPoints.test.ts` and `grammarIndex.test.ts` test the individual modules. `GrammarPointPage.test.tsx` tests the component integration. Database-only patterns (patterns in grammarDatabase but not in examBlocks) may have gaps in integration test coverage.

### usePracticeSession Hook Is 505 Lines with Complex State Machine
- File: `src/hooks/usePracticeSession.ts`
- Why fragile: This is the core practice session state machine, managing mode switching, pool construction, question indexing, feedback state, scoring, and now analytics event wiring. At 505 lines with multiple `useEffect` and `useCallback` chains, the dependencies are dense and a change to one mode can affect others.
- Safe modification: Run the full test suite after any change. The hook has a test file (`usePracticeSession.test.ts`) but the hook's complexity means edge cases may not all be covered.
- Test coverage: `usePracticeSession.test.ts` exists but at 505 lines of hook logic, each mode (basic/cloze/daily/pattern/exam/review/vocab + level presets) likely has varying coverage depth.

## Scaling Limits

### Exam Item Count Growth Will Exacerbate Bundle Size
- Current capacity: 1,999 exam items across 5 files, producing a 6.0MB chunk.
- Limit: At ~3,000 items the chunk approaches 9MB, making practice entry unacceptably slow on mobile. Content growth is ongoing (CLAUDE.md mentions the goal of balanced type distribution).
- Scaling path: Implement per-level chunk splitting (see examBlocks chunk concern above). This is the highest-impact performance optimization available.

### Grammar Database Pattern Count Limits
- Current capacity: 92 grammar patterns. Each pattern averages ~17 lines of data (including examples and media).
- Limit: At ~300 patterns the grammarDatabase.ts file reaches ~5,000 lines -- still manageable but slow to navigate.
- Scaling path: Split into per-level files (structure already anticipates this with separate n5Patterns/n4Patterns/... arrays).

## Dependencies at Risk

### @supabase/supabase-js Dynamic Import
- Risk: The Supabase SDK (~210KB raw / ~55KB gzip) is dynamically imported via `import("@supabase/supabase-js")` in `src/lib/supabase.ts`. If the dynamic import pattern breaks (e.g., Vite bundling change), the SDK could leak into the initial bundle.
- Impact: Initial bundle grows by ~55KB gzip, affecting home page load time.
- Migration plan: The current lazy singleton pattern is correct and documented. Monitor Vite major version upgrades for changes to dynamic import chunking behavior.

### kuromoji (Imported in build-furigana.mjs, Not in Runtime)
- Risk: `scripts/build-furigana.mjs` uses kuromoji for morphological analysis during build. kuromoji is a Node.js package with large dictionary files. If the build script breaks on a Node.js version upgrade, furigana data regeneration fails silently (or with errors).
- Impact: Stale furigana data in production; new vocabulary items lack furigana readings. Not a runtime failure since `furiganaData.ts` is pre-built.
- Migration plan: Pin the kuromoji version. The CLAUDE.md documents `READING_OVERRIDES` for correcting kuromoji misreadings.

## Missing Critical Features

### GrammarPattern i18n Overlays (Issue #516)
- Problem: After PR #514 removed language gates from grammar pages, non-Chinese users see Chinese-only content (meanings, formations, common mistakes, media example translations) on grammar detail pages.
- Blocks: Proper multi-language grammar learning experience. Current state (showing Chinese to all users) is a deliberate intermediate step but not the end goal.

### Comprehensive Kanji Reading Coverage (Issue #195)
- Problem: The kanji onyomi module covers only ~20 kanji out of 2,136 常用漢字. Learners wanting quick reading reference for arbitrary kanji are underserved.
- Blocks: Full kanji reading reference utility. Current scope is a demo/proof-of-concept.

### SRS Modernization (Issue #135 Epic)
- Problem: The current Leitner box system (5 boxes, 0/1/3/7/14 day intervals) is simpler than modern SRS algorithms (SM-2, FSRS). It does not account for item difficulty or user-specific forgetting curves.
- Blocks: More efficient long-term retention for JLPT preparation. Current system works but may over-test easy items and under-test difficult ones.

## Test Coverage Gaps

### Source Files Without Corresponding Test Files
- `src/domain/vocabulary.ts` -- Core vocabulary module (~70+ words, ~170+ extra verbs). No `vocabulary.test.ts`.
- `src/domain/cloze.ts` and `src/domain/cloze-data.ts` -- Cloze question logic and seed data. No tests.
- `src/domain/grammarDatabase.ts` -- Grammar pattern database (92 patterns). No tests (grammarIndex and grammarPoints have tests, but grammarDatabase itself does not).
- `src/domain/sentencePatterns.ts` -- Sentence pattern question pool builder (32 patterns). No direct test (covered via contentGuard.test.ts for format, but not for pool-building logic).
- `src/hooks/useAuth.ts` -- Supabase auth hook. No test.
- `src/components/ChallengePanel.tsx` -- Core practice UI (mode cards, filter selectors, level picker). No test.
- `src/components/GrammarIndexPage.tsx` -- Grammar browse/catalog page. No test.
- `src/components/MockExamPanel.tsx` -- JLPT mock exam section selector. No test.
- `src/components/LearningPanel.tsx` -- Study chapter directory. No test.
- `src/lib/supabase.ts` -- Supabase client singleton. No test.
- Risk: Bugs in untested modules may go undetected until production. Priority: Medium for vocabulary.ts and ChallengePanel.tsx (core user flows), Low for reference/static modules (conjugationTables, types).

### Complex Component Under-Tested Areas
- `src/hooks/usePracticeSession.ts` (505 lines): The test file exists but at this complexity level, mode-specific edge cases (examN1 vs examN2 presets, sessionExhausted dedupe, level change during active session) likely have gaps.
- `src/components/FeedbackPanel.tsx` (feedback panel): Has tests but complex branching for kanji reading display, grammar note lookup, and post-answer reveal states may have gaps.
- `src/components/GrammarPointPage.tsx`: Has tests but the four data-availability scenarios (both/exam-only/db-only/neither) may not all be tested equally.

---

*Concerns audit: 2026-07-07*
