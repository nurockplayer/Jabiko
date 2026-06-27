import { describe, expect, it } from "vitest";
import { questionTypeOf, QUESTION_TYPES } from "./questionType";
import type { Attempt } from "../types";

function withId(questionId: string | undefined): Attempt {
  return {
    questionId,
    vocabularyId: "v",
    targetForm: "reading",
    prompt: "",
    expectedAnswers: ["a"],
    submittedAnswer: "a",
    isCorrect: true,
    timestamp: 0,
    responseTimeMs: 1
  };
}

describe("questionTypeOf", () => {
  it("decodes every exam id 2nd segment", () => {
    const cases: Record<string, string> = {
      "n1-grammar-bakari": "grammar",
      "n3-vocab-koutsuu": "vocab",
      "n3-kanji-koutsuu": "kanji",
      "n2-syn-aaa": "syn",
      "n1-usage-bbb": "usage",
      "n3-context-ccc": "context",
      "n2-read-ddd": "read",
      "n1-order-eee": "order",
      "n2-text-fff": "text"
    };
    for (const [id, expected] of Object.entries(cases)) {
      expect(questionTypeOf(withId(id))).toBe(expected);
    }
  });

  it("buckets the non-exam practice modes by id namespace", () => {
    expect(questionTypeOf(withId("cloze:te-form-001"))).toBe("cloze");
    expect(questionTypeOf(withId("pattern-te-kudasai-001"))).toBe("pattern");
    // basic conjugation / vocab-reading drills use the `vocabId:targetForm` id
    expect(questionTypeOf(withId("kaku:te"))).toBe("basic");
    // missing id (legacy attempts keyed by vocabularyId:targetForm) -> basic
    expect(questionTypeOf(withId(undefined))).toBe("basic");
  });

  it("falls back to basic for an unrecognised id shape", () => {
    expect(questionTypeOf(withId("n9-foo-bar"))).toBe("basic");
    expect(questionTypeOf(withId("totally-unknown"))).toBe("basic");
  });

  it("lists exam types before the practice-mode buckets", () => {
    // exam types first (so a worst-first sort still reads sensibly), basic last
    expect(QUESTION_TYPES[0]).toBe("grammar");
    expect(QUESTION_TYPES[QUESTION_TYPES.length - 1]).toBe("basic");
    expect(new Set(QUESTION_TYPES).size).toBe(QUESTION_TYPES.length);
  });
});
