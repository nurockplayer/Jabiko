import { useEffect, useState } from "react";
import type { FuriganaSegment } from "../domain/furigana";

type LearningMap = Record<string, FuriganaSegment[]>;

/** Load the small authored-world map only when furigana is enabled in /game. */
export function useLearningFuriganaMap(enabled: boolean): LearningMap | null {
  const [map, setMap] = useState<LearningMap | null>(null);
  useEffect(() => {
    if (!enabled || map != null) return;
    let active = true;
    void import("../domain/gameWorldContent/rainyMondayFurigana")
      .then((module) => {
        if (active) setMap(module.rainyMondayFurigana);
      })
      .catch(() => {
        if (active) setMap({});
      });
    return () => { active = false; };
  }, [enabled, map]);
  return enabled ? map : null;
}
