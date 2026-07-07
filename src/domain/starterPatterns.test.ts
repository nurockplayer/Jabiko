import { describe, expect, it } from "vitest";
import { buildSentencePatternPool } from "./sentencePatterns";
import { sentencePatternI18n } from "./sentencePatterns.i18n";
import { isLearningBlockComplete, learningBlocks } from "./learningBlocks";

// The two Lesson-0 grammar drills (#534 batch 1): 基本句 AはBです and
// 助詞入門 は・を・に・が. Their items must stay at the absolute-beginner
// floor -- every sentence composable by a learner who knows kana + the
// 97-word starter deck, no kanji anywhere.
const desu = buildSentencePatternPool({ patternIds: ["starter-desu"] });
const particles = buildSentencePatternPool({ patternIds: ["starter-particles"] });

describe("starter sentence patterns (#534)", () => {
  it("each drill carries 8 items with stable prefixed ids", () => {
    expect(desu).toHaveLength(8);
    expect(particles).toHaveLength(8);
    for (const q of desu) expect(q.id).toMatch(/^pattern-starter-desu-\d+$/);
    for (const q of particles) expect(q.id).toMatch(/^pattern-starter-particles-\d+$/);
  });

  it("every item is 4 distinct options with exactly one expected answer", () => {
    for (const q of [...desu, ...particles]) {
      expect(q.options, q.id).toHaveLength(4);
      expect(new Set(q.options).size, q.id).toBe(4);
      const hits = q.options!.filter((option) => q.expectedAnswers.includes(option));
      expect(hits, q.id).toHaveLength(1);
    }
  });

  it("prompts and options are kanji-free (the Lesson-0 floor: kana only)", () => {
    for (const q of [...desu, ...particles]) {
      expect(q.promptText, q.id).not.toMatch(/[一-鿿]/);
      for (const option of q.options!) {
        expect(option, q.id).not.toMatch(/[一-鿿]/);
      }
    }
  });

  it("hints never leak the expected answer", () => {
    for (const q of [...desu, ...particles]) {
      expect(q.hintZh ?? "", q.id).not.toContain(q.expectedAnswers[0]);
    }
  });

  it("every item carries full ja+en overlays (launched-locale rule)", () => {
    for (const q of [...desu, ...particles]) {
      const overlay = sentencePatternI18n[q.id];
      expect(overlay?.hintI18n?.ja, q.id).toBeTruthy();
      expect(overlay?.hintI18n?.en, q.id).toBeTruthy();
      expect(overlay?.promptContextI18n?.ja, q.id).toBeTruthy();
      expect(overlay?.promptContextI18n?.en, q.id).toBeTruthy();
      expect(overlay?.explanationI18n?.ja, q.id).toBeTruthy();
      expect(overlay?.explanationI18n?.en, q.id).toBeTruthy();
    }
  });
});

