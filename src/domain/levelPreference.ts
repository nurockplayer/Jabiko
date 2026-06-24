import { LEVEL_RANGE_OPTIONS, type LevelRange } from "./levelRange";

// The learner's single global "target level" preference (#199), chosen once
// (e.g. the first-run home card) and applied as the DEFAULT level range for
// every fresh pool (今日練習 / 単字 / 綜合考題庫). Stored locally only -- v1
// does not sync it (Supabase #151 syncs attempts only).
//
// Deliberately tiny and dependency-light: it imports ONLY the LevelRange
// type + the options constant from levelRange.ts (no question banks), so the
// eager HomePanel can read it without dragging heavy data into the initial
// bundle (see [[jabiko-bundle-codesplit]]). Crash-safe like safeStorage:
// any storage failure or unrecognised value reads back as null (= "not
// chosen yet"), so a blocked storage costs persistence, not the app.
const TARGET_LEVEL_KEY = "jabiko:targetLevel";

function isLevelRange(value: string | null): value is LevelRange {
  return value !== null && (LEVEL_RANGE_OPTIONS as readonly string[]).includes(value);
}

// The stored target level, or null when the learner hasn't chosen one (or
// storage is unavailable / holds a stale invalid value).
export function readLevelPreference(): LevelRange | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(TARGET_LEVEL_KEY);
    return isLevelRange(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeLevelPreference(range: LevelRange): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TARGET_LEVEL_KEY, range);
  } catch {
    // Persistence unavailable -- ignore so the caller still works.
  }
}
