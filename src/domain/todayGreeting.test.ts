import { describe, expect, it } from "vitest";
import type { Attempt } from "./types";
import {
  answeredOnLocalDay,
  greetingLine,
  localDayStreak,
  timeOfDay,
  todayGreeting
} from "./todayGreeting";

// Local wall-clock times, so the rules are checked in the learner's own day
// whatever timezone the test runner uses.
function at(year: number, month: number, day: number, hour: number, minute = 0): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function attempt(timestamp: number, isCorrect = true): Attempt {
  return {
    questionId: "q",
    vocabularyId: "v",
    targetForm: "meaning",
    prompt: "p",
    expectedAnswers: ["a"],
    submittedAnswer: isCorrect ? "a" : "b",
    isCorrect,
    timestamp,
    responseTimeMs: 1000
  };
}

describe("timeOfDay", () => {
  it("splits the day into morning, daytime and evening", () => {
    expect(timeOfDay(5)).toBe("morning");
    expect(timeOfDay(10)).toBe("morning");
    expect(timeOfDay(11)).toBe("day");
    expect(timeOfDay(16)).toBe("day");
    expect(timeOfDay(17)).toBe("evening");
    expect(timeOfDay(23)).toBe("evening");
    expect(timeOfDay(0)).toBe("evening");
    expect(timeOfDay(4)).toBe("evening");
  });
});

describe("answeredOnLocalDay", () => {
  it("counts only attempts on the learner's local calendar day", () => {
    const now = at(2026, 10, 10, 7, 30);
    const attempts = [
      attempt(at(2026, 10, 9, 23, 59)),
      attempt(at(2026, 10, 10, 0, 1)),
      attempt(at(2026, 10, 10, 7, 0)),
      attempt(at(2026, 10, 11, 0, 1))
    ];
    expect(answeredOnLocalDay(attempts, now)).toBe(2);
  });
});

describe("localDayStreak", () => {
  it("is 0 with no history", () => {
    expect(localDayStreak([], at(2026, 10, 10, 9))).toBe(0);
  });

  it("counts consecutive local days ending today", () => {
    const now = at(2026, 10, 10, 9);
    const attempts = [
      attempt(at(2026, 10, 8, 22)),
      attempt(at(2026, 10, 9, 1)),
      attempt(at(2026, 10, 10, 8))
    ];
    expect(localDayStreak(attempts, now)).toBe(3);
  });

  it("keeps a streak that ended yesterday alive until today is over", () => {
    const now = at(2026, 10, 10, 21);
    const attempts = [attempt(at(2026, 10, 8, 12)), attempt(at(2026, 10, 9, 12))];
    expect(localDayStreak(attempts, now)).toBe(2);
  });

  it("is broken by a missed day", () => {
    const now = at(2026, 10, 10, 9);
    const attempts = [attempt(at(2026, 10, 7, 12)), attempt(at(2026, 10, 8, 12))];
    expect(localDayStreak(attempts, now)).toBe(0);
  });

  it("does not use UTC day boundaries (an early-morning answer is still today)", () => {
    const now = at(2026, 10, 10, 6);
    const attempts = [attempt(at(2026, 10, 9, 20)), attempt(at(2026, 10, 10, 5, 30))];
    expect(localDayStreak(attempts, now)).toBe(2);
  });
});

describe("todayGreeting", () => {
  it("introduces ジャビ子 to a brand-new learner", () => {
    const greeting = todayGreeting([], at(2026, 10, 10, 9));
    expect(greeting).toEqual({ kind: "welcome", streakDays: 0, answeredToday: 0, timeOfDay: "morning" });
    expect(greetingLine(greeting)).toBe("はじめまして！");
  });

  it("cheers a learner who already practised today and keeps a streak going", () => {
    const now = at(2026, 10, 10, 20);
    const attempts = [attempt(at(2026, 10, 9, 12)), attempt(at(2026, 10, 10, 19)), attempt(at(2026, 10, 10, 19, 5))];
    const greeting = todayGreeting(attempts, now);
    expect(greeting).toEqual({ kind: "keepGoing", streakDays: 2, answeredToday: 2, timeOfDay: "evening" });
    expect(greetingLine(greeting)).toBe("その調子！");
  });

  it("welcomes back a learner who practised today for the first time in a while", () => {
    const now = at(2026, 10, 10, 13);
    const greeting = todayGreeting([attempt(at(2026, 10, 10, 12))], now);
    expect(greeting.kind).toBe("practicedToday");
    expect(greeting.answeredToday).toBe(1);
    expect(greetingLine(greeting)).toBe("おかえり！");
  });

  it("nudges a live streak that still needs today's practice", () => {
    const now = at(2026, 10, 10, 8);
    const attempts = [attempt(at(2026, 10, 8, 12)), attempt(at(2026, 10, 9, 12))];
    const greeting = todayGreeting(attempts, now);
    expect(greeting).toEqual({ kind: "streakWaiting", streakDays: 2, answeredToday: 0, timeOfDay: "morning" });
    expect(greetingLine(greeting)).toBe("おはよう！");
  });

  it("greets a returning learner without a live streak by the time of day", () => {
    const now = at(2026, 10, 10, 18);
    const greeting = todayGreeting([attempt(at(2026, 10, 1, 12))], now);
    expect(greeting.kind).toBe("returning");
    expect(greeting.streakDays).toBe(0);
    expect(greetingLine(greeting)).toBe("こんばんは！");
    expect(greetingLine({ ...greeting, timeOfDay: "day" })).toBe("こんにちは！");
  });
});
