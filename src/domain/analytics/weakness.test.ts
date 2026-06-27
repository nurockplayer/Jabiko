import { describe, expect, it } from "vitest";
import { computeErrorsByQuestionType } from "./weakness";
import type { Attempt } from "../types";

function ans(questionId: string, isCorrect: boolean): Attempt {
  return {
    questionId,
    vocabularyId: "v",
    targetForm: "reading",
    prompt: "",
    expectedAnswers: ["a"],
    submittedAnswer: isCorrect ? "a" : "b",
    isCorrect,
    timestamp: 0,
    responseTimeMs: 1
  };
}

describe("computeErrorsByQuestionType", () => {
  it("groups attempts by question type with accuracy", () => {
    const stats = computeErrorsByQuestionType([
      ans("n1-grammar-a", true),
      ans("n1-grammar-b", false),
      ans("n3-kanji-c", true),
      ans("n3-kanji-d", true)
    ]);
    const grammar = stats.find((s) => s.type === "grammar");
    const kanji = stats.find((s) => s.type === "kanji");
    expect(grammar).toMatchObject({ answered: 2, correct: 1, accuracy: 50 });
    expect(kanji).toMatchObject({ answered: 2, correct: 2, accuracy: 100 });
  });

  it("sorts weakest (lowest accuracy) first", () => {
    const stats = computeErrorsByQuestionType([
      ans("n3-kanji-a", true),
      ans("n3-kanji-b", true),
      ans("n1-grammar-c", false),
      ans("n1-grammar-d", true),
      ans("n2-vocab-e", false),
      ans("n2-vocab-f", false)
    ]);
    expect(stats.map((s) => s.type)).toEqual(["vocab", "grammar", "kanji"]);
  });

  it("counts revealed answers as wrong, like the overall accuracy ring", () => {
    // usePracticeSession records a reveal as { isCorrect:false }, so it must
    // pull the type's accuracy DOWN -- the per-type bars stay consistent with
    // computeProgressStats.overallAccuracy.
    const reveal = { ...ans("n1-grammar-a", false), submittedAnswer: "(revealed)" };
    const stats = computeErrorsByQuestionType([ans("n1-grammar-b", true), reveal]);
    expect(stats.find((s) => s.type === "grammar")).toMatchObject({
      answered: 2,
      correct: 1,
      accuracy: 50
    });
  });

  it("excludes types with no attempts and returns [] for empty input", () => {
    expect(computeErrorsByQuestionType([])).toEqual([]);
    const stats = computeErrorsByQuestionType([ans("n1-grammar-a", true)]);
    expect(stats).toHaveLength(1);
    expect(stats.every((s) => s.answered > 0)).toBe(true);
  });
});
