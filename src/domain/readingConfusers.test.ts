import { describe, expect, it } from "vitest";
import { generateReadingConfusers } from "./readingConfusers";

describe("generateReadingConfusers", () => {
  it("produces voicing confusers (清/濁)", () => {
    const out = generateReadingConfusers("こうそう");
    expect(out).toContain("ごうそう"); // こ -> ご
    expect(out).toContain("こうぞう"); // そ -> ぞ
  });

  it("de-voices an already-voiced reading and drops gemination", () => {
    const out = generateReadingConfusers("がっこう");
    expect(out).toContain("かっこう"); // が -> か
    expect(out).toContain("がこう"); // っ dropped
  });

  it("drops a trailing long vowel", () => {
    expect(generateReadingConfusers("こう")).toContain("こ");
    expect(generateReadingConfusers("せい")).toContain("せ");
  });

  it("handles 拗音 and 半濁 readings", () => {
    expect(generateReadingConfusers("しょう")).toContain("じょう"); // し -> じ
    expect(generateReadingConfusers("はん")).toContain("ばん"); // は -> ば
    expect(generateReadingConfusers("はん")).toContain("ぱん"); // は -> ぱ
  });

  it("never returns the reading itself or an excluded answer", () => {
    // ごう would be a real alternate reading -> exclude it so it can't be a distractor.
    const out = generateReadingConfusers("こう", new Set(["こう", "ごう"]));
    expect(out).not.toContain("こう");
    expect(out).not.toContain("ごう");
    expect(out.length).toBeGreaterThan(0);
  });

  it("returns unique, non-empty variants", () => {
    const out = generateReadingConfusers("こうそう");
    expect(new Set(out).size).toBe(out.length);
    expect(out.every((variant) => variant.length > 0 && variant !== "こうそう")).toBe(true);
  });
});
