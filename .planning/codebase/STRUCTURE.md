# Codebase Structure

**Analysis Date:** 2026-07-07

## Directory Layout

```
Jabiko/
├── public/                    # Static assets, Cloudflare config, PWA manifest
│   ├── _headers               # Cloudflare Pages headers config
│   ├── _redirects             # SPA fallback (all paths -> index.html)
│   ├── _routes.json           # Cloudflare Functions routing
│   ├── sitemap.xml            # SEO sitemap
│   ├── robots.txt             # Allow all crawlers
│   ├── migration-bridge.html  # Old-domain migration bridge
│   ├── hero.webp              # Hero image
│   ├── og-image.png           # Open Graph share image
│   ├── icon.svg               # Favicon / PWA icon
│   ├── apple-touch-icon.png   # iOS home screen icon
│   ├── pwa-192x192.png        # PWA icon
│   ├── pwa-512x512.png        # PWA icon
│   └── pwa-maskable-512x512.png # PWA maskable icon
│
├── src/                       # Application source
│   ├── main.tsx               # Entry point: domain migration bridge, then render App
│   ├── App.tsx                # Root component: URL routing, state ownership, view switching
│   ├── App.test.tsx           # App integration tests
│   ├── styles.css             # CSS import manifest (@import all style modules)
│   ├── vite-env.d.ts          # Vite client type declarations
│   ├── illustrations.tsx      # SVG illustration components
│   │
│   ├── domain/                # Pure business logic, zero React imports
│   │   ├── types.ts           # All domain types: VocabularyItem, PracticeQuestion, Attempt, etc.
│   │   ├── conjugation.ts     # Verb/adjective conjugation engine (867 lines)
│   │   ├── conjugation.test.ts
│   │   ├── conjugationTables.ts    # Conjugation reference table data
│   │   ├── conjugationTables.i18n.ts # Per-locale conjugation table labels
│   │   ├── conjugationTables.i18n.test.ts
│   │   ├── practice.ts        # Question pool builder, scoring, distractor generation
│   │   ├── practice.test.ts
│   │   ├── practiceMode.ts    # PracticeMode type union, exam preset definitions
│   │   ├── sessionPools.ts    # Pool composers: daily sets, mode-specific question builders
│   │   ├── sessionPools.test.ts
│   │   ├── srs.ts             # Leitner spaced repetition algorithm
│   │   ├── srs.test.ts
│   │   ├── cloze.ts           # Cloze (fill-in-the-blank) question pool builder
│   │   ├── cloze-data.ts      # Cloze sentence data
│   │   ├── examBlocks.ts      # Exam question bank aggregator (imports all N1-N5 items)
│   │   ├── vocabulary.ts      # Core vocabulary table (~60 words, conjugation exemplars)
│   │   ├── vocabulary.i18n.ts # Per-locale vocabulary meaning overlays
│   │   ├── vocabulary.i18n.test.ts
│   │   ├── vocabulary-jlpt.ts # JLPT vocabulary table (N1/N2)
│   │   ├── vocabulary-jlpt.test.ts
│   │   ├── vocabulary.test.ts
│   │   ├── grammarDatabase.ts # Grammar pattern data (N5-N1, 1581 lines)
│   │   ├── grammarIndex.ts    # Grammar pattern query/filter/search functions
│   │   ├── grammarIndex.test.ts
│   │   ├── grammarPoints.ts   # Per-grammar-point aggregation (exam items + curated notes)
│   │   ├── grammarPoints.test.ts
│   │   ├── grammarNotes.ts     # Curated grammar reference notes
│   │   ├── grammarNotes.i18n.ts # Per-locale grammar note overlays
│   │   ├── grammarNotes.test.ts
│   │   ├── grammarNoteText.ts  # localizeGrammarNote() helper
│   │   ├── grammarNoteText.test.ts
│   │   ├── sentencePatterns.ts # Sentence pattern question bank
│   │   ├── sentencePatterns.i18n.ts # Per-locale pattern question overlays
│   │   ├── sentencePatterns.i18n.test.ts
│   │   ├── learningBlocks.ts  # Study chapter/block definitions
│   │   ├── learningBlocks.i18n.ts # Per-locale learning block text
│   │   ├── learningBlocks.test.ts
│   │   ├── learningBlockText.ts # localizeLearningBlock() helper
│   │   ├── learningBlockText.test.ts
│   │   ├── kanjiOnyomi.ts     # Kanji onyomi lookup data (73,702 line generated file)
│   │   ├── kanjiOnyomi.i18n.ts # Per-locale kanji labels
│   │   ├── kanjiOnyomi.i18n.test.ts
│   │   ├── kanjiOnyomi.test.ts
│   │   ├── furigana.ts        # Furigana ruby text generation
│   │   ├── furigana.test.ts
│   │   ├── furiganaData.ts    # Pre-generated furigana readings (1.46M lines)
│   │   ├── localizedContent.ts # pickLocalized() / pickLocalizedOptional() read-path
│   │   ├── localizedContent.test.ts
│   │   ├── patternMeaning.ts  # pickPatternMeaning() for grammar pattern meanings
│   │   ├── patternMeaning.test.ts
│   │   ├── readingConfusers.ts # Distractor reading generation for vocab drills
│   │   ├── readingConfusers.test.ts
│   │   ├── readingLookup.ts   # Reading lookup for exam feedback
│   │   ├── wordOrder.ts       # Word-order (語順組合) question logic
│   │   ├── wordOrder.test.ts
│   │   ├── mockExam.ts        # Mock exam section blueprints
│   │   ├── mockExam.test.ts
│   │   ├── storage.ts         # localStorage AttemptStore abstraction
│   │   ├── storage.test.ts
│   │   ├── safeStorage.ts     # localStorage wrapper with error isolation
│   │   ├── stats.ts           # Progress statistics computation
│   │   ├── stats.test.ts
│   │   ├── contentGuard.test.ts # Exam bank integrity validation gate
│   │   ├── contentStats.ts    # Hardcoded content volume counters
│   │   ├── contentStats.test.ts # Content count drift guard
│   │   ├── challengeDeepLink.ts # Deep-link query parser for /challenge?mode=&level=
│   │   ├── challengeDeepLink.test.ts
│   │   ├── seo.ts             # Per-view SEO metadata definitions
│   │   ├── seo.test.ts
│   │   ├── attemptRemote.ts   # Supabase attempt fetch/push logic
│   │   ├── attemptRemote.test.ts
│   │   ├── attemptSync.ts     # Login merge logic
│   │   ├── attemptSync.test.ts
│   │   ├── feedbackRemote.ts  # Supabase feedback submission
│   │   ├── feedbackRemote.test.ts
│   │   ├── questionReport.ts  # Question report submission
│   │   ├── questionReport.test.ts
│   │   ├── share.ts           # Share text generation
│   │   ├── share.test.ts
│   │   ├── levelPreference.ts # Target level preference read/write
│   │   ├── levelPreference.test.ts
│   │   ├── levelRange.ts      # Level range type and helpers
│   │   ├── levelRange.test.ts
│   │   ├── unattempted.ts     # Unattempted item prioritization
│   │   ├── unattempted.test.ts
│   │   ├── originMigration.ts # Old-domain migration bridge logic
│   │   ├── originMigration.test.ts
│   │   ├── analytics/         # Analytics computation sub-module
│   │   │   ├── questionType.ts    # Question type classifier
│   │   │   ├── questionType.test.ts
│   │   │   ├── trend.ts           # Activity trend computation
│   │   │   ├── trend.test.ts
│   │   │   ├── weakness.ts        # Weakness-by-type computation
│   │   │   └── weakness.test.ts
│   │   └── exam/              # Exam question sub-module
│   │       ├── types.ts       # ExamQuestionInput type
│   │       ├── helpers.ts     # examQuestion() factory
│   │       ├── helpers.test.ts
│   │       └── items/         # Per-level exam question data
│   │           ├── n1.ts      # N1 items (~2.37M / 13,494 lines)
│   │           ├── n2.ts      # N2 items (~1.75M / 10,885 lines)
│   │           ├── n3.ts      # N3 items (~1.18M / 8,000 lines)
│   │           ├── n4.ts      # N4 items (~773K / 4,865 lines)
│   │           └── n5.ts      # N5 items (~532K / 3,842 lines)
│   │
│   ├── components/            # React UI components (presentational, no business logic)
│   │   ├── index.ts           # Barrel: ONLY exports HomePanel, LearningPanel, RulesPanel, AboutPanel
│   │   ├── types.ts           # Shared component types (Feedback)
│   │   ├── furiganaContext.ts # React context for furigana toggle
│   │   ├── HomePanel.tsx      # Dashboard: stats, trends, content cards, level picker
│   │   ├── HomePanel.test.tsx
│   │   ├── LearningPanel.tsx  # Study roadmap: chapter cards, drill presets
│   │   ├── RulesPanel.tsx     # Conjugation reference tables
│   │   ├── AboutPanel.tsx     # About page
│   │   ├── ChallengePanel.tsx # Practice workspace: wires usePracticeSession to sub-components
│   │   ├── MockExamPanel.tsx  # JLPT section picker for targeted exam practice
│   │   ├── KanjiOnyomiPanel.tsx # Kanji lookup by onyomi reading
│   │   ├── KanjiOnyomiPanel.test.tsx
│   │   ├── GrammarIndexPage.tsx # Grammar database overview with search/filter
│   │   ├── GrammarPointPage.tsx # Per-grammar-point study page
│   │   ├── GrammarPointPage.test.tsx
│   │   ├── GrammarNoteCard.tsx # Curated grammar note display card
│   │   ├── LanguagePicker.tsx # Modal language selector
│   │   ├── LanguagePicker.test.tsx
│   │   ├── LanguageFlag.tsx   # Country flag emoji per locale
│   │   ├── ExamPrompt.tsx     # Exam-style question rendering (prompt, options, input)
│   │   ├── ExamPrompt.test.tsx
│   │   ├── FeedbackPanel.tsx  # Post-answer feedback: correctness, explanation, grammar link
│   │   ├── FeedbackPanel.test.tsx
│   │   ├── FeedbackForm.tsx   # Global feedback/suggestion submission form
│   │   ├── FeedbackForm.test.tsx
│   │   ├── QuestionReportForm.tsx # Per-question issue report form
│   │   ├── QuestionReportForm.test.tsx
│   │   ├── Ruby.tsx           # Furigana ruby text renderer
│   │   ├── Ruby.test.tsx
│   │   ├── JabikoMark.tsx     # Brand mark SVG component
│   │   ├── JabikoMark.test.tsx
│   │   ├── SpeakButton.tsx    # TTS (Web Speech API) button
│   │   ├── UpdateToast.tsx    # PWA update notification toast
│   │   ├── UpdateToast.test.tsx
│   │   ├── challenge/         # In-challenge sub-components
│   │   │   ├── ModePicker.tsx     # Mode/settings sidebar
│   │   │   ├── DrillPanel.tsx     # Active question display + answer cycle
│   │   │   ├── DrillPanel.test.tsx
│   │   │   ├── ScoreReport.tsx    # Session score display
│   │   │   ├── ReviewList.tsx     # Mistake review list
│   │   │   ├── SessionLengthPicker.tsx # Session length control
│   │   │   ├── SessionLengthPicker.test.tsx
│   │   │   └── ShareButtons.tsx   # Share session results
│   │   └── dashboard/         # Home dashboard sub-components
│   │       ├── AccuracyRing.tsx   # Circular accuracy display
│   │       ├── ActivityTrend.tsx  # Two-week activity bar chart
│   │       ├── LevelBars.tsx      # Per-JLPT-level answer distribution
│   │       └── TypeBars.tsx       # Per-question-type weakness bars
│   │
│   ├── hooks/                 # React hooks (state + side-effect wrappers)
│   │   ├── usePracticeSession.ts  # Practice engine hook (largest, ~21k)
│   │   ├── usePracticeSession.test.ts
│   │   ├── useProgressAttempts.ts # Attempt history + cross-device sync
│   │   ├── useProgressAttempts.test.tsx
│   │   ├── useLanguage.ts     # UI language selection + persistence
│   │   ├── useLanguage.test.ts
│   │   ├── useAuth.ts         # Google OAuth via Supabase
│   │   ├── useSeoMeta.ts      # Document head meta tag management
│   │   ├── useSeoMeta.test.tsx
│   │   ├── useFurigana.ts     # Furigana toggle + persistence
│   │   ├── useFurigana.test.tsx
│   │   ├── useTheme.ts        # Dark/light theme toggle
│   │   ├── usePwaUpdate.ts    # Service worker update detection
│   │   ├── useOriginMigration.ts # Old-domain migration hook
│   │   └── useOriginMigration.test.tsx
│   │
│   ├── locales/               # UI chrome translation files
│   │   ├── zh-Hant.ts         # Traditional Chinese (source locale, ~21k)
│   │   ├── ja.ts              # Japanese (~25k)
│   │   ├── en.ts              # English (~23k)
│   │   ├── th.ts              # Thai (~41k)
│   │   ├── id.ts              # Indonesian (~25k)
│   │   ├── ko.ts              # Korean (~26k)
│   │   ├── vi.ts              # Vietnamese (~28k)
│   │   └── my.ts              # Burmese (~50k)
│   │
│   ├── i18n.ts                # Copy type, LAUNCHED_LANGUAGES, copy record assembler
│   ├── i18n.test.ts           # i18n integrity tests
│   ├── lib/                   # External library wrappers
│   │   ├── supabase.ts        # Lazy Supabase client singleton
│   │   ├── speech.ts          # Web Speech API TTS wrapper
│   │   └── speech.test.ts
│   ├── styles/                # Per-view CSS modules
│   │   ├── base.css           # CSS reset, variables, typography
│   │   ├── layout.css         # App shell layout, header, nav
│   │   ├── home.css           # Home dashboard styles
│   │   ├── learning.css       # Learning roadmap styles
│   │   ├── rules.css          # Conjugation tables styles
│   │   ├── challenge.css      # Practice workspace styles
│   │   ├── grammar.css        # Grammar index/point page styles
│   │   ├── kanji.css          # Kanji lookup table styles
│   │   ├── mock.css           # Mock exam picker styles
│   │   ├── feedback.css       # Feedback panel/form styles
│   │   ├── about.css          # About page styles
│   │   ├── language-picker.css # Language picker modal styles
│   │   ├── review.css         # Review list styles
│   │   └── responsive.css     # Responsive breakpoints
│   └── test/                  # Test infrastructure
│       └── setup.ts           # Vitest setup (jsdom, mocks)
│
├── supabase/                  # Supabase infrastructure
│   └── migrations/            # Database migration files
│
├── functions/                 # Cloudflare Functions (edge workers)
│
├── scripts/                   # Build/data scripts (exam importer, furigana generator)
│   └── exam-batches/          # JSON input batches for exam importer
│
├── docs/                      # Documentation
│   └── item-quality-rubric.md # Exam item quality standards
│
├── assets/                    # Additional static assets
│
├── memory/                    # Project memory (last-report, architecture docs)
│
├── .github/workflows/         # CI: Test and build
├── .claude/                   # Claude Code configuration
│   └── worktrees/             # Git worktree isolation
├── .planning/                 # Planning artifacts (this document's target)
│   └── codebase/
│
├── index.html                 # Vite HTML entry point
├── vite.config.ts             # Vite + React + PWA plugin config
├── vitest.config.ts           # Vitest configuration (if separate)
├── tsconfig.json              # TypeScript strict mode config
├── tsconfig.app.json          # App-specific TS config
├── tsconfig.node.json         # Node/build TS config
├── package.json               # Dependencies and scripts
├── pnpm-lock.yaml             # pnpm lockfile
├── wrangler.toml              # Cloudflare Wrangler config
└── CLAUDE.md                  # Project instructions for AI coding agents
```

