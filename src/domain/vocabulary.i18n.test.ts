import { describe, expect, it } from "vitest";
import { vocabulary } from "./vocabulary";
import { jlptVocabulary } from "./vocabulary-jlpt";
import { clozeSentences } from "./cloze-data";
import { applyVocabularyI18n, vocabularyI18n } from "./vocabulary.i18n";
import type { VocabularyItem } from "./types";

// Han ideographs -- en glosses must be pure English (#427 pipeline rule).
const HAN = /[㐀-鿿]/;

describe("vocabulary i18n coverage (#427)", () => {
  it("every vocab item carries en+ja meaning overlays, and en has no Chinese", () => {
    for (const item of [...vocabulary, ...jlptVocabulary]) {
      expect(item.meaningI18n?.en, `${item.id}:en`).toBeTruthy();
      expect(item.meaningI18n?.ja, `${item.id}:ja`).toBeTruthy();
      expect(HAN.test(item.meaningI18n!.en!), `${item.id}: en gloss contains Han`).toBe(false);
    }
  });

  it("every authored example carries en+ja gloss overlays", () => {
    for (const item of vocabulary) {
      for (const example of item.examples) {
        expect(example.meaningI18n?.en, `${item.id}:example:en`).toBeTruthy();
        expect(example.meaningI18n?.ja, `${item.id}:example:ja`).toBeTruthy();
      }
    }
  });

  it("every cloze sentence carries en+ja translations", () => {
    expect(clozeSentences.length).toBeGreaterThan(0);
    for (const sentence of clozeSentences) {
      expect(sentence.translationI18n?.en, `${sentence.id}:en`).toBeTruthy();
      expect(sentence.translationI18n?.ja, `${sentence.id}:ja`).toBeTruthy();
    }
  });

  it("has no dangling overlay ids (every key maps to a real vocab item)", () => {
    const ids = new Set([...vocabulary, ...jlptVocabulary].map((item) => item.id));
    for (const id of Object.keys(vocabularyI18n)) {
      expect(ids.has(id), `dangling overlay id: ${id}`).toBe(true);
    }
  });

  it("applyVocabularyI18n attaches overlays without mutating the source items", () => {
    const source: VocabularyItem[] = [
      {
        id: "fake-id",
        surface: "試験",
        reading: "しけん",
        meaningZh: "考試",
        partOfSpeech: "noun",
        group: null,
        lesson: null,
        tags: [],
        examples: [{ japanese: "試験を受ける。", meaningZh: "參加考試。" }]
      }
    ];
    const overlays = {
      "fake-id": {
        meaning: { en: "exam", ja: "学力などを試すこと" },
        example: { en: "I take an exam.", ja: "試験にのぞむ。" }
      }
    };

    const [attached] = applyVocabularyI18n(source, overlays);
    expect(attached.meaningI18n?.en).toBe("exam");
    expect(attached.examples[0].meaningI18n?.ja).toBe("試験にのぞむ。");
    // The source objects stay untouched (module data is shared).
    expect(source[0].meaningI18n).toBeUndefined();
    expect(source[0].examples[0].meaningI18n).toBeUndefined();
  });
});
