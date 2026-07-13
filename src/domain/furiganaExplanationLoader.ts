// Module-level async loader for the explanation furigana map (#599).
// Ensures the dynamic import fires at most once per app lifecycle
// regardless of how many components or remounts request it.
//
// The loader function is the only way the app accesses
// furiganaExplanationData — no static import from this module.
// This keeps the explanation map OUT of the initial ChallengePanel
// dependency graph; it only enters the bundle if/when the first
// dynamic import() call resolves.

import type { FuriganaSegment } from "./furigana";

type ExplanationMap = Record<string, FuriganaSegment[]>;

let loadPromise: Promise<ExplanationMap> | null = null;

/**
 * Dynamically import the explanation furigana map.
 *
 * Returns the same Promise across multiple calls (module-level cache)
 * so the chunk is fetched at most once per app lifecycle.
 */
export function loadExplanationMap(): Promise<ExplanationMap> {
  if (!loadPromise) {
    loadPromise = import("./furiganaExplanationData").then(
      (mod) => mod.furiganaExplanationData
    );
  }
  return loadPromise;
}

/**
 * Reset the cached loader promise. Only useful in tests.
 */
export function resetExplanationLoader(): void {
  loadPromise = null;
}
