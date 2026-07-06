<!-- refreshed: 2026-07-07 -->
# Architecture

**Analysis Date:** 2026-07-07

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                     Browser (SPA, no SSR)                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   React Component Tree (src/components/)        │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐  │ │
│  │  │HomePanel │LearnPanel│RulesPanel│KanjiPanel│GrammarIndex   │  │ │
│  │  │(eager)   │(eager)   │(eager)   │(lazy)    │Page(lazy)     │  │ │
│  │  ├──────────┴──────────┴──────────┴──────────┴──────────────┤  │ │
│  │  │  ChallengePanel (lazy) -- owns practice engine            │  │ │
│  │  │  ┌───────────┬──────────────┬───────────┐                 │  │ │
│  │  │  │ModePicker │DrillPanel    │ScoreReport│                 │  │ │
│  │  │  │(setup)    │(active drill)│(mistakes) │                 │  │ │
│  │  │  └───────────┴──────────────┴───────────┘                 │  │ │
│  │  ├───────────────────────────────────────────────────────────┤  │ │
│  │  │  MockExamPanel (lazy) -- section picker                    │  │ │
│  │  │  GrammarPointPage (lazy) -- per-point study page           │  │ │
│  │  └───────────────────────────────────────────────────────────┘  │ │
│  └────────────────┬───────────────────────────────────────────────┘ │
│                   │ props: language, progressAttempts, …            │
│  ┌────────────────▼───────────────────────────────────────────────┐ │
│  │                  Hooks Layer (src/hooks/)                       │ │
│  │  usePracticeSession │ useProgressAttempts │ useLanguage │       │ │
│  │  useAuth │ useSeoMeta │ useFurigana │ useTheme │ usePwaUpdate  │ │
│  └────────────────┬───────────────────────────────────────────────┘ │
│                   │ import pure functions                           │
│  ┌────────────────▼───────────────────────────────────────────────┐ │
│  │                 Domain Layer (src/domain/)                       │ │
│  │  ┌─────────┬─────────┬──────────┬──────────┬────────────────┐  │ │
│  │  │conjugat.│practice │sessionP. │srs       │grammarIndex    │  │ │
│  │  │cloze    │sentenceP│examBlocks│vocabulary│grammarDatabase │  │ │
│  │  │types    │storage  │seo       │stats     │localizedContent│  │ │
│  │  └─────────┴─────────┴──────────┴──────────┴────────────────┘  │ │
│  │  analytics/   exam/       exam/items/                           │ │
│  │  (trend,weak, (types,     (n1.ts .. n5.ts: ~47k lines total)   │ │
│  │   questionType) helpers)                                        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌────────────────────┐    ┌──────────────────────────────┐
│ localStorage       │    │ Supabase (optional, lazy)     │
│ (attempts, prefs)  │    │ (cross-device sync, auth)     │
└────────────────────┘    └──────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App | Root shell: URL routing, language/theme/furigana state, auth wire-up | `src/App.tsx` |
| HomePanel | Dashboard: stats, activity trend, weakness bars, content cards, progress ring | `src/components/HomePanel.tsx` |
| LearningPanel | Study roadmap: chapter cards, drill presets per grammar concept | `src/components/LearningPanel.tsx` |
| RulesPanel | Conjugation reference tables per verb/adjective form | `src/components/RulesPanel.tsx` |
| ChallengePanel | Practice workspace: wires usePracticeSession into ModePicker/DrillPanel/ScoreReport | `src/components/ChallengePanel.tsx` |
| MockExamPanel | JLPT section picker: lists exam sections by level for targeted practice | `src/components/MockExamPanel.tsx` |
| KanjiOnyomiPanel | Kanji lookup by onyomi reading group, with example vocabulary | `src/components/KanjiOnyomiPanel.tsx` |
| GrammarIndexPage | Grammar database overview: level browsing, search, media filtering | `src/components/GrammarIndexPage.tsx` |
| GrammarPointPage | Per-grammar-point study page: aggregated exam items + curated notes | `src/components/GrammarPointPage.tsx` |
| ModePicker | In-challenge mode/settings sidebar (level, focus, target form) | `src/components/challenge/ModePicker.tsx` |
| DrillPanel | Active question display, answer input, submit/reveal cycle | `src/components/challenge/DrillPanel.tsx` |
| ScoreReport | Session score, accuracy ring | `src/components/challenge/ScoreReport.tsx` |
| ExamPrompt | Exam-style question rendering (prompt, options, hint, post-answer feedback) | `src/components/ExamPrompt.tsx` |
| FeedbackPanel | Post-answer feedback: correctness, explanation, grammar study link, vocab notes | `src/components/FeedbackPanel.tsx` |
| GrammarNoteCard | Curated grammar note card (rule/usage/examples/confusions) | `src/components/GrammarNoteCard.tsx` |
| LanguagePicker | Modal language selector with flags | `src/components/LanguagePicker.tsx` |

