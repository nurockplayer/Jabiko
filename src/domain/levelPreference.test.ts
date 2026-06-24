import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readLevelPreference, writeLevelPreference } from "./levelPreference";

const KEY = "jabiko:targetLevel";

describe("levelPreference", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns null when nothing has been chosen", () => {
    expect(readLevelPreference()).toBeNull();
  });

  it("reads a stored valid range", () => {
    localStorage.setItem(KEY, "n2n3");
    expect(readLevelPreference()).toBe("n2n3");
  });

  it("treats an invalid stored value as null (no preference)", () => {
    localStorage.setItem(KEY, "definitely-not-a-range");
    expect(readLevelPreference()).toBeNull();
  });

  it("round-trips every valid LevelRange through write -> read", () => {
    for (const range of ["n4n5", "n2n3", "n1n2", "all"] as const) {
      writeLevelPreference(range);
      expect(readLevelPreference()).toBe(range);
    }
  });

  it("persists the latest choice (overwrite)", () => {
    writeLevelPreference("n1n2");
    writeLevelPreference("n4n5");
    expect(readLevelPreference()).toBe("n4n5");
  });
});
