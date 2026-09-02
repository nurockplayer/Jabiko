import type { GrammarNote } from "./grammarNotes";
import type { LocaleCode } from "./types";

/**
 * Read-path helper for the grammar-note reference overlays (#137 / #400). The
 * per-locale text lives in `grammarNotes.i18n.ts`; this module is data-free so
 * it can be imported cheaply. grammarNotes itself only loads inside the lazy
 * challenge chunk, so both are out of the eager bundle.
 *
 * Only the Chinese prose is localized. The Japanese example sentences
 * (`examples[].ja`), the point `surface`, and `jlptLevel` are never overlaid.
 */
type GrammarNoteText = {
  meaningZh?: string;
  formation?: string;
  usageZh?: string;
  /** Aligned by index with the note's `examples[]`; localizes each `.zh`. */
  examplesZh?: (string | null)[];
  /** Aligned by index with the note's `confusions[]`. */
  confusions?: string[];
};

export type GrammarNoteOverlays = Record<string, Partial<Record<LocaleCode, GrammarNoteText>>>;

const pick = (value: string | null | undefined, source: string): string =>
  typeof value === "string" && value.trim() !== "" ? value : source;

/**
 * Return a copy of `note` with its Chinese fields replaced by the `lang` overlay
 * (keyed by surface), falling back to the source per field / per array index.
 * Returns the source note untouched when there's no overlay for its surface/locale.
 */
export function localizeGrammarNote(
  note: GrammarNote,
  lang: LocaleCode,
  overlays: GrammarNoteOverlays
): GrammarNote {
  const text = overlays[note.surface]?.[lang];
  if (!text) return note;
  return {
    ...note,
    meaningZh: pick(text.meaningZh, note.meaningZh),
    formation: pick(text.formation, note.formation),
    usageZh: pick(text.usageZh, note.usageZh),
    examples: note.examples.map((example, i) => {
      const zh = pick(text.examplesZh?.[i], example.zh);
      return zh === example.zh ? example : { ...example, zh };
    }),
    confusions: note.confusions.map((confusion, i) => pick(text.confusions?.[i], confusion))
  };
}