## Directory Purposes

**`src/domain/`:**
- Purpose: All business logic and data in pure TypeScript. Never imports React. The canonical source of truth for types, algorithms, and content.
- Contains: Types (`types.ts`), conjugation engine (`conjugation.ts`), question pool builders (`practice.ts`, `sessionPools.ts`, `cloze.ts`), SRS algorithm (`srs.ts`), vocabulary tables (`vocabulary.ts`, `vocabulary-jlpt.ts`), grammar database (`grammarDatabase.ts`, `grammarIndex.ts`), exam item data (`exam/items/*.ts`), analytics (`analytics/`), storage abstraction (`storage.ts`, `safeStorage.ts`), content validation (`contentGuard.test.ts`), i18n overlay helpers (`localizedContent.ts`, `grammarNoteText.ts`, `patternMeaning.ts`)
- Key files: `types.ts` (all type contracts), `practice.ts` (question generation), `sessionPools.ts` (pool composition), `conjugation.ts` (core engine), `examBlocks.ts` (exam bank aggregator)
- Test pattern: Co-located `*.test.ts` files for every module

**`src/components/`:**
- Purpose: React UI rendering. Pure presentation, no business logic. Imports domain types and hooks, but domain functions are called in hooks, not components.
- Contains: View panels (HomePanel, LearningPanel, RulesPanel, ChallengePanel, MockExamPanel, KanjiOnyomiPanel, AboutPanel, GrammarIndexPage, GrammarPointPage), practice sub-components (challenge/ directory), shared UI primitives (Ruby, SpeakButton, JabikoMark, LanguageFlag), forms (FeedbackForm, QuestionReportForm, FeedbackPanel), dashboard widgets (dashboard/ directory)
- Key files: `index.ts` (barrel, intentionally minimal), `ChallengePanel.tsx` (practice workspace assembly), `ExamPrompt.tsx` (question rendering), `FeedbackPanel.tsx` (post-answer feedback)
- Test pattern: Co-located `*.test.tsx` files

