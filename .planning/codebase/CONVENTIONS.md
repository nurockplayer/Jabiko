# Coding Conventions

**Analysis Date:** 2026-07-07

## Naming Patterns

**Files:**
- Domain modules: `lowerCamelCase.ts` (e.g., `grammarIndex.ts`, `sessionPools.ts`, `contentGuard.ts`)
- Components: `PascalCase.tsx` (e.g., `HomePanel.tsx`, `ExamPrompt.tsx`, `FeedbackForm.tsx`)
- Test files: co-located `*.test.ts` or `*.test.tsx` matching the source filename (e.g., `HomePanel.test.tsx`)
- i18n overlay modules: `camelCase.i18n.ts` (e.g., `vocabulary.i18n.ts`, `grammarDatabase.i18n.ts`)
- Type definition module: `types.ts` per directory (e.g., `src/domain/types.ts`, `src/components/types.ts`)

**Functions:**
- Exported functions: `lowerCamelCase` (e.g., `getPatternById`, `pickLocalized`, `computeProgressStats`)
- React component functions: `PascalCase` (e.g., `HomePanel`, `ExamPrompt`, `DrillPanel`)
- Internal/private helpers: `lowerCamelCase` (e.g., `readStored`, `isSupportedLanguage`)
- Factory/fixture helpers in tests: short names like `att()` or `word()`

**Variables:**
- Constants (module-level): `SCREAMING_SNAKE_CASE` (e.g., `SOURCE_LOCALE`, `CONTENT_LOCALES`, `BLANK_MARKER`, `SESSION_LENGTH_KEY`, `HOW_IT_WORKS_DISMISS_KEY`)
- Mutable/derived: `lowerCamelCase` (e.g., `examStyleQuestions`, `jlptVocabulary`)
- React state: `[thing, setThing]` convention

**Types:**
- Interfaces: `PascalCase` (e.g., `Attempt`, `PracticeQuestion`, `VocabNote`, `LocalizedText`)
- Type aliases: `PascalCase` (e.g., `JlpLevel`, `TargetForm`, `LocaleCode`, `PracticeMode`, `Language`)
- Props: inline anonymous object types in function parameters, not `interface Props` (e.g., `{ question: PracticeQuestion; language: Language }`)
- Error model: strings with descriptive messages (e.g., `"empty"`, `"unconfigured"`)

## Code Style

**Formatting:**
- No ESLint or Prettier configuration detected in the repository. Formatting is enforced by `tsc --noEmit` in the build step and `pnpm build` as the pre-commit hook (via `simple-git-hooks`).
- Semicolons: not used (confirmed by reading source files)
- Quote style: double quotes for JSX/string attributes, single quotes in TypeScript.

**Linting:**
- TypeScript strict mode (`"strict": true` in `tsconfig.json`) is the primary linting mechanism
- `forceConsistentCasingInFileNames` and `isolatedModules` enabled
- `tsc --noEmit` runs as part of `pnpm build` and the pre-commit hook
- `pnpm typecheck` available for standalone type checking

**TypeScript Strictness:**
- `strict: true` with all sub-checks enabled
- `noEmit: true` -- TypeScript is type-checking only, Vite handles code generation
- `allowJs: false` -- no JavaScript allowed in `src/`
- `skipLibCheck: true` -- skips type checking of `node_modules`
- `const` assertions (`as const`) used extensively for literal arrays (e.g., `LOCALE_CODES`, `CONTENT_LOCALES`, `SRS_INTERVAL_DAYS`)
- `satisfies` operator used for compile-time type verification (e.g., `SOURCE_LOCALE = "zh-Hant" satisfies LocaleCode`)
- Discriminated unions by `status` field (e.g., `Feedback` type in `src/components/types.ts`)
- `readonly` arrays for immutable lists (e.g., `SESSION_LENGTH_OPTIONS`, `QUESTION_TYPES`)

## Import Organization

**Order (observed pattern):**
1. React imports (`react`, `lucide-react`)
2. Domain/local module imports (types first with `import type`, then values)
3. Component imports (sibling components, then dashboard/challenge subdirectories)

**Example from `src/components/HomePanel.tsx`:**
```typescript
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, ... } from "lucide-react";
import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import type { LevelRange } from "../domain/levelRange";
import { isLearningBlockComplete, learningBlocks } from "../domain/learningBlocks";
import { AccuracyRing } from "./dashboard/AccuracyRing";
```

**Key conventions:**
- `import type` for type-only imports (TypeScript strict mode enforces this)
- Relative paths only -- no path aliases configured
- No barrel files (no `index.ts` re-exports observed)

## Error Handling

**Patterns:**

