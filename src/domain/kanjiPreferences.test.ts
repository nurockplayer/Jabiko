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
  it("restores a level chosen for the same default-level band", () => {
    writeKanjiLevel("N2", "N5");

    expect(readKanjiLevel("N2")).toBe("N5");
  });

  it("does not restore a level chosen for a different default-level band", () => {
    writeKanjiLevel("N2", "N5");

    expect(readKanjiLevel("N1")).toBeNull();
  });

  it.each(["N2", "N2|banana", "banana|N5", "N2|N5|extra"])(
    "rejects an invalid stored token: %s",
    (stored) => {
      window.localStorage.setItem(KANJI_LEVEL_KEY, stored);

      expect(readKanjiLevel("N2")).toBeNull();
    }
  );

  it("fails safely when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readKanjiLevel("N2")).toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => writeKanjiLevel("N2", "N5")).not.toThrow();
  });
});

describe("last-read kanji preference", () => {
  const currentBank = new Set(["校", "考"]);

  it("round-trips a current-bank kanji identifier", () => {
    writeLastReadKanji("校");

    expect(readLastReadKanji(currentBank)).toBe("校");
  });

  it("rejects a stale kanji that is absent from the current bank", () => {
    window.localStorage.setItem(KANJI_LAST_READ_KEY, "鬱");

    expect(readLastReadKanji(currentBank)).toBeNull();
  });

  it.each(["", "学校", "not-kanji"])("rejects an invalid identifier: %s", (stored) => {
    window.localStorage.setItem(KANJI_LAST_READ_KEY, stored);

    expect(readLastReadKanji(currentBank)).toBeNull();
  });

  it("does not write an invalid identifier", () => {
    writeLastReadKanji("学校");

    expect(window.localStorage.getItem(KANJI_LAST_READ_KEY)).toBeNull();
  });

  it("fails safely when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readLastReadKanji(currentBank)).toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => writeLastReadKanji("校")).not.toThrow();
  });
});