## Pattern Overview

**Overall:** Domain-Driven Design with lazy code-split React SPA

**Key Characteristics:**
- Pure domain layer (`src/domain/`) contains all business logic, data, and types -- zero React imports
- React components (`src/components/`) are presentational; they import domain functions but never contain business logic
- Hooks (`src/hooks/`) bridge domain functions into React state and lifecycle
- Aggressive lazy splitting: heavy question banks (exam items, vocabulary tables, grammar database) only load when the learner enters practice views
- Barrel file (`src/components/index.ts`) exports only 4 eager panels -- everything else is intentionally excluded and lazy-loaded
- No router library: custom URL-based routing via `window.history.pushState` + `popstate` listener
- i18n overlay pattern: Chinese-source fields (`*Zh`) carry authoritative content; per-locale overlays (`*I18n`) provide translations; `pickLocalized()` is the single read path

## Layers

**Domain Layer (`src/domain/`):**
- Purpose: All business logic, data, types, pure functions. Never imports React.
- Contains: Type definitions, conjugation engine, question pool builders, SRS algorithm, content guards, grammar database, vocabulary tables, exam item factories, analytics computations, storage abstraction, localization helpers
- Depends on: Nothing outside `src/domain/` (except `src/i18n.ts` for Language type via `src/domain/types.ts` which owns the `LocaleCode` union)

**Hooks Layer (`src/hooks/`):**
- Purpose: React state management wrappers around domain functions. Owns side-effects (localStorage reads/writes, DOM manipulation, Supabase calls).
- Contains: `usePracticeSession` (practice engine), `useProgressAttempts` (attempt history + cross-device sync), `useLanguage` (UI locale), `useAuth` (Google auth via Supabase), `useSeoMeta` (document head meta), `useFurigana` (ruby toggle), `useTheme` (dark/light), `usePwaUpdate` (service worker update prompt), `useOriginMigration` (domain migration bridge)
- Depends on: Domain layer (pure functions), `src/i18n.ts` (Copy type), `src/lib/supabase.ts` (auth client)

**Component Layer (`src/components/`):**
- Purpose: React UI rendering. No business logic.
- Contains: View panels, practice sub-components, shared UI primitives (Ruby, SpeakButton, JabikoMark), feedback forms
- Depends on: Domain types, hooks, i18n copy, CSS modules (imported via `src/styles.css`)

**Styles Layer (`src/styles/`):**
- Purpose: Plain CSS per view/module, imported via `src/styles.css` which `@import`s all files
- Contains: `base.css`, `layout.css`, `home.css`, `learning.css`, `rules.css`, `challenge.css`, `grammar.css`, `kanji.css`, `mock.css`, `feedback.css`, `about.css`, `responsive.css`, `review.css`, `language-picker.css`
- Depends on: Nothing (pure CSS)