**`src/hooks/`:**
- Purpose: React state management layer. Wraps domain functions into component-usable hooks with state, effects, and side-effects (localStorage, Supabase, DOM).
- Contains: `usePracticeSession.ts` (largest, ~21k lines, practice engine), `useProgressAttempts.ts` (attempt history + cross-device sync), `useLanguage.ts` (UI locale), `useAuth.ts` (Google OAuth), `useSeoMeta.ts` (document head meta), `useFurigana.ts`, `useTheme.ts`, `usePwaUpdate.ts`, `useOriginMigration.ts`
- Key files: `usePracticeSession.ts` (session lifecycle), `useProgressAttempts.ts` (persistent data ownership)
- Test pattern: Co-located `*.test.ts` or `*.test.tsx` files

**`src/i18n.ts` + `src/locales/`:**
- Purpose: UI chrome internationalization. Separates UI copy from content translation (which uses domain-layer overlay pattern).
- Contains: `Copy` type (~350 keys), `LAUNCHED_LANGUAGES` array, `copy` record assembling 8 locale files
- Locale files per language: Each exports a `Copy` object satisfying the type
- Key files: `i18n.ts` (type + assembler), `zh-Hant.ts` (source locale)

**`src/lib/`:**
- Purpose: External SDK integration wrappers. Keeps SDK imports lazy and isolated.
- Contains: `supabase.ts` (lazy Supabase client), `speech.ts` (Web Speech API)
- Key files: `supabase.ts` (dynamic import pattern keeps ~55KB gzip out of initial bundle)