describe("N5 grammar patterns (#543: sonzai + ichi / #544: joshi2 + joshi3)", () => {
  const sonzai = buildSentencePatternPool({ patternIds: ["n5-sonzai"] });
  const ichi = buildSentencePatternPool({ patternIds: ["n5-ichi"] });
  const joshi2 = buildSentencePatternPool({ patternIds: ["n5-joshi2"] });
  const joshi3 = buildSentencePatternPool({ patternIds: ["n5-joshi3"] });
  const hikaku = buildSentencePatternPool({ patternIds: ["n5-hikaku"] });
  const sukiDekiru = buildSentencePatternPool({ patternIds: ["n5-suki-dekiru"] });
  const sasoi = buildSentencePatternPool({ patternIds: ["n5-sasoi"] });
  const onegai = buildSentencePatternPool({ patternIds: ["n5-onegai"] });
  const riyuu = buildSentencePatternPool({ patternIds: ["n5-riyuu"] });
  const toki = buildSentencePatternPool({ patternIds: ["n5-toki"] });

  it("each drill carries 8 kana-only items with unique solutions and full overlays", () => {
    expect(sonzai).toHaveLength(8);
    expect(ichi).toHaveLength(8);
    expect(joshi2).toHaveLength(8);
    expect(joshi3).toHaveLength(8);
    expect(hikaku).toHaveLength(8);
    expect(sukiDekiru).toHaveLength(8);
    expect(sasoi).toHaveLength(8);
    expect(onegai).toHaveLength(8);
    expect(riyuu).toHaveLength(8);
    expect(toki).toHaveLength(8);
    for (const q of [...sonzai, ...ichi, ...joshi2, ...joshi3, ...hikaku, ...sukiDekiru, ...sasoi, ...onegai, ...riyuu, ...toki]) {
      expect(q.options, q.id).toHaveLength(4);
      expect(new Set(q.options).size, q.id).toBe(4);
      expect(q.options!.filter((o) => q.expectedAnswers.includes(o)), q.id).toHaveLength(1);
      expect(q.promptText, q.id).not.toMatch(/[一-鿿]/);
      expect(q.hintZh ?? "", q.id).not.toContain(q.expectedAnswers[0]);
      const overlay = sentencePatternI18n[q.id];
      expect(overlay?.hintI18n?.ja && overlay?.hintI18n?.en, q.id).toBeTruthy();
      expect(
        overlay?.explanationI18n?.ja && overlay?.explanationI18n?.en,
        q.id
      ).toBeTruthy();
    }
  });

  it("the two N5 chapters sit in the N5 文法 category with pattern completion", () => {
    const byId = (id: string) => learningBlocks.find((b) => b.id === id)!;
    expect(byId("n5-sonzai").category).toBe("N5 文法");
    expect(byId("n5-ichi").category).toBe("N5 文法");
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "reading", questionId: "pattern-n5-sonzai-001" }],
        byId("n5-sonzai")
      )
    ).toBe(true);
    // Real-history implicit completion applies here too (no banner hijack).
    const regular = Array.from({ length: 5 }, (_, index) => ({
      isCorrect: true,
      targetForm: "te",
      questionId: `n2-item-${index}`
    }));
    expect(isLearningBlockComplete(regular, byId("n5-ichi"))).toBe(true);
  });
});

describe("Lesson-0 grammar chapters (#534)", () => {
  const byId = (id: string) => learningBlocks.find((b) => b.id === id)!;

  it("the two chapters follow starter-vocab inside the 入門 category", () => {
    expect(learningBlocks[3].id).toBe("starter-desu");
    expect(learningBlocks[4].id).toBe("starter-particles");
    expect(learningBlocks[3].category).toBe("入門");
    expect(learningBlocks[4].category).toBe("入門");
    expect(learningBlocks[5].category).toBe("N5 文法"); // #543 chapters follow the 入門 block
    expect(byId("starter-desu").patternDrills?.[0].patternIds).toEqual(["starter-desu"]);
    expect(byId("starter-particles").patternDrills?.[0].patternIds).toEqual([
      "starter-particles"
    ]);
  });

  it("completes via one correct attempt on the chapter's own pattern drill", () => {
    const chapter = byId("starter-desu");
    expect(isLearningBlockComplete([], chapter)).toBe(false);
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "reading", questionId: "pattern-starter-desu-001" }],
        chapter
      )
    ).toBe(true);
    // The other Lesson-0 drill does not complete this chapter.
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "reading", questionId: "pattern-starter-particles-001" }],
        chapter
      )
    ).toBe(false);
  });

  it("auto-completes for learners with real practice history (no 繼續 banner hijack)", () => {
    const regular = Array.from({ length: 5 }, (_, index) => ({
      isCorrect: true,
      targetForm: "te",
      questionId: `n3-grammar-item-${index}`
    }));
    expect(isLearningBlockComplete(regular, byId("starter-desu"))).toBe(true);
    expect(isLearningBlockComplete(regular, byId("starter-particles"))).toBe(true);
    // 入門 content itself is NOT evidence -- a kana-only learner still sees
    // these chapters as待完成.
    const introOnly = [
      ...Array.from({ length: 5 }, (_, index) => ({
        isCorrect: true,
        targetForm: "reading",
        questionId: `kana-hiragana-read-${index}`
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        isCorrect: true,
        targetForm: "meaning",
        questionId: `starter-word-${index}:meaning`
      }))
    ];
    expect(isLearningBlockComplete(introOnly, byId("starter-desu"))).toBe(false);
  });
});
