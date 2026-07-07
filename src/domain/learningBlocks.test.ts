import { describe, it, expect } from "vitest";
import { learningBlocks, isLearningBlockComplete } from "./learningBlocks";

const byId = (id: string) => {
  const block = learningBlocks.find((b) => b.id === id);
  if (!block) throw new Error(`no learning block ${id}`);
  return block;
};

describe("isLearningBlockComplete", () => {
  it("a conjugation chapter completes once all its required forms are answered correctly", () => {
    const masu = byId("masu");
    expect(isLearningBlockComplete([], masu)).toBe(false);
    const attempts = (masu.requiredForms ?? []).map((targetForm) => ({ isCorrect: true, targetForm }));
    expect(isLearningBlockComplete(attempts, masu)).toBe(true);
  });

  it("the verb-types reference chapter is always complete (reading material)", () => {
    expect(isLearningBlockComplete([], byId("verb-types"))).toBe(true);
  });

  it("a sentence-pattern chapter completes via a correct pattern-drill attempt", () => {
    const tek = byId("te-kudasai");
    expect(isLearningBlockComplete([], tek)).toBe(false);
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "te", questionId: "pattern-te-kudasai-001" }],
        tek
      )
    ).toBe(true);
    // a wrong attempt (or one for another pattern) does not complete it
    expect(
      isLearningBlockComplete(
        [{ isCorrect: false, targetForm: "te", questionId: "pattern-te-kudasai-002" }],
        tek
      )
    ).toBe(false);
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "te", questionId: "pattern-to-omou-001" }],
        tek
      )
    ).toBe(false);
  });

  it("the N3 grammar lesson chapters are reference and launch the N3 文法 exam drill", () => {
    for (const id of ["n3-jouken", "n3-suiryou"]) {
      const block = byId(id);
      expect(block.completionMode).toBe("reference");
      expect(block.examDrill).toEqual({
        labelKey: "drillN3Grammar",
        level: "N3",
        promptLabel: "文法形式選擇"
      });
    }
  });

  it("the seven sentence-pattern chapters now count as trackable (drillable) chapters", () => {
    const trackable = learningBlocks.filter(
      (b) => b.group === "basic" && b.completionMode !== "reference"
    );
    // 2 kana + 1 starter-vocab (#533) + 2 Lesson-0 grammar (#534) + 13 N5 grammar (#543-#548) + 8 N4 grammar (#549-#552) + 11
    // conjugation + 7 sentence-pattern; only verb-types stays reference.
    expect(trackable.length).toBe(44);
    expect(trackable.some((b) => b.id === "te-kudasai")).toBe(true);
    expect(byId("verb-types").completionMode).toBe("reference");
  });
});

describe("kana starter chapters (#533)", () => {
  it("the five 入門 chapters lead the chapter list, ahead of every other category", () => {
    expect(learningBlocks[0].id).toBe("kana-hiragana");
    expect(learningBlocks[1].id).toBe("kana-katakana");
    expect(learningBlocks[2].id).toBe("starter-vocab");
    expect(learningBlocks[3].id).toBe("starter-desu");
    expect(learningBlocks[4].id).toBe("starter-particles");
    for (let i = 0; i < 5; i++) expect(learningBlocks[i].category).toBe("入門");
    expect(learningBlocks[5].category).not.toBe("入門");
  });

  it("the starter-vocab chapter completes via a starter attempt or implicit history", () => {
    const starter = byId("starter-vocab");
    expect(isLearningBlockComplete([], starter)).toBe(false);
    // One correct starter-drill answer (buildQuestionPool ids are "<vocabId>:<form>").
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "meaning", questionId: "starter-mizu:meaning" }],
        starter
      )
    ).toBe(true);
    // Kana drills alone prove kana literacy, not vocab knowledge.
    const kanaOnly = Array.from({ length: 10 }, (_, index) => ({
      isCorrect: true,
      targetForm: "reading",
      questionId: `kana-hiragana-read-${index}`
    }));
    expect(isLearningBlockComplete(kanaOnly, starter)).toBe(false);
    // A real (non-入門) practice history implies this floor is behind them.
    const regular = Array.from({ length: 5 }, (_, index) => ({
      isCorrect: true,
      targetForm: "te",
      questionId: `n3-grammar-item-${index}`
    }));
    expect(isLearningBlockComplete(regular, starter)).toBe(true);
  });

  it("a kana chapter completes via one correct kana-drill attempt of its script", () => {
    const hira = byId("kana-hiragana");
    expect(isLearningBlockComplete([], hira)).toBe(false);
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "reading", questionId: "kana-hiragana-read-3057" }],
        hira
      )
    ).toBe(true);
    // Wrong attempt, or the OTHER script, does not complete it.
    expect(
      isLearningBlockComplete(
        [{ isCorrect: false, targetForm: "reading", questionId: "kana-hiragana-read-3057" }],
        hira
      )
    ).toBe(false);
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "reading", questionId: "kana-katakana-read-30b7" }],
        hira
      )
    ).toBe(false);
  });

  it("kana chapters auto-complete for learners with evident kana literacy (existing users)", () => {
    // A learner with a body of correct answers on regular content can read
    // kana by definition -- their home 繼續 banner must NOT be hijacked into
    // 五十音 (the chapters sit first in array order).
    const hira = byId("kana-hiragana");
    const kata = byId("kana-katakana");
    const regular = (count: number) =>
      Array.from({ length: count }, (_, index) => ({
        isCorrect: true,
        targetForm: "te",
        questionId: `n2-grammar-item-${index}`
      }));
    expect(isLearningBlockComplete(regular(5), hira)).toBe(true);
    expect(isLearningBlockComplete(regular(5), kata)).toBe(true);
    // A thin history (below the evidence threshold) does not auto-complete.
    expect(isLearningBlockComplete(regular(2), hira)).toBe(false);
    // Wrong answers are not literacy evidence.
    const wrongs = Array.from({ length: 10 }, (_, index) => ({
      isCorrect: false,
      targetForm: "te",
      questionId: `n2-grammar-item-${index}`
    }));
    expect(isLearningBlockComplete(wrongs, hira)).toBe(false);
  });
});
