import { describe, expect, it } from "vitest";
import type { Attempt } from "./types";
import { buddyEnergy, buddyLine, completionEnergy, trailingCorrect } from "./buddyReaction";

function attempts(pattern: boolean[]): Attempt[] {
  return pattern.map((isCorrect, i) => ({
    vocabularyId: "kaku",
    targetForm: "te",
    prompt: "書く",
    expectedAnswers: ["書いて"],
    submittedAnswer: "書いて",
    isCorrect,
    timestamp: i,
    responseTimeMs: 0
  }));
}

describe("buddyReaction", () => {
  it.each([
    [[], 0],
    [[false], 0],
    [[true, true], 2],
    [[true, false, true, true, true], 3],
    [[true, true, false], 0]
  ])("counts the correct run at the end of %j as %i", (pattern, streak) => {
    expect(trailingCorrect(attempts(pattern))).toBe(streak);
  });

  it.each([
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [5, 3],
    [12, 3]
  ])("maps a real run of %i correct answers to energy %i", (streak, energy) => {
    expect(buddyEnergy(streak)).toBe(energy);
  });

  it.each([
    [true, 100, 3],
    [false, 90, 2],
    [false, 70, 2],
    [false, 69, 1],
    [false, 0, 1]
  ] as const)("cheers a set (perfect %s, %i%%) with energy %i", (perfect, accuracy, energy) => {
    expect(completionEnergy(perfect, accuracy)).toBe(energy);
  });

  // ジャビ子 speaks in Japanese interjections (learning content, not UI copy),
  // stronger as the real run grows; a miss is met with encouragement.
  it.each([
    ["happy", 1, "いいね！"],
    ["happy", 2, "すごい！"],
    ["happy", 3, "さすが！"],
    ["oops", 1, "どんまい！"],
    ["oops", 3, "どんまい！"],
    ["thinking", 1, "なるほど…"],
    ["cheer", 1, "がんばったね！"],
    ["cheer", 2, "よくできました！"],
    ["cheer", 3, "かんぺき！"]
  ] as const)("says the %s line for energy %i", (mood, energy, line) => {
    expect(buddyLine(mood, energy)).toBe(line);
  });
});
