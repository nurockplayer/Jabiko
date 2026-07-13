import { createContext } from "react";
import type { FuriganaSegment } from "../domain/furigana";

/**
 * Scoped context for the explanation furigana map (#599).
 *
 * When set (inside ExplanationFuriganaBoundary), Ruby/RubyText check this
 * map FIRST before falling back to the global base map (furiganaData).
 *
 * null / undefined = no explanation data available (use base map only).
 */
export const ExplanationFuriganaContext = createContext<Record<
  string,
  FuriganaSegment[]
> | null>(null);