**`src/styles/`:**
- Purpose: Plain CSS organized by view/module. All imported via `src/styles.css`.
- Contains: 14 CSS files covering each view and shared patterns
- Key files: `base.css` (design tokens, reset), `layout.css` (shell layout), `home.css` (largest at ~22k)

**`src/test/`:**
- Purpose: Test infrastructure (setup, mocks)
- Contains: `setup.ts` (Vitest jsdom setup)

**`public/`:**
- Purpose: Static assets served at root. Cloudflare Pages configuration, PWA icons, SEO assets.
- Contains: `_headers`, `_redirects`, `_routes.json`, `sitemap.xml`, `robots.txt`, icons, images
- Key files: `_redirects` (SPA fallback), `_routes.json` (Functions routing)

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Browser entry point (domain migration bridge, then render App)
- `src/App.tsx`: Application root (URL routing, state ownership, view switching)
- `index.html`: Vite HTML shell (contains `<div id="root">`)

**Configuration:**
- `vite.config.ts`: Vite build config (React plugin, PWA plugin, code splitting)
- `tsconfig.json`: TypeScript strict mode configuration
- `package.json`: Dependencies, scripts (build/test/lint/check:exam)
- `wrangler.toml`: Cloudflare Pages deployment config
- `CLAUDE.md`: AI agent instructions

