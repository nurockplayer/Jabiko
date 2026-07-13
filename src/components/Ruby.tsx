import { Fragment, useContext } from "react";
import { furiganaData } from "../domain/furiganaData";
import { FuriganaContext } from "./furiganaContext";
import { ExplanationFuriganaContext } from "./explanationFuriganaContext";

// Renders a pre-baked Japanese string, adding <ruby> furigana over its
// kanji runs -- but ONLY when the global toggle is on AND this call site
// allows it. Falls back to plain text when furigana is disabled, when
// `plain` is set (reading items must never reveal the answer, #134), or
// when the string has no pre-baked entry. Zero runtime tokenisation: it
// only reads the build-time table (src/domain/furiganaData.ts).
//
// Lookup order (#599):
//   1. scoped explanation map (if inside ExplanationFuriganaBoundary)
//   2. global base map (furiganaData)
//   3. raw text (no furigana)
export function Ruby({ text, plain = false }: { text: string; plain?: boolean }) {
  const { enabled } = useContext(FuriganaContext);
  const explanationMap = useContext(ExplanationFuriganaContext);
  const segments = explanationMap?.[text] ?? furiganaData[text];

  if (!enabled || plain || !segments) {
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
