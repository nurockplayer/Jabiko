import "@testing-library/jest-dom/vitest";

import { beforeEach, vi } from "vitest";

// Pin the test-environment UI locale to zh-Hant at module load. Since the
// default is now ja (no navigator detection), we pre-store zh-Hant so the
// Chinese-label assertions in App.test.tsx and elsewhere still work without
// rewriting every test. Tests that exercise other locales override this
// via their own mock (see useLanguage.test.ts).
function pinTestLocale() {
  localStorage.setItem("jabiko.lang", "zh-Hant");
}

pinTestLocale();

beforeEach(() => {
  pinTestLocale();
  // Keep shuffleQuestions deterministic in tests: 0.9999 makes Fisher-Yates a no-op.
  vi.spyOn(Math, "random").mockReturnValue(0.9999);
});
