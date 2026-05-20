import { describe, expect, it } from "vitest";
import { createAttemptStore } from "./storage";
import type { Attempt } from "./types";

const attempt: Attempt = {
  vocabularyId: "kaku",
  targetForm: "te",
  prompt: "書く",
  expectedAnswers: ["書いて"],
  submittedAnswer: "書いて",
  isCorrect: true,
  timestamp: 1000,
  responseTimeMs: 500
};

describe("createAttemptStore", () => {
  it("persists attempts through the provided storage", () => {
    const backing = new Map<string, string>();
    const store = createAttemptStore({
      getItem: (key) => backing.get(key) ?? null,
      setItem: (key, value) => backing.set(key, value),
      removeItem: (key) => backing.delete(key)
    });

    store.add(attempt);

    expect(store.list()).toEqual([attempt]);
  });

  it("falls back to memory when storage throws", () => {
    const store = createAttemptStore({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      }
    });

    store.add(attempt);

    expect(store.list()).toEqual([attempt]);
    expect(() => store.clear()).not.toThrow();
    expect(store.list()).toEqual([]);
  });
});
