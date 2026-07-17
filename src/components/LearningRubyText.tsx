import { Fragment } from "react";
import { splitQuotedTextForRuby, splitTextForRuby } from "../domain/furigana";
import type { Language } from "../i18n";
import { LearningRuby } from "./LearningRuby";

/**
 * Keep mixed-language pitfalls safe: the source Traditional Chinese prose only
 * annotates quoted Japanese, Japanese UI copy is wholly Japanese, and other
 * locales reuse the conservative mixed-text splitter used by explanations.
 */
export function LearningRubyText({ text, language }: { text: string; language: Language }) {
  if (language === "ja") return <LearningRuby text={text} />;

  const segments = language === "zh-Hant"
    ? splitQuotedTextForRuby(text)
    : splitTextForRuby(text);

  return (
    <>
      {segments.map((segment, index) =>
        segment.ruby ? (
          <LearningRuby key={index} text={segment.text} />
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        )
      )}
    </>
  );
}
