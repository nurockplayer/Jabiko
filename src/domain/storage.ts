import type { Attempt } from "./types";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => unknown;
  removeItem: (key: string) => unknown;
}

export interface AttemptStore {
  list: () => Attempt[];
  add: (attempt: Attempt) => void;
  replace: (attempts: Attempt[]) => void;
  // True only when persistent storage confirms the attempts key is absent.
  clear: () => boolean;
}

const ATTEMPTS_KEY = "jabiko:attempts";

export function createAttemptStore(storage: StorageLike | null = browserStorage()): AttemptStore {
  let memory: Attempt[] = [];
  let useMemory = !storage;

  const read = (): Attempt[] => {
    if (useMemory || !storage) {
      return memory;
    }

    try {
      const raw = storage.getItem(ATTEMPTS_KEY);
      return raw ? (JSON.parse(raw) as Attempt[]) : [];
    } catch {
      useMemory = true;
      return memory;
    }
  };

  const write = (attempts: Attempt[]) => {
    memory = attempts;

    if (useMemory || !storage) {
      return;
    }

    try {
      storage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
    } catch {
      useMemory = true;
    }
  };

  return {
    list: read,
    add: (attempt) => write([...read(), attempt]),
    // Overwrite the whole set (memory + persisted). Used to write the
    // merged history on login sync (see useProgressAttempts / Phase 3).
    replace: (attempts) => write([...attempts]),
    clear: () => {
      memory = [];

      if (!storage) {
        return false;
      }

      try {
        storage.removeItem(ATTEMPTS_KEY);
        if (storage.getItem(ATTEMPTS_KEY) === null) {
          // Storage may have recovered after an earlier read/write failure.
          // Re-enable persistence now that absence is confirmed.
          useMemory = false;
          return true;
        }
      } catch {
        // Keep memory empty, but let the caller retain the pending marker.
      }
      useMemory = true;
      return false;
    }
  };
}

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
