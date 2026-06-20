import { jlptVocabulary } from "./vocabulary-jlpt";
import { vocabulary } from "./vocabulary";

// reading (kana) -> the distinct surface forms that carry that reading,
// across the JLPT + basic vocab. Used post-answer to tell the learner
// what each reading distractor actually was (e.g. たいしょう -> 対象),
// turning a wrong pick into a vocab review. Built once at module load;
// this module only loads inside the lazy challenge chunk.
const readingToSurfaces = new Map<string, string[]>();
for (const item of [...jlptVocabulary, ...vocabulary]) {
  const surfaces = readingToSurfaces.get(item.reading) ?? [];
  if (!surfaces.includes(item.surface)) {
    surfaces.push(item.surface);
  }
  readingToSurfaces.set(item.reading, surfaces);
}

/**
 * Surface forms in the bank that have this reading. Empty array when the
 * reading matches no known word -- the caller marks those as "no word".
 */
export function lookupWordsByReading(reading: string): string[] {
  return readingToSurfaces.get(reading) ?? [];
}
