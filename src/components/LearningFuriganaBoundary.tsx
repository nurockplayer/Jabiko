import { useContext, useEffect, useState } from "react";
import type { FuriganaSegment } from "../domain/furigana";
import { loadLearningMap } from "../domain/furiganaLearningLoader";
import { FuriganaContext } from "./furiganaContext";
import { LearningFuriganaContext } from "./learningFuriganaContext";

/**
 * Load learning-view furigana only after the learner enters /learn with the
 * global furigana toggle enabled. Children render as plain text while loading,
 * and import failures remain readable instead of breaking the lesson.
 */
export function LearningFuriganaBoundary({ children }: { children: React.ReactNode }) {
  const { enabled } = useContext(FuriganaContext);
  const [learningMap, setLearningMap] = useState<Record<
    string,
    FuriganaSegment[]
  > | null>(null);

  useEffect(() => {
    if (!enabled || learningMap) return;

    let cancelled = false;
    loadLearningMap()
      .then((map) => {
        if (!cancelled) setLearningMap(map);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [enabled, learningMap]);

  return (
    <LearningFuriganaContext.Provider value={learningMap}>
      {children}
    </LearningFuriganaContext.Provider>
  );
}
