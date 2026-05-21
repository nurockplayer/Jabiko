import "@testing-library/jest-dom/vitest";

import { beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["zh-TW"]);
});
