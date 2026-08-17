// Focus Mode persistence store tests (#771). Exercises the thin storage layer:
// crash-safe read/write with an in-memory fallback when localStorage is blocked
// or absent (SSR), mirroring createAttemptStore in storage.ts.
import { describe, expect, it } from "vitest";
import { defaultFocusConfig, type FocusPersistedState } from "./focus";
import { createFocusStore, FOCUS_STORAGE_KEY } from "./focusStorage";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function createMockStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    }
  };
}

function fullState(): FocusPersistedState {
  return {
    config: { focusMinutes: 50, breakMinutes: 10 },
    session: {
      phase: "focus",
      cycle: 1,
      focusStartedAt: 1000,
      breakStartedAt: null,
      breakDone: false,
      summary: null
    },
    dayTotals: { "0": 60_000 }
  };
}

const EMPTY = { config: defaultFocusConfig(), session: null, dayTotals: {} };

describe("createFocusStore", () => {
  it("reads defaults from empty storage", () => {
    const store = createFocusStore(createMockStorage());
    expect(store.read()).toEqual(EMPTY);
  });

  it("round-trips a full state through storage", () => {
    const store = createFocusStore(createMockStorage());
    store.write(fullState());
    expect(store.read()).toEqual(fullState());
  });

  it("recovers gracefully from malformed persisted JSON", () => {
    const storage = createMockStorage();
    storage.setItem(FOCUS_STORAGE_KEY, "{{{ nope");
    const store = createFocusStore(storage);
    expect(store.read()).toEqual(EMPTY);
  });

  it("falls back to in-memory when storage is blocked", () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      }
    };
    const store = createFocusStore(blocked);
    expect(store.read()).toEqual(EMPTY);
    store.write(fullState());
    expect(store.read()).toEqual(fullState());
  });

  it("clears persisted and in-memory state", () => {
    const storage = createMockStorage();
    const store = createFocusStore(storage);
    store.write(fullState());
    store.clear();
    expect(store.read()).toEqual(EMPTY);
    expect(storage.getItem(FOCUS_STORAGE_KEY)).toBeNull();
  });

  it("supports storage-less (SSR) operation via memory", () => {
    const store = createFocusStore(null);
    store.write(fullState());
    expect(store.read()).toEqual(fullState());
  });
});
