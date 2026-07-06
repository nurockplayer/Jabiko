# Testing Patterns

**Analysis Date:** 2026-07-07

## Test Framework

**Runner:**
- Vitest 4.0.15
- Config: inline in `vite.config.ts` (lines 66-70)

**Assertion Library:**
- Vitest's built-in `expect` (jest-compatible)
- `@testing-library/jest-dom` extended matchers (e.g., `toBeInTheDocument()`, `toBeDisabled()`, `toHaveAttribute()`, `toHaveBeenCalledWith()`)

**Environment:**
- jsdom 27.3.0 for DOM simulation
- `globals: true` in test config (no need to import `describe`/`it`/`expect`, though they are explicitly imported in most files)

**Run Commands:**
```bash
pnpm test                # Run all tests (vitest run)
pnpm test:watch          # Watch mode (vitest)
pnpm check:exam          # Focused content guard (vitest run src/domain/contentGuard.test.ts)
pnpm check:readings      # Script-based kanji reading validation
pnpm check:i18n          # Script-based i18n coverage check
```

## Test File Organization

**Location:**
- Co-located with source files in the same directory
- Test file naming: `{source-filename}.test.ts` or `{source-filename}.test.tsx`
- Test setup: `src/test/setup.ts` (global setup file)

**Test file count:** 58 test files across the project

**Structure:**
```
src/
├── test/
│   └── setup.ts              # Global test setup (jsdom, mocks, locale)
├── App.test.tsx               # Integration test for the root component
├── i18n.test.ts               # i18n contract guard
├── components/
│   ├── HomePanel.test.tsx
│   ├── ExamPrompt.test.tsx
│   ├── FeedbackForm.test.tsx
│   ├── FeedbackPanel.test.tsx
│   ├── ...
│   └── challenge/
│       ├── DrillPanel.test.tsx
│       └── SessionLengthPicker.test.tsx
├── domain/
│   ├── conjugation.test.ts
│   ├── contentGuard.test.ts
│   ├── grammarIndex.test.ts
│   ├── practice.test.ts
│   └── ...
├── hooks/
│   ├── useLanguage.test.ts
│   ├── usePracticeSession.test.ts
│   └── ...
└── lib/
    └── speech.test.ts
```

## Test Structure

**Suite Organization (observed pattern):**
```typescript
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("does something specific", () => {
    render(<MyComponent {...props} />);
    expect(screen.getByText("expected")).toBeInTheDocument();
  });
});
```

**Patterns:**
- `describe` blocks group by component/function name or feature
- `it` blocks have descriptive titles (English) describing the behavior
- Multiple describe blocks used for different facets of the same function
- Cases like "it" over "test" universally
- Tests are independent -- no shared mutable state between tests (cleaned via `beforeEach`/`afterEach`)
- Assertions with custom failure messages using Vitest's second argument: `expect(value, `message`).toEqual(...)`

**Setup/Teardown:**
```typescript
beforeEach(() => {
  localStorage.clear();
  pinTestLocale(); // from setup.ts
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
```

**Global Test Setup (`src/test/setup.ts`):**
- Imports `@testing-library/jest-dom/vitest` for DOM matchers
- Mocks `virtual:pwa-register` (PWA virtual module with no test implementation)
- Pins test locale to `zh-Hant` via `localStorage.setItem("jabiko.lang", "zh-Hant")` before each test
- Makes `Math.random()` deterministic (returns 0.9999) for stable shuffle behavior in tests

## Mocking

**Framework:** Vitest built-in (`vi`)

**Patterns (by complexity):**

1. **Simple function mock:**
```typescript
const onChoose = vi.fn();
render(<Component onChoose={onChoose} />);
// ... interact ...
expect(onChoose).toHaveBeenCalledWith("n4n5");
```

2. **Module mock (`vi.mock`):**
```typescript
vi.mock("../lib/supabase", () => ({
  getSupabase: () => getSupabase(),
  isSupabaseConfigured: true
}));
```

3. **Module mock preserving real exports:**
```typescript
vi.mock("../domain/attemptRemote", async () => {
  const real = await vi.importActual<typeof import("../domain/attemptRemote")>(
    "../domain/attemptRemote"
  );
  return { ...real, fetchRemoteAttempts: /* mock override */ };
});
```

4. **Component mock with hoisted capture:**
```typescript
const reportFormProps = vi.hoisted(() => ({ current: null as { selectedAnswer: string | null } | null }));
vi.mock("./QuestionReportForm", () => ({
  QuestionReportForm: (props) => {
    reportFormProps.current = props;
    return <div data-testid="report-form-stub" />;
  }
}));
```

5. **Spy on built-ins:**
```typescript
vi.spyOn(Math, "random").mockReturnValue(0.9999);
```

6. **Global stub:**
```typescript
vi.stubGlobal("location", { ...window.location, search: "?lang=ja" });
```

7. **Fake client (Supabase):**
```typescript
function fakeClient(insert: (row: unknown) => { error: unknown }) {
  return {
    from: (table: string) => {
      expect(table).toBe("feedback");
      return { insert: (row: unknown) => Promise.resolve(insert(row)) };
    }
  } as unknown as Parameters<typeof submitFeedback>[0];
}
```

**What to Mock:**
- External services (Supabase client, PWA virtual modules)
- `window.location`, `navigator.languages`
- `localStorage` via clearing/re-setting
- The `Math.random()` function for deterministic tests
- Callback functions passed as props

**What NOT to Mock:**
- Domain logic functions (tested with real data from the codebase)
- React components under test (rendered with real dependencies)
- i18n `copy` object (real copy used in component tests, gated by i18n.test.ts shape check)

## Fixtures and Factories

