import { describe, expect, it } from "vitest";
import { computeReviewStates, countMistakes, getMistakePool, SRS_MAX_BOX } from "./srs";
import type { Attempt, PracticeQuestion, VocabularyItem } from "./types";

function makeAttempt(questionId: string, isCorrect: boolean, timestamp: number): Attempt {
  return {
    questionId,
    vocabularyId: questionId.split(":")[0] ?? questionId,
    targetForm: "te",
    prompt: "",
    expectedAnswers: ["ok"],
    submittedAnswer: isCorrect ? "ok" : "no",
    isCorrect,
    timestamp,
    responseTimeMs: 100
  };
}

function makeQuestion(id: string): PracticeQuestion {
  const vocab: VocabularyItem = {
    id: id.split(":")[0] ?? id,
    surface: id,
    reading: id,
    meaningZh: "test",
    partOfSpeech: "verb",
    group: "godan",
    lesson: null,
    tags: [],
    examples: []
  };
  return { id, vocabulary: vocab, targetForm: "te", expectedAnswers: ["ok"], explanation: "" };
}

describe("computeReviewStates", () => {
  it("returns an empty map when no attempts have been made", () => {
    expect(computeReviewStates([])).toEqual(new Map());
  });

  it("ignores items that have only correct attempts", () => {
    // Correct-first-try items never enter the tracker; the review queue is
    // for things you got WRONG.
    const states = computeReviewStates([
      makeAttempt("q1", true, 1000),
      makeAttempt("q1", true, 2000)
    ]);
    expect(states.size).toBe(0);
  });

  it("seeds a first-wrong item in box 0 at the miss timestamp", () => {
    const states = computeReviewStates([makeAttempt("q1", false, 5000)]);
    const state = states.get("q1");
    expect(state).toBeDefined();
    expect(state!.box).toBe(0);
    expect(state!.lastAttemptAt).toBe(5000);
  });

  it("promotes one box per correct attempt up to the cap", () => {
    const states = computeReviewStates([
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000),
      makeAttempt("q1", true, 3000),
      makeAttempt("q1", true, 4000),
      makeAttempt("q1", true, 5000),
      makeAttempt("q1", true, 6000), // would be box 5 if uncapped
      makeAttempt("q1", true, 7000) // still capped
    ]);
    const state = states.get("q1")!;
    expect(state.box).toBe(SRS_MAX_BOX);
    expect(state.lastAttemptAt).toBe(7000);
  });

  it("resets to box 0 on a wrong attempt regardless of prior box", () => {
    const states = computeReviewStates([
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000), // box 1
      makeAttempt("q1", true, 3000), // box 2
      makeAttempt("q1", true, 4000), // box 3
      makeAttempt("q1", false, 5000) // RESET -> box 0 (back in the pool)
    ]);
    const state = states.get("q1")!;
    expect(state.box).toBe(0);
    expect(state.lastAttemptAt).toBe(5000);
  });

  it("sorts unordered input chronologically before replay", () => {
    const states = computeReviewStates([
      makeAttempt("q1", true, 3000),
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000)
    ]);
    expect(states.get("q1")!.box).toBe(2);
  });

  it("tracks multiple items independently", () => {
    const states = computeReviewStates([
      makeAttempt("q1", false, 1000),
      makeAttempt("q2", false, 1500),
      makeAttempt("q1", true, 2000)
    ]);
    expect(states.get("q1")!.box).toBe(1);
    expect(states.get("q2")!.box).toBe(0);
  });
});

describe("getMistakePool", () => {
  const pool = [makeQuestion("q1"), makeQuestion("q2"), makeQuestion("q3")];

  it("returns an empty pool when no attempts have been made", () => {
    expect(getMistakePool([], pool)).toEqual([]);
  });

  it("adds a missed question to the pool immediately -- no cooldown (#525)", () => {
    const attempts = [makeAttempt("q1", false, 5000)];
    expect(getMistakePool(attempts, pool)).toEqual([pool[0]]);
  });

  it("removes a question from the pool after ONE correct answer", () => {
    const attempts = [makeAttempt("q1", false, 1000), makeAttempt("q1", true, 2000)];
    expect(getMistakePool(attempts, pool)).toEqual([]);
  });

  it("re-adds a question that is missed again after being cleared", () => {
    const attempts = [
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000), // cleared
      makeAttempt("q1", false, 3000) // missed again -> back in
    ];
    expect(getMistakePool(attempts, pool)).toEqual([pool[0]]);
  });

  it("keeps a promoted-then-missed item in the pool", () => {
    const attempts = [
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000),
      makeAttempt("q1", true, 3000),
      makeAttempt("q1", false, 4000) // reset to box 0
    ];
    expect(getMistakePool(attempts, pool)).toEqual([pool[0]]);
  });

  it("orders the pool oldest-unresolved-mistake first", () => {
    const attempts = [makeAttempt("q1", false, 1000), makeAttempt("q2", false, 5000)];
    expect(getMistakePool(attempts, pool).map((q) => q.id)).toEqual(["q1", "q2"]);
  });

  it("orders by the LATEST miss, not the first (a re-missed item goes to the back)", () => {
    const attempts = [
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000),
      makeAttempt("q2", false, 3000), // q2 unresolved since 3000
      makeAttempt("q1", false, 6000) // q1 re-missed at 6000 (newer)
    ];
    expect(getMistakePool(attempts, pool).map((q) => q.id)).toEqual(["q2", "q1"]);
  });

  it("returns at most one entry per question id", () => {
    const attempts = [
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", false, 2000),
      makeAttempt("q1", false, 3000)
    ];
    expect(getMistakePool(attempts, pool)).toEqual([pool[0]]);
  });

  it("excludes items whose pool entry is missing (no throw)", () => {
    const attempts = [makeAttempt("unknown", false, 1000)];
    expect(getMistakePool(attempts, pool)).toEqual([]);
  });
});

describe("countMistakes", () => {
  it("counts questions currently in the mistake pool", () => {
    const attempts = [
      makeAttempt("q1", false, 1000), // in
      makeAttempt("q2", false, 1500), // in ...
      makeAttempt("q2", true, 2000), // ... then cleared
      makeAttempt("q3", true, 3000) // never wrong -> not tracked
    ];
    expect(countMistakes(attempts)).toBe(1);
  });

  it("is zero when every missed item has been cleared", () => {
    const attempts = [makeAttempt("q1", false, 1000), makeAttempt("q1", true, 2000)];
    expect(countMistakes(attempts)).toBe(0);
  });
});
