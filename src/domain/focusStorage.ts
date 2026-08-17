// Focus Mode persistence store (#771). A thin, crash-safe layer over
// localStorage (mirrors createAttemptStore in storage.ts): reading or writing
// can throw when storage is blocked or absent (SSR), so the store degrades to
// an in-memory fallback -- persistence loss never takes the app down. Parsing
// and sanitization live in the domain (parseFocusPersisted); this module only
// moves bytes in and out.
import { defaultFocusConfig, parseFocusPersisted, type FocusPersistedState } from "./focus";

export const FOCUS_STORAGE_KEY = "jabiko:pomodoro";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => unknown;
  removeItem: (key: string) => unknown;
}

export interface FocusStore {
  read: () => FocusPersistedState;
  write: (state: FocusPersistedState) => void;
  clear: () => void;
}

const EMPTY_STATE: FocusPersistedState = {
  config: defaultFocusConfig(),
  session: null,
  dayTotals: {}
};

export function createFocusStore(storage: StorageLike | null = browserStorage()): FocusStore {
  let memory: FocusPersistedState | null = null;
  let useMemory = !storage;

  const read = (): FocusPersistedState => {
    if (useMemory || !storage) {
      return memory ?? EMPTY_STATE;
    }
    try {
      return parseFocusPersisted(storage.getItem(FOCUS_STORAGE_KEY));
    } catch {
      useMemory = true;
      return memory ?? EMPTY_STATE;
    }
  };

  const write = (state: FocusPersistedState) => {
    memory = state;
    if (useMemory || !storage) {
      return;
    }
    try {
      storage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(state));
    } catch {
      useMemory = true;
    }
  };

  const clear = () => {
    memory = null;
    if (!storage || useMemory) {
      return;
    }
    try {
      storage.removeItem(FOCUS_STORAGE_KEY);
    } catch {
      useMemory = true;
    }
  };

  return { read, write, clear };
}

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}