**i18n Layer (`src/i18n.ts` + `src/locales/`):**
- Purpose: UI chrome translation (Copy type). Content translation uses domain-layer overlay pattern (`*I18n` fields).
- Contains: `Copy` type (~350 keys), `copy` record assembling 8 locale files, `LAUNCHED_LANGUAGES` gate, `pickLocalized` read path (in `src/domain/localizedContent.ts`)
- Locale files: `zh-Hant.ts`, `ja.ts`, `en.ts`, `th.ts`, `id.ts`, `ko.ts`, `vi.ts`, `my.ts` -- only `zh-Hant`, `ja`, `en` are launched

**Library Layer (`src/lib/`):**
- Purpose: External SDK integration wrappers
- Contains: `supabase.ts` (lazy Supabase client singleton), `speech.ts` (Web Speech API TTS)
- Depends on: `@supabase/supabase-js` (dynamic import)

## Data Flow

### Primary Practice Flow

1. User taps a drill preset in `HomePanel` or `LearningPanel` -- component calls `onStartDrill(preset)` callback
2. `App.tsx` calls `openChallenge(launchRequest)` which sets `appView = "challenge"` and passes `launch` as prop
3. `ChallengePanel` lazily loads (React.lazy), mounts `usePracticeSession` hook with the `launch` init
4. `usePracticeSession` calls domain compositors: `buildPracticeQuestions()` in `sessionPools.ts` which delegates to:
   - `buildQuestionPool()` (`practice.ts`) for basic conjugation drills
   - `buildClozeQuestionPool()` (`cloze.ts`) for fill-in-the-blank
   - `buildSentencePatternPool()` (`sentencePatterns.ts`) for sentence pattern drills
   - `buildExamQuestionPool()` (`examBlocks.ts`) for JLPT-style exam items
   - `composeDailySet()` (`sessionPools.ts`) for mixed daily practice
5. Question pool feeds into `DrillPanel` which renders `ExamPrompt` for each question
6. User submits answer -> `scoreAttempt()` (`practice.ts`) -> `recordAttempt()` callback -> `useProgressAttempts` stores locally + syncs to Supabase
7. SRS review queue derived from `getDueQuestions()` (`srs.ts`) computed from `progressAttempts`
8. Post-answer: `FeedbackPanel` shows correctness, explanation, and an optional link to `GrammarPointPage` via `hasGrammarPoint()` (`grammarPoints.ts`)

### State Management

- **App-level state:** `useState` in `App.tsx` -- `appView`, `grammarSurface`, `launch`, `targetLevel`
- **Attempt history:** Module-level singleton `attemptStore` (localStorage-backed) via `useProgressAttempts` hook; lifted to App shell so dashboards can read it without loading the challenge chunk
- **Language preference:** localStorage (`jabiko.lang`) with priority: URL `?lang=` > stored preference > browser language > `ja` fallback
- **Furigana/Theme/PWA:** Individual hooks with localStorage persistence
- **Session state:** `usePracticeSession` owns all in-flight practice state (current question, score, mistakes, mode config); resets on unmount

### i18n Data Flow

1. `src/domain/types.ts` owns `LOCALE_CODES` (canonical source of truth) and `LocaleCode` type
2. `src/i18n.ts` derives `Language` type (= `LocaleCode`), `Copy` type, `LAUNCHED_LANGUAGES`
3. UI chrome: `copy[language]` object selects the locale's Copy record
4. Content (domain data): `*Zh` fields (Chinese source) + `*I18n` overlays (per-locale). `pickLocalized(source, overlay, lang)` in `localizedContent.ts` is the single read path -- falls back to Chinese source when overlay is absent
5. Content overlays are generated by script (`vocabulary.i18n.ts`, `learningBlocks.i18n.ts`, etc.) and applied at module load

## Key Abstractions

**PracticeQuestion:**
- Purpose: Unified question model across all practice modes (basic conjugation, cloze, pattern, exam)
- Defined: `src/domain/types.ts`
- Contains: id, vocabulary (as VocabularyItem), targetForm, expectedAnswers, explanation, options, prompt fields, hint fields
- Generated by: `buildQuestionPool()` for basic drills, `buildClozeQuestionPool()` for cloze, `examQuestion()` factory (`src/domain/exam/helpers.ts`) for exam items