**Core Logic (domain):**
- `src/domain/types.ts`: All domain type contracts (`VocabularyItem`, `PracticeQuestion`, `Attempt`, `LocaleCode`, etc.)
- `src/domain/conjugation.ts`: Verb/adjective conjugation engine (867 lines, the algorithmic core)
- `src/domain/practice.ts`: Question pool builder, scoring, distractor generation
- `src/domain/sessionPools.ts`: Daily set composer, mode-specific pool builders
- `src/domain/srs.ts`: Leitner spaced repetition algorithm
- `src/domain/cloze.ts`: Fill-in-the-blank question pool builder
- `src/domain/examBlocks.ts`: Exam question bank aggregator (imports all per-level item files)
- `src/domain/grammarDatabase.ts`: Grammar pattern data (~1,581 lines)
- `src/domain/grammarIndex.ts`: Grammar pattern query/search/filter functions
- `src/domain/grammarPoints.ts`: Per-grammar-point aggregation (exam items + curated notes)
- `src/domain/sentencePatterns.ts`: Sentence pattern question bank
- `src/domain/localizedContent.ts`: `pickLocalized()` -- the single content i18n read path

**Core Logic (data):**
- `src/domain/vocabulary.ts`: Core vocabulary table (~60 words for conjugation drills)
- `src/domain/vocabulary-jlpt.ts`: JLPT vocabulary table (N1/N2, used for vocab reading drills)
- `src/domain/kanjiOnyomi.ts`: Kanji onyomi lookup data (73,702 line generated file)
- `src/domain/furiganaData.ts`: Pre-generated furigana readings (1.46M characters)
- `src/domain/exam/items/n1.ts` through `n5.ts`: JLPT exam question data (~47k lines total)
- `src/domain/contentGuard.test.ts`: Exam bank integrity validation gate
- `src/domain/contentStats.ts`: Hardcoded content volume counters