1. **Safe wrappers returning `null`** for non-critical failures:
   - `readStored(key)` returns `null` when storage is unavailable (wraps `localStorage` in try/catch)
   - `writeStored(key, value)` silently ignores failures
   - See `src/domain/safeStorage.ts`

2. **`null` returns for invalid input** (no throw):
   - `buildGrammarPoint(surface)` returns `null` for unknown surfaces (`src/domain/grammarPoints.ts`)
   - `levelFromQuestionId(questionId)` returns `null` for missing IDs (`src/domain/stats.ts`)
   - `getPatternById(id)` returns `undefined` for unknown IDs (`src/domain/grammarIndex.ts`)

3. **Explicit error throwing** for precondition violations:
   - `submitFeedback` throws `"empty"` for blank messages, `"unconfigured"` for null client (`src/domain/feedbackRemote.ts`)
   - `pushAttempts` / `fetchRemoteAttempts` propagate Supabase errors to callers (`src/domain/attemptRemote.ts`)

4. **`try/catch` in components** for non-critical side effects:
   - `src/App.tsx`, `src/components/HomePanel.tsx`, `src/components/FeedbackForm.tsx` -- wrap localStorage reads
   - `src/hooks/useAuth.ts` -- wraps Supabase auth calls
   - `src/components/challenge/ShareButtons.tsx` -- wraps clipboard API calls

5. **No global error boundary** -- errors are handled locally where they occur.

## Logging

**Framework:** None (no logger library). Errors are handled by callers, and console output is minimal.

## Comments

**When to Comment:**
- Module-level block comments explaining the "why" (not "what") for non-obvious design decisions
- JSDoc `/** ... */` on public domain functions (e.g., `getPatternById`, `pickLocalized`, `pickLocalizedOptional` in `src/domain/localizedContent.ts`)
- Section markers: `// --- test fixtures ---`, `// --- minimal typed fake SupabaseClient ---`
- Data structure comments explaining constraints (e.g., `VecabNote` in `src/domain/types.ts` line 77-91)
- Inline comments for non-obvious logic (e.g., "Keep the eager home bundle light" in `src/components/HomePanel.tsx`)

**JSDoc/TSDoc:**
- Used on exported domain functions: `@param`, `@link`, descriptions
- Used on interfaces in `src/domain/types.ts` for data contracts
- Not universally enforced -- many smaller helper functions lack JSDoc

**Language:** Comments in both Traditional Chinese (project domain language) and English.

## Function Design

**Size:** Functions are generally small and focused. The largest module, `practice.ts` (863 lines of test), has well-factored exported functions.

**Parameters:**
- Domain functions: multiple named parameters or a single config object
- React components: destructured single props object with inline type, e.g.:
  ```typescript
  export function ExamPrompt({ question, language }: { question: PracticeQuestion; language: Language }) {
  ```

**Return Values:**
- Prefer `null` over `undefined` for "not found" (e.g., `getPatternById` returns `undefined`, but `buildGrammarPoint` returns `null`)
- `void` for side-effect functions
- `Promise<T>` for async operations
- Union types for success/failure states (e.g., `Feedback` is a discriminated union on `status`)

## Module Design

**Exports:**
- Named exports dominant (`export function`, `export const`, `export type`)
- Only one default export found: `export default function App()` in `src/App.tsx`
- Re-exports for compatibility: `export type { PracticeMode }` in `src/hooks/usePracticeSession.ts`
- Type-only exports: `export type { FeedbackCategory }` 

**Barrel Files:** Not used. Each module imports directly from source files.

**Module boundaries:**
- `src/domain/` -- business logic, data, types (no React dependency)
- `src/components/` -- React UI (no business logic, per project invariant)
- `src/hooks/` -- React stateful logic bridging domain and UI
- `src/lib/` -- external service wrappers (e.g., Supabase, speech synthesis)
- `src/locales/` -- translation files (user-facing copy)
- `src/styles/` -- CSS
- `src/test/` -- test setup only

## Component Patterns

- Function components with hooks (no class components)
- Props destructured inline with type annotation
- `copy[language]` (or `const t = copy[language]`) for i18n strings
- `language` prop passed down from `App.tsx` (no context for language -- explicit prop drilling)
- Descriptive test assertions with Chinese description text (e.g., `it("renders a donate link to ECPay that opens safely in a new tab")`)
- Test helper factories (e.g., `renderHome(overrides)` in `src/components/HomePanel.test.tsx`)

## TypeScript Patterns

- `as const` for literal tuples and const objects
- `satisfies` for narrowing without widening
- `readonly` arrays for immutable data
- Discriminated unions for state machines (e.g., `Feedback` type)
- Generic `Partial<Record<...>>` for i18n overlays
- `Pick` and `Partial` utility types used where needed
- `function isX(value): value is X` type guards for runtime type narrowing

---

*Convention analysis: 2026-07-07*
