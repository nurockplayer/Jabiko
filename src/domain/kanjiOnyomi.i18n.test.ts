import { describe, expect, it } from "vitest";
import { kanjiMeaning } from "./kanjiOnyomi.i18n";
import type { KanjiOnyomiEntry } from "./kanjiOnyomi";
import type { LocalizedText } from "./types";

const entry: KanjiOnyomiEntry = {
  kanji: "安",
  onyomi: ["あん"],
  kunyomi: ["やすい"],
  meaningZh: "便宜、安心",
  level: "N5"
};

describe("kanjiMeaning", () => {
  it("returns the localized gloss when an overlay exists for the kanji", () => {
    const overlays: Record<string, LocalizedText> = { 安: { en: "cheap; at ease", ja: "安い・安心" } };
    expect(kanjiMeaning(entry, "en", overlays)).toBe("cheap; at ease");
    expect(kanjiMeaning(entry, "ja", overlays)).toBe("安い・安心");
  });

  it("falls back to the zh source when there is no overlay / no entry for the locale", () => {
    expect(kanjiMeaning(entry, "en", {})).toBe("便宜、安心");
    expect(kanjiMeaning(entry, "en", { 安: { ja: "x" } })).toBe("便宜、安心");
    expect(kanjiMeaning(entry, "zh-Hant", { 安: { en: "cheap" } })).toBe("便宜、安心");
  });
});