**Testing:**
- `src/test/setup.ts`: Vitest + jsdom configuration
- `src/domain/contentGuard.test.ts`: Exam content quality validation (run via `pnpm check:exam`)
- `src/domain/contentStats.test.ts`: Content count drift detection
- Test files co-located with source: `src/domain/*.test.ts`, `src/components/*.test.tsx`, `src/hooks/*.test.ts`

## Naming Conventions

**Files:**
- Domain modules: `camelCase.ts` (e.g., `vocabulary.ts`, `sessionPools.ts`, `grammarDatabase.ts`)
- React components: `PascalCase.tsx` (e.g., `HomePanel.tsx`, `ExamPrompt.tsx`)
- Hooks: `usePascalCase.ts` (e.g., `usePracticeSession.ts`, `useLanguage.ts`)
- Test files: `*.test.ts` or `*.test.tsx`, co-located with source
- i18n overlay files: `*.i18n.ts` (e.g., `vocabulary.i18n.ts`, `learningBlocks.i18n.ts`)
- Locale files: BCP-47 language code as filename (e.g., `zh-Hant.ts`, `en.ts`)
- CSS files: `kebab-case.css`, matches source file name (e.g., `home.css`, `language-picker.css`)
- Barrel file: `index.ts` / `index.tsx`

**Directories:**
- All directories: `camelCase` (e.g., `components/challenge/`, `domain/exam/items/`)
- Exception: `.github/`, `.claude/`, `.planning/` (dot-prefixed config dirs)

**Exports:**
- Domain files: Named exports only (no default exports in `src/domain/`)
- Components: Named exports only (e.g., `export function HomePanel(...)`)
- Exception: `App.tsx` uses `export default function App()` (Vite entry convention)

