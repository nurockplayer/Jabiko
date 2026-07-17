import type { FuriganaSegment } from "./furigana";

type LearningMap = Record<string, FuriganaSegment[]>;

let loadPromise: Promise<LearningMap> | null = null;

/**
 * The generated learning map is reachable only through this dynamic import,
 * keeping it out of the eager LearningPanel dependency graph.
 */
export function loadLearningMap(): Promise<LearningMap> {
  if (!loadPromise) {
    loadPromise = import("./furiganaLearningData")
      .then((module) => module.furiganaLearningData)
      .catch((error) => {
        loadPromise = null;
        throw error;
      });
  }
  return loadPromise;
}

export function resetLearningLoader(): void {
  loadPromise = null;
}
