import { describe, expect, it } from "vitest";
import { STARTER_CATEGORIES, starterVocabulary } from "./starterVocabulary";

describe("starterVocabulary integrity (#533 starter deck)", () => {
  it("holds a meaningful deck: 90+ words across the 8 starter categories", () => {
    expect(starterVocabulary.length).toBeGreaterThanOrEqual(90);
    for (const category of STARTER_CATEGORIES) {
      const inCategory = starterVocabulary.filter((word) => word.tags.includes(category));
      expect(inCategory.length, category).toBeGreaterThanOrEqual(8);
    }
  });

  it("every word is starter-shaped: kana-only surface, N5, tagged starter", () => {
    for (const word of starterVocabulary) {
      // Surface is pure kana (+ー) -- the deck sits right after the kana
      // chapters, before any kanji instruction.
      expect(word.surface, word.id).toMatch(/^[ぁ-んァ-ヶー]+$/);
      expect(word.reading, word.id).toBe(word.surface);
      expect(word.level, word.id).toBe("N5");
      expect(word.tags, word.id).toContain("starter");
      expect(STARTER_CATEGORIES.some((category) => word.tags.includes(category)), word.id).toBe(
        true
      );
    }
  });

  it("ids and surfaces are unique; meanings are pairwise distinct (unique-solution guard)", () => {
    const ids = starterVocabulary.map((word) => word.id);
    expect(new Set(ids).size).toBe(ids.length);
    const surfaces = starterVocabulary.map((word) => word.surface);
    expect(new Set(surfaces).size).toBe(surfaces.length);
    // The meaning drill draws its distractors from this same deck, so two
    // words sharing an identical meaning string would be a double solution.
    const meanings = starterVocabulary.map((word) => word.meaningZh);
    expect(new Set(meanings).size).toBe(meanings.length);
  });

  it("every word carries en+ja meaning overlays (data-ready for i18n) and no empty fields", () => {
    for (const word of starterVocabulary) {
      expect(word.meaningZh.trim(), word.id).not.toHaveLength(0);
      expect(word.meaningI18n?.en?.trim(), word.id).toBeTruthy();
      expect(word.meaningI18n?.ja?.trim(), word.id).toBeTruthy();
    }
  });

  it("ids are stable ASCII (SRS/mistake-pool keys)", () => {
    for (const word of starterVocabulary) {
      expect(word.id, word.id).toMatch(/^starter-[a-z0-9-]+$/);
    }
  });
});
