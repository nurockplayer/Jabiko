import { createContext } from "react";
import type { FuriganaSegment } from "../domain/furigana";

/**
 * Furigana data scoped to the eager learning view (#618).
 *
 * The generated table is provided only after its lazy chunk resolves. Keeping
 * this separate from Ruby's base map prevents LearningPanel from pulling the
 * challenge furigana table into the initial bundle.
 */
export const LearningFuriganaContext = createContext<Record<
  string,
  FuriganaSegment[]
> | null>(null);
