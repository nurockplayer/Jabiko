import { readStored, writeStored } from "./safeStorage";
import type { JlptLevel } from "./types";

export const KANJI_LEVEL_KEY = "jabiko:kanjiLevel";
export const KANJI_LAST_READ_KEY = "jabiko:kanjiLastRead";

export type KanjiLevelFilter = JlptLevel | "all";

const LEVEL_FILTERS: readonly KanjiLevelFilter[] = ["all", "N5", "N4", "N3", "N2", "N1"];

function isLevelFilter(value: string): value is KanjiLevelFilter {
  return (LEVEL_FILTERS as readonly string[]).includes(value);
}

export function readKanjiLevel(defaultLevel: KanjiLevelFilter): KanjiLevelFilter | null {
  const raw = readStored(KANJI_LEVEL_KEY);
  if (raw === null) return null;
  const [storedDefault, storedLevel, extra] = raw.split("|");
  if (extra !== undefined || storedDefault !== defaultLevel || !isLevelFilter(storedLevel)) {
    return null;
  }
  return storedLevel;
}

export function writeKanjiLevel(
  defaultLevel: KanjiLevelFilter,
  level: KanjiLevelFilter
): void {
  writeStored(KANJI_LEVEL_KEY, `${defaultLevel}|${level}`);
}

export function readLastReadKanji(currentBank: ReadonlySet<string>): string | null {
  const stored = readStored(KANJI_LAST_READ_KEY);
  if (stored === null || [...stored].length !== 1 || !currentBank.has(stored)) {
    return null;
  }
  return stored;
}

export function writeLastReadKanji(kanji: string): void {
  if ([...kanji].length !== 1) return;
  writeStored(KANJI_LAST_READ_KEY, kanji);
}
