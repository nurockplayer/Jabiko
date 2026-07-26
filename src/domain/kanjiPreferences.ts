import { readStored, writeStored } from "./safeStorage";
import type { JlptLevel } from "./types";

// Page-scoped preferences for the 漢字音讀速查 table (#195), asked for by a
// learner who browses one band card by card: the page used to forget both the
// level filter and the card they were on, so every visit restarted from the
// top of their band.
//
// Deliberately tiny and crash-safe (readStored/writeStored swallow blocked
// storage): losing persistence must never cost the page.

export const KANJI_LEVEL_KEY = "jabiko.kanjiLevel";
export const KANJI_LAST_READ_KEY = "jabiko.kanjiLastRead";

export type KanjiLevelFilter = JlptLevel | "all";

const LEVEL_FILTERS: readonly string[] = ["all", "N5", "N4", "N3", "N2", "N1"];

function isLevelFilter(value: string): value is KanjiLevelFilter {
  return LEVEL_FILTERS.includes(value);
}

// The manual pick is stored WITH the band default it was made under
// ("<band>|<pick>"). The page default follows the learner's target level
// (kanjiDefaultLevel), so scoping the pick this way means changing the target
// level moves the page to the new band instead of pinning an old pick for
// good -- while browsing within one band still remembers where you were.
export function readKanjiLevel(bandDefault: KanjiLevelFilter): KanjiLevelFilter | null {
  const raw = readStored(KANJI_LEVEL_KEY);
  if (raw === null) return null;
  const separator = raw.indexOf("|");
  if (separator < 0) return null;
  const band = raw.slice(0, separator);
  const pick = raw.slice(separator + 1);
  if (band !== bandDefault) return null;
  return isLevelFilter(pick) ? pick : null;
}

export function writeKanjiLevel(bandDefault: KanjiLevelFilter, pick: KanjiLevelFilter): void {
  writeStored(KANJI_LEVEL_KEY, `${bandDefault}|${pick}`);
}

// The last card opened, so a return visit can mark where the learner stopped
// and let the arrow keys carry on from there. One character by definition --
// anything else is stale or tampered data and reads back as "none".
export function readLastReadKanji(): string | null {
  const raw = readStored(KANJI_LAST_READ_KEY);
  if (raw === null || [...raw].length !== 1) return null;
  return raw;
}

export function writeLastReadKanji(kanji: string): void {
  if ([...kanji].length !== 1) return;
  writeStored(KANJI_LAST_READ_KEY, kanji);
}