**Interfaces/Types:**
- Domain types: `PascalCase` interfaces and type aliases (e.g., `PracticeQuestion`, `VocabularyItem`, `GrammarPattern`)
- Props: Inline type in function parameter destructuring (e.g., `{ language, onExit }: { language: Language; onExit: () => void }`)

**Variables:**
- Domain-level data arrays: `camelCase` (e.g., `grammarPatterns`, `jlptVocabulary`, `examStyleQuestions`)
- Constants: `UPPER_SNAKE_CASE` for true constants (e.g., `SOURCE_LOCALE`, `CONTENT_LOCALES`, `LAUNCHED_LANGUAGES`, `DEFAULT_SESSION_LENGTH`)
- Storage keys: `"jabiko.something"` (e.g., `"jabiko:attempts"`, `"jabiko.lang"`, `"jabiko.sessionLength"`)

## Where to Add New Code

**New exam question type:**
- Add question data: `src/domain/exam/items/<level>.ts` (append to existing per-level arrays)
- Update factory if needed: `src/domain/exam/helpers.ts`
- Update content stats: `src/domain/contentStats.ts` (increment counters)
- Validate: `src/domain/contentGuard.test.ts` (add guard assertions if new invariants)
- Run: `pnpm check:exam && pnpm test && pnpm build`

**New practice mode:**
- Add mode to `PracticeMode` union: `src/domain/practiceMode.ts`
- Add pool builder: `src/domain/sessionPools.ts` (new exported function)
- Add mode copy keys: `src/i18n.ts` (`Copy` type + all locale files)
- Add mode picker entry: `src/components/challenge/ModePicker.tsx`
- Tests: `src/domain/sessionPools.test.ts`

**New domain type or data model:**
- Add types: `src/domain/types.ts` (for cross-domain types) or new file in `src/domain/`
- Add i18n overlays: `src/domain/<name>.i18n.ts` following overlay pattern
- Tests: co-located `src/domain/<name>.test.ts`

**New React component:**
- Simple shared component: `src/components/<ComponentName>.tsx`
- View panel: `src/components/<ViewName>Panel.tsx` (add to lazy loading in `App.tsx`)
- In-challenge sub-component: `src/components/challenge/<ComponentName>.tsx`
- Dashboard widget: `src/components/dashboard/<ComponentName>.tsx`
- Tests: co-located `*.test.tsx`
- Barrel export: Only add to `src/components/index.ts` if the component is eager-loaded (appears on home/learn/rules/about views)
- CSS: `src/styles/<view-name>.css`, then add `@import` to `src/styles.css`

**New hook:**
- Implementation: `src/hooks/use<HookName>.ts`
- Tests: `src/hooks/use<HookName>.test.ts`

**New UI locale:**
- Add locale code: `src/domain/types.ts` (`LOCALE_CODES` array)
- Add locale file: `src/locales/<code>.ts` implementing `Copy` type
- Import and register: `src/i18n.ts` (import + add to `copy` record)
- Add to launched list: `src/i18n.ts` (`LAUNCHED_LANGUAGES`) when content is ready
- Add content overlays: Update all `*.i18n.ts` files with translations

## Special Directories

**`src/domain/exam/items/`:**
- Purpose: Per-JLPT-level exam question data. Large generated files.
- Generated: Yes (via `scripts/import-exam-items.mjs` from JSON batch files)
- Committed: Yes (version-controlled source of truth)
- Note: `-text` in `.gitattributes` (CRLF handling for git diff)

**`dist/`:**
- Purpose: Vite build output
- Generated: Yes (`pnpm build`)
- Committed: No (`.gitignore`)

**`node_modules/`:**
- Purpose: Package dependencies
- Generated: Yes (`pnpm install`)
- Committed: No

**`scripts/exam-batches/`:**
- Purpose: JSON input files for exam content importer
- Generated: Yes (by exam content loop)
- Committed: Yes (audit trail for content provenance)

**`memory/`:**
- Purpose: Project memory files (last-report, architecture documentation snapshots)
- Generated: By AI agents
- Committed: Yes

**`.claude/worktrees/`:**
- Purpose: Git worktree isolation for AI agent tasks
- Generated: By AI agents
- Committed: No (`.gitignore`)

---

*Structure analysis: 2026-07-07*
