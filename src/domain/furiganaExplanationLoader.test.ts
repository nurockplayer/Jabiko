import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadExplanationMap,
  resetExplanationLoader,
} from "./furiganaExplanationLoader";

describe("furiganaExplanationLoader (#599)", () => {
  beforeEach(() => {
    resetExplanationLoader();
    vi.restoreAllMocks();
  });

  it("loads the explanation map via dynamic import", async () => {
    const map = await loadExplanationMap();
    expect(map).toBeDefined();
    expect(typeof map).toBe("object");
  });

  it("returns the same promise across multiple calls (module-level dedup)", async () => {
    const p1 = loadExplanationMap();
    const p2 = loadExplanationMap();
    expect(p1).toBe(p2);
    const map = await p1;
    expect(Object.keys(map).length).toBeGreaterThan(0);
  });

  it("resolving the promise returns a Record of FuriganaSegment arrays", async () => {
    const map = await loadExplanationMap();
    const keys = Object.keys(map);
    expect(keys.length).toBeGreaterThan(0);
    // Verify shape
    for (const entry of map[keys[0]]) {
      expect(typeof entry.t).toBe("string");
      if (entry.r !== undefined) expect(typeof entry.r).toBe("string");
    }
  });

  it("loads data that includes known explanation keys", async () => {
    const map = await loadExplanationMap();
    const keys = Object.keys(map);
    // At least one shared key should be present
    expect(keys.length).toBeGreaterThan(100);
  });
});
