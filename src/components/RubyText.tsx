import { Fragment } from "react";
import { splitTextForRuby } from "../domain/furigana";
import { Ruby } from "./Ruby";

// Mixed zh/ja explanation text stays plain by default; only the detected
// Japanese spans are routed through the pre-baked Ruby renderer.
export function RubyText({ text }: { text: string }) {
  return (
    <>
      {splitTextForRuby(text).map((segment, index) =>
        segment.ruby ? (
          <Ruby key={index} text={segment.text} />
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        )
      )}
    </>
  );
}
