import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { copy, type Language } from "../i18n";
import type { PracticeQuestion } from "../domain/types";
import { pickLocalized, pickLocalizedOptional } from "../domain/localizedContent";
import { shuffleOrderFragments } from "../domain/wordOrder";
import { isReadingPrompt } from "../domain/furigana";
import { Ruby } from "./Ruby";
import { SpeakButton } from "./SpeakButton";

// Renders an exam/cloze/pattern question's prompt: instruction, the
// sentence with the blank, a neutral pre-answer hint, and (when safe) a
// surface・reading・meaning vocab row.
export function ExamPrompt({ question, language }: { question: PracticeQuestion; language: Language }) {
  const t = copy[language];
  // The pre-answer hint sits behind a toggle so the learner attempts the
  // question first and reveals the hint only when stuck. Reset to hidden
  // on every question change (keyed by id) so each new question starts
  // collapsed.
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    setShowHint(false);
  }, [question.id]);

  // Sentence-pattern items use placeholder surface/reading (the pattern
  // id) which would render as a meaningless "te-kudasai・te-kudasai・..."
  // line. Skip the vocab row for those items -- the prompt label
  // already names the pattern.
  const isSentencePattern = question.vocabulary.tags?.includes("sentence_pattern");
  // ANSWER-LEAK GUARD. The surface・reading・meaning row is a genuine
  // pre-answer hint for CLOZE items (待つ -> answer 待って: surface 待つ is a
  // legit "which verb" cue). For EXAM-style items it is not: the synthetic
  // vocabulary's surface IS the grammar pattern / target word and its
  // meaningZh is the answer's own gloss, so showing it hands over the
  // answer. An exact "surface ∈ answers" check isn't enough -- it misses
  // cases where the surface only CONTAINS the answer (surface「たほうがいい」
  // vs answer「ほうがいい」, the た already sitting in the prompt「行った」),
  // which still spells it out. So hide the row for every exam-style item;
  // the full answer + meaning always show post-answer in FeedbackPanel.
  const isExamStyle = question.vocabulary.tags?.includes("exam_style");
  const answerSet = new Set(question.expectedAnswers);
  const vocabRowLeaksAnswer =
    answerSet.has(question.vocabulary.surface) || answerSet.has(question.vocabulary.reading);
  const showVocabRow = !isSentencePattern && !isExamStyle && !vocabRowLeaksAnswer;
  // Pre-answer Chinese: prefer the neutral hint when authored; fall back
  // to the full translation for items that haven't been audited yet
  // (legacy exam items). The full translation still appears in the
  // FeedbackPanel post-answer via vocabulary.examples[0].meaningZh.
  // Each Chinese field is read through its per-locale overlay (#400) so a
  // non-Chinese learner sees the target language, falling back to zh source.
  // pickLocalizedOptional keeps NULLISH (not truthy) semantics so an authored
  // empty hint still suppresses via `hint ?? context` instead of falling
  // through to the answer-leaky promptContextZh.
  const localizedHint = pickLocalizedOptional(question.hintZh, question.hintI18n, language);
  const localizedContext = pickLocalizedOptional(
    question.promptContextZh,
    question.promptContextI18n,
    language
  );
  const preAnswerHint = localizedHint ?? localizedContext;
  const instruction = pickLocalizedOptional(question.instructionZh, question.instructionI18n, language);
  const meaning = pickLocalized(
    question.vocabulary.meaningZh,
    question.vocabulary.meaningI18n,
    language
  );
  // 語順組合 prompts list their fragments in answer order (［a / b / c / d］),
  // which spells out the answer. Shuffle them at render time (seeded by id so
  // it's stable and never reshuffles mid-question). Other labels render as-is.
  const promptText =
    question.promptLabel === "語順組合" && question.promptText
      ? shuffleOrderFragments(question.promptText, question.id)
      : question.promptText;
  return (
    <>
      <p className="word-kind">
        <GraduationCap aria-hidden="true" />
        {instruction}
      </p>
      <p className="exam-prompt">
        {promptText ? (
          <>
            <Ruby text={promptText} plain={isReadingPrompt(question.promptLabel, question.targetForm)} />
            <SpeakButton text={promptText} language={language} />
          </>
        ) : null}
      </p>
      {preAnswerHint ? (
        <div className="hint-block">
          <button
            type="button"
            className="hint-toggle"
            aria-expanded={showHint}
            onClick={() => setShowHint((shown) => !shown)}
          >
            {showHint ? t.hideHint : t.showHint}
          </button>
          {showHint ? <p className="meaning">{preAnswerHint}</p> : null}
        </div>
      ) : null}
      {showVocabRow ? (
        <p className="reading">
          {question.vocabulary.surface}・{question.vocabulary.reading}・{meaning}
        </p>
      ) : null}
    </>
  );
}
