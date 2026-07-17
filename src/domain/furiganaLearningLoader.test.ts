import { beforeEach, describe, expect, it } from "vitest";
import { loadLearningMap, resetLearningLoader } from "./furiganaLearningLoader";

describe("furiganaLearningLoader (#618)", () => {
  beforeEach(() => {
    resetLearningLoader();
  });

  it("loads the learning map through a dynamic import", async () => {
    const map = await loadLearningMap();
    expect(Object.keys(map).length).toBeGreaterThan(0);
  });

  it("deduplicates concurrent and repeated requests", async () => {
    const first = loadLearningMap();
    const second = loadLearningMap();
    expect(second).toBe(first);
    await first;
  });

  it("returns a fresh promise after reset", async () => {
    const first = loadLearningMap();
    resetLearningLoader();
    const second = loadLearningMap();
    expect(second).not.toBe(first);
    await Promise.all([first, second]);
  });
});
