import "@testing-library/jest-dom/vitest";

import { beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["zh-TW"]);
  // Keep shuffleQuestions deterministic in tests: 0.9999 makes Fisher-Yates a no-op.
  vi.spyOn(Math, "random").mockReturnValue(0.9999);
});
