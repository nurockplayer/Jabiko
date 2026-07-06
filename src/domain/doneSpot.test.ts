import { describe, expect, it } from "vitest";
import { DONE_SPOT_POOL, pickDoneSpot, type DoneSpotKey } from "./doneSpot";

describe("pickDoneSpot", () => {
  it("returns the open-eye daruma for a flawless run regardless of seed", () => {
    for (const seed of [0, 1, 5, 42, -3]) {
      expect(pickDoneSpot(seed, true)).toBe("daruma");
    }
  });

  it("never draws the perfect-only daruma from the ordinary pool", () => {
    expect(DONE_SPOT_POOL).not.toContain("daruma");
    for (let seed = 0; seed < 30; seed += 1) {
      expect(pickDoneSpot(seed, false)).not.toBe("daruma");
    }
  });

  it("picks the first pool entry for seed 0", () => {
    expect(pickDoneSpot(0, false)).toBe(DONE_SPOT_POOL[0]);
  });

  it("cycles through the whole pool as the seed increments", () => {
    const size = DONE_SPOT_POOL.length;
    for (let seed = 0; seed < size * 2; seed += 1) {
      expect(pickDoneSpot(seed, false)).toBe(DONE_SPOT_POOL[seed % size]);
    }
  });

  it("wraps negative seeds to a valid pool entry", () => {
    const size = DONE_SPOT_POOL.length;
    const pool: DoneSpotKey[] = DONE_SPOT_POOL;
    expect(pickDoneSpot(-1, false)).toBe(pool[size - 1]);
    expect(pickDoneSpot(-size, false)).toBe(pool[0]);
    expect(pool).toContain(pickDoneSpot(-13, false));
  });

  it("is deterministic for the same inputs", () => {
    expect(pickDoneSpot(7, false)).toBe(pickDoneSpot(7, false));
    expect(pickDoneSpot(7, true)).toBe(pickDoneSpot(7, true));
  });
});
