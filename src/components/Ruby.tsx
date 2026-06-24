import { createContext, Fragment, useContext } from "react";
import { furiganaData } from "../domain/furiganaData";

// Broadcasts the global furigana toggle to every <Ruby> without prop
// drilling. Default OFF so a <Ruby> rendered with no provider (and the
// realistic exam condition) shows plain text. App supplies the live value
// from useFurigana.
export const FuriganaContext = createContext<{ enabled: boolean }>({ enabled: false });

// Renders a pre-baked Japanese string, adding <ruby> furigana over its
// kanji runs -- but ONLY when the global toggle is on AND this call site
// allows it. Falls back to plain text when furigana is disabled, when
// `plain` is set (reading items must never reveal the answer, #134), or
// when the string has no pre-baked entry. Zero runtime tokenisation: it
// only reads the build-time table (src/domain/furiganaData.ts).
export function Ruby({ text, plain = false }: { text: string; plain?: boolean }) {
  const { enabled } = useContext(FuriganaContext);
  const segments = furiganaData[text];

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
