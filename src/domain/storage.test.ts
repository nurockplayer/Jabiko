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

  it("replace overwrites the whole list in memory and storage", () => {
    const backing = new Map<string, string>();
    const store = createAttemptStore({
      getItem: (key) => backing.get(key) ?? null,
      setItem: (key, value) => backing.set(key, value),
      removeItem: (key) => backing.delete(key)
    });

    store.add(attempt);
    const merged: Attempt[] = [
      attempt,
      { ...attempt, timestamp: 2000, submittedAnswer: "書きて", isCorrect: false }
    ];

    store.replace(merged);

    expect(store.list()).toEqual(merged);
    // persisted, not just in memory: a fresh store over the same backing
    // reads the replaced set back.
    const reopened = createAttemptStore({
      getItem: (key) => backing.get(key) ?? null,
      setItem: (key, value) => backing.set(key, value),
      removeItem: (key) => backing.delete(key)
    });
    expect(reopened.list()).toEqual(merged);
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

  it("removes the persisted history after storage recovers from a failed write", () => {
    const backing = new Map<string, string>([["jabiko:attempts", JSON.stringify([attempt])]]);
    let failWrite = false;
    const storage = {
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (failWrite) throw new Error("temporary write failure");
        backing.set(key, value);
      },
      removeItem: (key: string) => backing.delete(key)
    };
    const store = createAttemptStore(storage);

    failWrite = true;
    store.add({ ...attempt, timestamp: 2000 });
    expect(JSON.parse(backing.get("jabiko:attempts")!)).toEqual([attempt]);

    failWrite = false;
    expect(store.clear()).toBe(true);
    expect(backing.has("jabiko:attempts")).toBe(false);
    expect(createAttemptStore(storage).list()).toEqual([]);
  });

  it("resumes persistence after a recovered clear confirms the key is absent", () => {
    const backing = new Map<string, string>();
    let failRemove = true;
    const storage = {
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => backing.set(key, value),
      removeItem: (key: string) => {
        if (failRemove) throw new Error("temporary remove failure");
        backing.delete(key);
      }
    };
    const store = createAttemptStore(storage);

    store.add(attempt);
    expect(store.clear()).toBe(false);
    expect(store.list()).toEqual([]);

    failRemove = false;
    expect(store.clear()).toBe(true);
    store.add({ ...attempt, timestamp: 2000 });

    expect(JSON.parse(backing.get("jabiko:attempts")!)).toEqual([
      { ...attempt, timestamp: 2000 }
    ]);
  });
});
