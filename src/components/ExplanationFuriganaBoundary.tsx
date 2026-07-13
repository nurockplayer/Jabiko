import { useContext, useEffect, useState } from "react";
import type { FuriganaSegment } from "../domain/furigana";
import { loadExplanationMap } from "../domain/furiganaExplanationLoader";
import { ExplanationFuriganaContext } from "./explanationFuriganaContext";
import { FuriganaContext } from "./furiganaContext";

/**
 * Async boundary that loads the explanation furigana map on demand (#599).
 *
 * Loading triggers only when:
 * 1. The global furigana toggle is ON (from FuriganaContext)
 * 2. The explanation content actually has ruby-eligible Japanese text
 *    (optional — if the check is too expensive, just use condition 1)
 *
 * Children always render immediately. Before the map loads they display
 * as plain text; once loaded, the context provides the extra lookup data
 * and ruby annotations appear.
 *
 * On import failure the context stays null, keeping the text readable
 * without crashing.
 */
export function ExplanationFuriganaBoundary({
  children,
  hasJapaneseRuns
}: {
  children: React.ReactNode;
  /** Whether the wrapped explanation contains ruby-eligible Japanese. */
  hasJapaneseRuns?: boolean;
}) {
  const { enabled } = useContext(FuriganaContext);
  const [explanationMap, setExplanationMap] = useState<Record<
    string,
    FuriganaSegment[]
  > | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Only load when furigana is on AND there is text to annotate.
    if (!enabled || failed) return;
    if (hasJapaneseRuns === false) return;

    let cancelled = false;
    loadExplanationMap()
      .then((map) => {
        if (!cancelled) setExplanationMap(map);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, hasJapaneseRuns, failed]);

  return (
    <ExplanationFuriganaContext.Provider value={explanationMap}>
      {children}
    </ExplanationFuriganaContext.Provider>
  );
}