**Pattern -- factory functions with `Partial` overrides:**
```typescript
function att(over: Partial<Attempt> = {}): Attempt {
  return {
    vocabularyId: "v1",
    targetForm: "te",
    prompt: "p",
    expectedAnswers: ["x"],
    submittedAnswer: "x",
    isCorrect: true,
    timestamp: 1000,
    responseTimeMs: 100,
    ...over
  };
}
```

**Component test fixtures:**
```typescript
const sampleAttempt: Attempt = {
  vocabularyId: "seed",
  targetForm: "reading",
  prompt: "seed",
  expectedAnswers: ["seed"],
  submittedAnswer: "seed",
  isCorrect: true,
  timestamp: 1,
  responseTimeMs: 100
};
```

**Data-driven patterns:**
```typescript
const cases = [
  ["買う", "かう", "買", "買って", "買った"],
  ["待つ", "まつ", "等", "待って", "待った"],
  // ...
] as const;
for (const [surface, reading, meaningZh, te, ta] of cases) {
  // test each case
}
```

**Location:** Fixtures and factories are defined inline within test files, not in shared fixture files.

## Coverage

**Requirements:** No formal coverage threshold enforced. Coverage not measured in CI.

The project relies on content guards (`contentGuard.test.ts`) and contract tests (`i18n.test.ts`) as quality gates rather than coverage percentages.

## Test Types

**Unit Tests (domain logic):**
- Scope: Pure functions in `src/domain/` (e.g., `conjugate()`, `attemptKey()`, `initialLevelRange()`)
- No DOM, no React -- direct function calls with input/output assertions
- Snapshot tests: not used
- Example files: `src/domain/conjugation.test.ts` (312 lines), `src/domain/grammarIndex.test.ts` (337 lines), `src/domain/attemptSync.test.ts`

**Integration Tests (React components):**
- Scope: Components rendered with `render()` from `@testing-library/react`
- Use `screen`, `fireEvent`, `userEvent` for interaction
- Assert on DOM text, attributes, roles, and callback behavior
- Example files: `src/App.test.tsx` (1048 lines, the largest test file), `src/components/FeedbackPanel.test.tsx` (631 lines)

**Hook Tests:**
- Scope: React hooks tested with `renderHook()` and `act()` from `@testing-library/react`
- Example files: `src/hooks/usePracticeSession.test.ts`, `src/hooks/useLanguage.test.ts`, `src/hooks/useProgressAttempts.test.tsx`

**Content Guard Tests:**
- Scope: Validates exam/question bank data integrity (not behavior logic)
- Collective error reporting: each check collects ALL offenders and asserts on the full list
- Example: `src/domain/contentGuard.test.ts` (219 lines) checks:
  - Non-empty bank, unique IDs, options array validity
  - Expected answers present in options
  - JLPT level not leaked in promptLabel
  - hintZh doesn't contain meaningZh tokens (answer leak guard)
  - Kana-only options for reading questions
  - No duplicate options within an item
  - Non-empty explanations
  - vocabNote i18n completeness for launched locales
  - Shuffleable word-order prompts
  - No duplicate promptText across items

**E2E Tests:** Not used.

## Common Patterns

**Async Testing:**
```typescript
it("submits trimmed input and shows a thank-you", async () => {
  const submit = vi.fn().mockResolvedValue(undefined);
  render(<FeedbackForm language="zh-Hant" category="wish" onClose={() => {}} submit={submit} />);
  fireEvent.change(screen.getByPlaceholderText(/願/), { target: { value: "  想要夜間模式  " } });
  fireEvent.click(screen.getByRole("button", { name: /送出/ }));
  await waitFor(() => expect(screen.getByText(/謝謝/)).toBeInTheDocument());
});
```

**Error Testing:**
```typescript
it("throws 'empty' on a blank message without touching the client", async () => {
  const insert = vi.fn();
  const client = fakeClient(insert as never);
  await expect(submitFeedback(client, { category: "other", message: "   " })).rejects.toThrow("empty");
  expect(insert).not.toHaveBeenCalled();
});

it("propagates a Supabase error", async () => {
  const client = fakeClient(() => ({ error: new Error("relation does not exist") }));
  await expect(submitFeedback(client, { category: "bug", message: "x" })).rejects.toThrow("relation");
});
```

**Rendering with language:**
```typescript
render(<HomePanel language="zh-Hant" ... />);
// or
render(<HomePanel language="en" ... />);
// language prop is always passed explicitly
```

**Testing rendered HTML semantics:**
```typescript
it("marks the active nav tab with aria-current=page", async () => {
  // Assert on accessibility attributes
  expect(screen.getByRole("link", { name: "首頁" })).toHaveAttribute("aria-current", "page");
});

it("opens safely in a new tab", () => {
  const link = screen.getByRole("link", { name: /使用說明書/ });
  expect(link).toHaveAttribute("target", "_blank");
  expect(link.getAttribute("rel") ?? "").toContain("noopener");
});
```

**Simulating browser environment:**
```typescript
function setBrowserLanguages(languages: string[]) {
  Object.defineProperty(window.navigator, "languages", { configurable: true, get: () => languages });
  Object.defineProperty(window.navigator, "language", { configurable: true, get: () => languages[0] });
}

function resetBrowserLanguages() {
  Reflect.deleteProperty(window.navigator, "languages");
  Reflect.deleteProperty(window.navigator, "language");
}
```

## Test Running in CI

- Pre-commit hook: `pnpm build` (which includes `tsc --noEmit && vite build`)
- `pnpm test` runs as part of CI pipeline ("Test and build" job)
- `pnpm check:exam` is a focused gate for exam content quality

---

*Testing analysis: 2026-07-07*
