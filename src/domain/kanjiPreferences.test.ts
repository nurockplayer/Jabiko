import { afterEach, describe, expect, it, vi } from "vitest";
import {
  KANJI_LAST_READ_KEY,
  KANJI_LEVEL_KEY,
  readKanjiLevel,
  readLastReadKanji,
  writeKanjiLevel,
  writeLastReadKanji
} from "./kanjiPreferences";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("kanji level preference", () => {
  it("returns null before the learner has picked a level on the page", () => {
    expect(readKanjiLevel("N2")).toBeNull();
  });

  it("remembers a pick made under the same band default", () => {
    writeKanjiLevel("N2", "N5");
    expect(readKanjiLevel("N2")).toBe("N5");
  });

  // The page default follows the learner's target level (kanjiDefaultLevel).
  // A manual pick is scoped to the band it was made under, so changing the
  // target level moves the page to the NEW band instead of pinning the old
  // pick forever.
  it("drops the pick once the band default changes", () => {
    writeKanjiLevel("N2", "N5");
    expect(readKanjiLevel("N1")).toBeNull();
  });

  it("ignores a stored value that is not a level", () => {
    window.localStorage.setItem(KANJI_LEVEL_KEY, "N2|banana");
    expect(readKanjiLevel("N2")).toBeNull();
  });

  it("survives unreadable storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readKanjiLevel("N2")).toBeNull();
  });

  it("survives unwritable storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writeKanjiLevel("N2", "N5")).not.toThrow();
  });
});

describe("last-read kanji", () => {
  it("round-trips the last card the learner opened", () => {
    expect(readLastReadKanji()).toBeNull();
    writeLastReadKanji("校");
    expect(readLastReadKanji()).toBe("校");
  });

  it("keeps only the newest card", () => {
    writeLastReadKanji("校");
    writeLastReadKanji("考");
    expect(readLastReadKanji()).toBe("考");
  });

  it("ignores a stored value that is not a single character", () => {
    window.localStorage.setItem(KANJI_LAST_READ_KEY, "not a kanji");
    expect(readLastReadKanji()).toBeNull();
  });

  it("survives unreadable storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readLastReadKanji()).toBeNull();
  });
});
