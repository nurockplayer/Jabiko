import { describe, expect, it } from "vitest";
import {
  computeProgressStats,
  computeStreakDays,
  levelFromQuestionId,
  MASTERY_BOX
} from "./stats";
import { SRS_INTERVAL_DAYS } from "./srs";
import type { Attempt } from "./types";

const DAY = 86_400_000;
// A clean day boundary + a few seconds, so "now" sits inside day index 100.
const NOW = 100 * DAY + 5_000;

function attempt(over: Partial<Attempt>): Attempt {
  return {
    questionId: "n1-grammar-x",
    vocabularyId: "v",
    targetForm: "reading",
    prompt: "",
    expectedAnswers: ["a"],
    submittedAnswer: "a",
    isCorrect: true,
    timestamp: NOW,
    responseTimeMs: 100,
    ...over
  };
}

describe("levelFromQuestionId", () => {
  it("reads the JLPT level from the exam item id prefix", () => {
    expect(levelFromQuestionId("n1-grammar-toaimatte")).toBe("N1");
    expect(levelFromQuestionId("n3-vocab-hakkaku")).toBe("N3");
    expect(levelFromQuestionId("n5-grammar-x")).toBe("N5");
  });

  it("returns null for non-exam ids and missing ids", () => {
    expect(levelFromQuestionId("食べる:te")).toBeNull();
    expect(levelFromQuestionId("")).toBeNull();
    expect(levelFromQuestionId(undefined)).toBeNull();
  });
});

describe("computeStreakDays", () => {
  it("counts consecutive active days ending today", () => {
    const attempts = [100, 99, 98].map((day) => attempt({ timestamp: day * DAY + 1_000 }));
    expect(computeStreakDays(attempts, NOW)).toBe(3);
  });

  it("counts a streak that ends yesterday (today not yet active)", () => {
    const attempts = [99, 98].map((day) => attempt({ timestamp: day * DAY + 1_000 }));
    expect(computeStreakDays(attempts, NOW)).toBe(2);
  });

  it("stops at the first gap", () => {
    const attempts = [100, 98].map((day) => attempt({ timestamp: day * DAY + 1_000 }));
    expect(computeStreakDays(attempts, NOW)).toBe(1);
  });

  it("is 0 when the last activity is older than yesterday, or there is none", () => {
    expect(computeStreakDays([attempt({ timestamp: 97 * DAY })], NOW)).toBe(0);
    expect(computeStreakDays([], NOW)).toBe(0);
  });
});

describe("computeProgressStats", () => {
  it("aggregates overall and per-level accuracy from the id prefix", () => {
    const attempts = [
      attempt({ questionId: "n1-grammar-a", isCorrect: true }),
      attempt({ questionId: "n1-grammar-b", isCorrect: false }),
      attempt({ questionId: "n3-vocab-c", isCorrect: true })
    ];
    const stats = computeProgressStats(attempts, NOW);

    expect(stats.totalAnswered).toBe(3);
    expect(stats.totalCorrect).toBe(2);
    expect(stats.overallAccuracy).toBe(67); // 2/3

    const n1 = stats.perLevel.find((s) => s.level === "N1");
    expect(n1).toEqual({ level: "N1", answered: 2, correct: 1, accuracy: 50 });
    const n3 = stats.perLevel.find((s) => s.level === "N3");
    expect(n3).toEqual({ level: "N3", answered: 1, correct: 1, accuracy: 100 });
    // Levels with no attempts are omitted.
    expect(stats.perLevel.some((s) => s.level === "N2")).toBe(false);
  });

  it("counts a missed-then-recovered item as mastered (SRS box >= threshold)", () => {
    // First wrong seeds box 0; three corrects promote 0->1->2->3 (= MASTERY_BOX).
    const id = "n2-grammar-bakarini";
    const attempts = [
      attempt({ questionId: id, isCorrect: false, timestamp: 90 * DAY }),
      attempt({ questionId: id, isCorrect: true, timestamp: 91 * DAY }),
      attempt({ questionId: id, isCorrect: true, timestamp: 95 * DAY }),
      attempt({ questionId: id, isCorrect: true, timestamp: 99 * DAY })
    ];
    const stats = computeProgressStats(attempts, NOW);
    expect(MASTERY_BOX).toBe(3);
    expect(stats.masteredCount).toBe(1);
    // Box 3 -> 7-day interval from the last (day 99) attempt -> not due yet at day 100.
    expect(stats.dueCount).toBe(0);
  });

  it("rests a freshly-missed item, then counts it due after the box-0 interval", () => {
    const attempts = [attempt({ questionId: "n1-grammar-z", isCorrect: false, timestamp: NOW })];
    // Just missed -> resting, NOT due yet (no same-session answer-cramming).
    expect(computeProgressStats(attempts, NOW).dueCount).toBe(0);
    // Due once the box-0 rest (2 days, #472) elapses.
    const stats = computeProgressStats(attempts, NOW + SRS_INTERVAL_DAYS[0] * DAY);
    expect(stats.dueCount).toBe(1);
    expect(stats.masteredCount).toBe(0);
  });

  it("is all-zero for an empty history", () => {
    const stats = computeProgressStats([], NOW);
    expect(stats).toEqual({
      totalAnswered: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
      perLevel: [],
      masteredCount: 0,
      dueCount: 0,
      streakDays: 0
    });
  });
});
