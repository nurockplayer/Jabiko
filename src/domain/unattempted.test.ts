import { describe, expect, it } from "vitest";
import { collectAttemptedIds, prioritizeUnattempted } from "./unattempted";
import type { Attempt, PracticeQuestion } from "./types";

const q = (id: string) => ({ id } as PracticeQuestion);
const ids = (pool: PracticeQuestion[]) => pool.map((p) => p.id);

describe("collectAttemptedIds", () => {
  it("collects both questionId and vocabularyId, de-duplicated", () => {
    const attempts = [
      { questionId: "exam-1", vocabularyId: "exam-1" },
      { vocabularyId: "kaku" },
      { questionId: "exam-2", vocabularyId: "exam-2" },
      { questionId: "exam-1", vocabularyId: "exam-1" } // dup
    ] as Attempt[];
    const set = collectAttemptedIds(attempts);
    expect(set.has("exam-1")).toBe(true);
    expect(set.has("exam-2")).toBe(true);
    expect(set.has("kaku")).toBe(true);
    expect(set.size).toBe(3);
  });

  it("returns an empty set for no attempts", () => {
    expect(collectAttemptedIds([]).size).toBe(0);
  });
});

describe("prioritizeUnattempted", () => {
  const pool = [q("a"), q("b"), q("c"), q("d")];

  it("moves unattempted items to the front, preserving order within each group", () => {
    const attempted = new Set(["a", "c"]); // b, d are fresh
    expect(ids(prioritizeUnattempted(pool, attempted))).toEqual(["b", "d", "a", "c"]);
  });

  it("is a no-op when nothing has been attempted", () => {
    expect(ids(prioritizeUnattempted(pool, new Set()))).toEqual(["a", "b", "c", "d"]);
  });

  it("keeps the pool order when everything has been attempted", () => {
    expect(ids(prioritizeUnattempted(pool, new Set(["a", "b", "c", "d"])))).toEqual(["a", "b", "c", "d"]);
  });

  it("does not mutate the input pool", () => {
    const input = [q("a"), q("b")];
    prioritizeUnattempted(input, new Set(["a"]));
    expect(ids(input)).toEqual(["a", "b"]);
  });
});