**Attempt:**
- Purpose: Immutable record of every answered question in practice session
- Defined: `src/domain/types.ts`
- Stored: localStorage (`jabiko:attempts`), synced to Supabase `attempts` table
- Used by: SRS review queue (`srs.ts`), progress stats (`stats.ts`), activity trend (`analytics/trend.ts`), weakness analysis (`analytics/weakness.ts`)
- Pattern: Array stored in `useProgressAttempts` hook, appended via `recordAttempt` callback

**SessionInit:**
- Purpose: Launch configuration that App passes to ChallengePanel to seed the practice session
- Defined: `src/hooks/usePracticeSession.ts` (re-exports `PracticeMode` from `practiceMode.ts`)
- Fields: mode, filter (patternIds / examSection), partOfSpeech, verbGroup, practiceFocus, targetForm, levelRange
- Pattern: Read once in `usePracticeSession` on mount; changing it requires re-mounting ChallengePanel

**i18n Overlay Pattern:**
- Purpose: Separate Chinese-authored content (`*Zh`) from per-locale translations (`*I18n`)
- Defined: `LocalizedText` type = `Partial<Record<LocaleCode, string>>`
- Key files: `localizedContent.ts` (`pickLocalized`, `pickLocalizedOptional`), `grammarNoteText.ts` (`localizeGrammarNote`)
- Pattern: Content modules declare source + overlay data; read path always goes through `pickLocalized`

**Content Guard:**
- Purpose: Runtime validation that exam bank integrity holds (unique IDs, options present, answer in options, hint/meaning separation)
- Defined: `src/domain/contentGuard.test.ts`
- Pattern: Vitest test file that reads actual `examStyleQuestions` array and asserts invariants
- Coverage: 250+ exam items, sentence pattern items, content stats drift detection

## Entry Points

**`src/main.tsx`:**
- Location: `src/main.tsx`
- Triggers: Browser navigation to any path on the SPA
- Responsibilities: Domain migration bridge (old origin -> new origin), then renders `<App />` into `#root`

**`src/App.tsx`:**
- Location: `src/App.tsx`
- Triggers: Mounted by `main.tsx`
- Responsibilities: URL-based view routing (home/learn/rules/kanji/challenge/mock/about/grammar), language/theme/furigana state ownership, auth wire-up, launch request bridging between panels

**`public/_redirects` / `public/_routes.json`:**
- Location: `public/_redirects`, `public/_routes.json`
- Purpose: SPA fallback (all paths -> index.html) for Cloudflare Pages hosting, plus Function routing configuration

## Lazy Loading Strategy (bundle code-split)

The codebase uses intentional lazy splitting to keep the initial bundle small:

| Chunk | What it contains | Loaded when |
|-------|-----------------|-------------|
| `index` (eager) | App shell, HomePanel, LearningPanel, RulesPanel, AboutPanel, hooks, i18n, light domain files | Always |
| `ChallengePanel` (lazy) | ChallengePanel, ModePicker, DrillPanel, usePracticeSession, all question pools (examBlocks, vocabulary, cloze, sentencePatterns), conjugation engine | User opens challenge view |
| `MockExamPanel` (lazy) | MockExamPanel, mock exam blueprints | User opens mock exam view |
| `KanjiOnyomiPanel` (lazy) | KanjiOnyomiPanel, kanjiOnyomi data (~74k lines) | User opens kanji view |
| `GrammarPointPage` (lazy) | GrammarPointPage, grammarPoints, grammarNotes, exam data | User opens /grammar/<surface> |
| `GrammarIndexPage` (lazy) | GrammarIndexPage, grammarIndex, grammarDatabase | User opens /grammar |
| `Supabase SDK` (dynamic import) | @supabase/supabase-js (~210KB raw) | User signs in |

The barrel file (`src/components/index.ts`) intentionally exports ONLY the 4 eager panels. All lazy components are imported directly from their module files in `App.tsx` to prevent them from being pulled into the initial bundle.

## Architectural Constraints

