import { describe, expect, it } from "vitest";
import { computeActivityTrend } from "./trend";
import type { Attempt } from "../types";

const MS_PER_DAY = 86_400_000;
// A clean day boundary + a few seconds so "now" sits inside one day bucket.
const NOW = 20_300 * MS_PER_DAY + 5_000;

function attempt(over: Partial<Attempt>): Attempt {
  return {
    questionId: "n3-grammar-x",
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

describe("computeActivityTrend", () => {
  it("returns a dense, zero-filled range of `days` buckets ending today", () => {
    const trend = computeActivityTrend([], 7, NOW);
    expect(trend).toHaveLength(7);
    const todayBucket = Math.floor(NOW / MS_PER_DAY);
    // Oldest first, today last.
    expect(trend[0].dayBucket).toBe(todayBucket - 6);
    expect(trend[6].dayBucket).toBe(todayBucket);
    // Empty history -> every bucket is zero (not an empty array).
    for (const point of trend) {
      expect(point.attempts).toBe(0);
      expect(point.correct).toBe(0);
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("buckets attempts by day and counts correct separately", () => {
    const attempts = [
      attempt({ timestamp: NOW, isCorrect: true }), // today
      attempt({ timestamp: NOW - 1000, isCorrect: false }), // also today
      attempt({ timestamp: NOW - 2 * MS_PER_DAY, isCorrect: true }) // 2 days ago
    ];
    const trend = computeActivityTrend(attempts, 7, NOW);
    const today = trend[6];
    expect(today.attempts).toBe(2);
    expect(today.correct).toBe(1);
    const twoAgo = trend[4];
    expect(twoAgo.attempts).toBe(1);
    expect(twoAgo.correct).toBe(1);
  });

  it("excludes attempts older than the window", () => {
    const attempts = [attempt({ timestamp: NOW - 30 * MS_PER_DAY })];
    const trend = computeActivityTrend(attempts, 7, NOW);
    const total = trend.reduce((sum, p) => sum + p.attempts, 0);
    expect(total).toBe(0);
  });

  it("includes an attempt on the oldest in-window day", () => {
    const attempts = [attempt({ timestamp: NOW - 6 * MS_PER_DAY })];
    const trend = computeActivityTrend(attempts, 7, NOW);
    expect(trend[0].attempts).toBe(1);
  });

  it("returns an empty array for a non-positive window", () => {
    expect(computeActivityTrend([attempt({})], 0, NOW)).toEqual([]);
    expect(computeActivityTrend([attempt({})], -3, NOW)).toEqual([]);
  });
});
