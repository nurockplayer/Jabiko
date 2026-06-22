import { describe, expect, it } from "vitest";
import { attemptKey, mergeAttempts } from "./attemptSync";
import type { Attempt } from "./types";

// Build an Attempt fixture; override only the fields a test cares about.
function att(over: Partial<Attempt> = {}): Attempt {
  return {
    vocabularyId: "v1",
    targetForm: "te",
    prompt: "p",
    expectedAnswers: ["x"],
    submittedAnswer: "x",
    isCorrect: true,
    timestamp: 1000,
    responseTimeMs: 100,
    ...over
  };
}

describe("attemptKey", () => {
  it("is identical for two records with the same identifying fields", () => {
    expect(attemptKey(att())).toBe(attemptKey(att()));
  });

  it("differs when any identifying field differs", () => {
    const base = attemptKey(att());
    expect(attemptKey(att({ timestamp: 1001 }))).not.toBe(base);
    expect(attemptKey(att({ vocabularyId: "v2" }))).not.toBe(base);
    expect(attemptKey(att({ targetForm: "ta" }))).not.toBe(base);
    expect(attemptKey(att({ submittedAnswer: "y" }))).not.toBe(base);
    expect(attemptKey(att({ questionId: "q1" }))).not.toBe(base);
  });
});

describe("mergeAttempts", () => {
  it("unions disjoint lists", () => {
    const a = att({ timestamp: 1 });
    const b = att({ timestamp: 2, vocabularyId: "v2" });
    expect(mergeAttempts([a], [b])).toEqual([a, b]);
  });

  it("dedupes an attempt present in both (union, no duplicate)", () => {
    const a = att({ timestamp: 1 });
    const b = att({ timestamp: 2, vocabularyId: "v2" });
    const c = att({ timestamp: 3, vocabularyId: "v3" });
    const merged = mergeAttempts([a, b], [b, c]);
    expect(merged).toHaveLength(3);
    expect(merged).toEqual([a, b, c]);
  });

  it("collapses identical lists to one copy", () => {
    const a = att();
    expect(mergeAttempts([a], [a])).toEqual([a]);
  });

  it("is idempotent: re-merging the remote set never grows the result", () => {
    const local = [att({ timestamp: 1 }), att({ timestamp: 3, vocabularyId: "v3" })];
    const remote = [att({ timestamp: 2, vocabularyId: "v2" })];
    const once = mergeAttempts(local, remote);
    expect(mergeAttempts(once, remote)).toEqual(once);
  });

  it("sorts the merged set by timestamp ascending", () => {
    const merged = mergeAttempts(
      [att({ timestamp: 30, vocabularyId: "c" })],
      [att({ timestamp: 10, vocabularyId: "a" }), att({ timestamp: 20, vocabularyId: "b" })]
    );
    expect(merged.map((m) => m.timestamp)).toEqual([10, 20, 30]);
  });

  it("does not mutate its inputs", () => {
    const local = [att({ timestamp: 2 })];
    const remote = [att({ timestamp: 1, vocabularyId: "v2" })];
    mergeAttempts(local, remote);
    expect(local.map((a) => a.timestamp)).toEqual([2]);
    expect(remote.map((a) => a.timestamp)).toEqual([1]);
  });

  it("handles empty inputs", () => {
    const a = att();
    expect(mergeAttempts([], [])).toEqual([]);
    expect(mergeAttempts([a], [])).toEqual([a]);
    expect(mergeAttempts([], [a])).toEqual([a]);
  });
});