- **Threading:** Single-threaded (browser main thread). No Web Workers. SRS computation is synchronous (few hundred attempts = microseconds).
- **Global state:** `attemptStore` (module singleton in `useProgressAttempts.ts`), `createAttemptStore()` creates per-process instance backed by localStorage. Components share through the hook's return value, not via global import.
- **Circular imports:** `src/i18n.ts` imports `LocaleCode` from `src/domain/types.ts`; `src/domain/types.ts` is import-free. `src/i18n.ts` imports locale files which import `Copy` type from `src/i18n.ts` (type-only cycle, resolved by tsc). No runtime circular dependencies.
- **Content visibility:** `*Zh` fields must NOT render for non-`zh-Hant` languages without going through `pickLocalized()` with a valid i18n overlay. `formation` field treated same as `meaningZh`. `isZhHant` is the sole gate variable.
- **Package manager:** pnpm only. No npm/yarn/bun lockfiles.
- **Domain/UI separation:** `src/domain/` must never import from `src/components/`, `src/hooks/`, or any React module. Pure functions only.

## Anti-Patterns

### Lazy Component via Barrel Leak

**What happens:** If a lazy component (e.g., ChallengePanel) or its dependencies are re-exported from `src/components/index.ts`, the heavy question data gets pulled into the eager initial bundle because App imports the barrel.
**Why it's wrong:** Defeats code splitting. The entire exam bank (~47k lines of question data) loads on first visit instead of on-demand.
**Do this instead:** Import lazy components directly from their module files in `App.tsx` (e.g., `import("./components/ChallengePanel").then(...)`). Never add heavy components to the barrel.

### Business Logic in Components

**What happens:** Placing question-generating code, conjugation logic, or scoring in React components.
**Why it's wrong:** Makes logic untestable in isolation, couples UI to domain rules, prevents reuse across views.
**Do this instead:** Move all business logic to `src/domain/` as pure functions. Components call domain functions via hooks.

### Direct `*Zh` Field Rendering

**What happens:** Rendering `meaningZh`, `hintZh`, `instructionZh`, `lineZh`, or `contextZh` directly without going through `pickLocalized()` or without an `isZhHant` guard.
**Why it's wrong:** Chinese-authored content leaks to non-Chinese locales, showing untranslated text to learners.
**Do this instead:** Use `pickLocalized(source, overlay, language)` from `localizedContent.ts` for all `*Zh` fields. Gate any direct `*Zh` rendering with `language === "zh-Hant"`.

## Error Handling

**Strategy:** Fail explicitly with collected offender lists (not first-fail). Domain functions return sentinel values (`null`, `undefined`, empty arrays), never throw for expected conditions. Hooks catch async errors and set error state.

**Patterns:**
- `contentGuard.test.ts`: Collects ALL violating items, asserts on full list at once
- `attemptSync.ts`: merge on login failure leaves local store untouched (fetch + push both succeed before mutation)
- `supabase.ts`: Returns `null` gracefully when env vars are unset (no crash on unconfigured deploy)
- `originMigration.ts`: Catches parse errors, returns raw segment rather than throwing on malformed URLs

## Cross-Cutting Concerns

**Logging:** `console.warn` in dev mode for unconfigured Supabase. `console.error` in `speech.ts` for TTS failures. No structured logging framework.

**Validation:** `contentGuard.test.ts` enforces exam bank integrity at test time. `contentStats.test.ts` guards content count drift. TypeScript strict mode catches shape errors at compile time.

**Authentication:** Google OAuth via Supabase PKCE flow. `useAuth` hook calls `getSupabase()` (lazy SDK import). Auth state is optional -- the app works fully without login. Cross-device sync activates on login via `useProgressAttempts`.

**SEO:** Per-view `<title>`, `<meta description>`, `<meta og:*>`, `<link rel="canonical">` managed by `useSeoMeta` hook. Sitemap at `public/sitemap.xml`. `robots.txt` allows all crawlers. Grammar point pages get dynamic SEO metadata from their surface.

---

*Architecture analysis: 2026-07-07*
