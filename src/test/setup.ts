import "@testing-library/jest-dom/vitest";

import { beforeEach, vi } from "vitest";

// Pin the test-environment UI locale to zh-TW at module load, BEFORE any test
// file's beforeAll runs. jsdom defaults navigator.language to "en-US"; since
// useLanguage (#299) detects the initial locale from it when no preference is
// stored, an unpinned default would render the app in English and break every
// Chinese-label assertion (including priming renders that run in beforeAll,
// which fire before the beforeEach below). Re-applied per-test too so files
// that call vi.restoreAllMocks() don't drop it. Tests that exercise other
// locales override navigator.language locally (see useLanguage.test.ts).
function pinTestLocale() {
  vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["zh-TW"]);
  vi.spyOn(window.navigator, "language", "get").mockReturnValue("zh-TW");
}

pinTestLocale();

beforeEach(() => {
  pinTestLocale();
  // Keep shuffleQuestions deterministic in tests: 0.9999 makes Fisher-Yates a no-op.
  vi.spyOn(Math, "random").mockReturnValue(0.9999);
});
