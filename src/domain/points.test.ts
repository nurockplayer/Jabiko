import { describe, expect, it } from "vitest";
import type { Attempt } from "./types";
import { computeEarnedPoints, POINTS_PER_CORRECT_ANSWER, pointsForAttempt } from "./points";

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    vocabularyId: "v1",
    targetForm: "reading",
    prompt: "prompt",
    expectedAnswers: ["a"],
    submittedAnswer: "a",
    isCorrect: true,
    timestamp: 1,
    responseTimeMs: 100,
    ...overrides
  };
}

describe("points economy — answer-reward foundation", () => {
  it("awards exactly one point for a correct attempt", () => {
    expect(POINTS_PER_CORRECT_ANSWER).toBe(1);
    expect(pointsForAttempt(attempt({ isCorrect: true }))).toBe(1);
  });

  it("awards nothing for a wrong attempt", () => {
    expect(pointsForAttempt(attempt({ isCorrect: false }))).toBe(0);
  });

  it("earned total replays the whole attempt history", () => {
    const history = [
      attempt({ isCorrect: true }),
      attempt({ isCorrect: false }),
      attempt({ isCorrect: true }),
      attempt({ isCorrect: true })
    ];
    expect(computeEarnedPoints(history)).toBe(3);
  });

  it("an empty history earns zero", () => {
    expect(computeEarnedPoints([])).toBe(0);
  });

  it("re-deriving from the same history is stable (same attempts, same total)", () => {
    const history = [attempt({ isCorrect: true }), attempt({ isCorrect: false })];
    expect(computeEarnedPoints(history)).toBe(computeEarnedPoints([...history]));
  });
});
