import { Fragment, useContext } from "react";
import { FuriganaContext } from "./furiganaContext";
import { LearningFuriganaContext } from "./learningFuriganaContext";

/**
 * Render known-Japanese learning material from the learning-only lazy map.
 * Unlike Ruby, this component deliberately has no static furiganaData import.
 */
export function LearningRuby({ text }: { text: string }) {
  const { enabled } = useContext(FuriganaContext);
  const learningMap = useContext(LearningFuriganaContext);
  const segments = learningMap?.[text];

  if (!enabled || !segments) {
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.r ? (
          <ruby key={index}>
            {segment.t}
            <rt>{segment.r}</rt>
          </ruby>
        ) : (
          <Fragment key={index}>{segment.t}</Fragment>
        )
      )}
    </>
  );
}
