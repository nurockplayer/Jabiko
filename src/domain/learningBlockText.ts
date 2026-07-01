import type { LearningBlock } from "./learningBlocks";
import type { LocaleCode } from "./types";

/**
 * Read-path helpers for the study-chapter (學習) text overlays. Kept in this
 * tiny, DATA-FREE module so the eager `LearningPanel` can import the functions
 * without pulling the heavy per-locale translation record into the initial
 * bundle -- that record lives in `learningBlocks.i18n.ts` and is dynamically
 * imported by the panel at runtime.
 *
 * Only learner-facing CHINESE prose is localized. Japanese teaching material
 * (`subtitle`, each `examples[].formula`) and all logic fields are never
 * overlaid.
 */
export type LearningBlockText = {
  category?: string;
  kicker?: string;
  title?: string;
  explanation?: string;
  drillNote?: string;
  /** Aligned by index with the block's `examples[]`; `null`/blank -> source note. */
  notes?: (string | null)[];
  /** Aligned by index with the block's `pitfalls[]`; blank -> source. */
  pitfalls?: string[];
};

export type LearningBlockOverlays = Record<string, Partial<Record<LocaleCode, LearningBlockText>>>;

const pick = (value: string | null | undefined, source: string): string =>
  typeof value === "string" && value.trim() !== "" ? value : source;

const pickOptional = (
  value: string | null | undefined,
  source: string | undefined
): string | undefined => (typeof value === "string" && value.trim() !== "" ? value : source);

/**
 * Return a copy of `block` with its Chinese text fields replaced by the `lang`
 * overlay from `overlays`, falling back to the source per field (and per array
 * index). Returns the source block untouched when there is no overlay for its
 * id/locale (so before the overlay chunk loads, the chapter reads in zh).
 */
export function localizeLearningBlock(
  block: LearningBlock,
  lang: LocaleCode,
  overlays: LearningBlockOverlays
): LearningBlock {
  const text = overlays[block.id]?.[lang];
  if (!text) return block;
  return {
    ...block,
    category: pick(text.category, block.category),
    kicker: pickOptional(text.kicker, block.kicker),
    title: pick(text.title, block.title),
    explanation: pick(text.explanation, block.explanation),
    drillNote: pickOptional(text.drillNote, block.drillNote),
    examples: block.examples.map((example, i) => {
      if (example.note == null) return example; // never invent a note the source lacks
      const note = pick(text.notes?.[i], example.note);
      return note === example.note ? example : { ...example, note };
    }),
    pitfalls: block.pitfalls?.map((pitfall, i) => pick(text.pitfalls?.[i], pitfall))
  };
}

/**
 * Localized category label for a chapter-list group header. Groups are keyed on
 * the source category (stable), so this resolves the display string from any
 * block that carries the category via its own overlay.
 */
export function localizeCategory(
  sourceCategory: string,
  lang: LocaleCode,
  blocks: LearningBlock[],
  overlays: LearningBlockOverlays
): string {
  const owner = blocks.find((b) => b.category === sourceCategory);
  const text = owner ? overlays[owner.id]?.[lang] : undefined;
  return pick(text?.category, sourceCategory);
}
