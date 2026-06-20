import { GraduationCap } from "lucide-react";
import { type Language } from "../i18n";
import type { PracticeQuestion } from "../domain/types";
import { SpeakButton } from "./SpeakButton";

// Renders an exam/cloze/pattern question's prompt: instruction, the
// sentence with the blank, a neutral pre-answer hint, and (when safe) a
// surface・reading・meaning vocab row.
export function ExamPrompt({ question, language }: { question: PracticeQuestion; language: Language }) {
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
  const preAnswerHint = question.hintZh ?? question.promptContextZh;
  return (
    <>
      <p className="word-kind">
        <GraduationCap aria-hidden="true" />
        {question.instructionZh}
      </p>
      <p className="exam-prompt">
        {question.promptText}
        {question.promptText ? (
          <SpeakButton text={question.promptText} language={language} />
        ) : null}
      </p>
      {preAnswerHint ? <p className="meaning">{preAnswerHint}</p> : null}
      {showVocabRow ? (
        <p className="reading">
          {question.vocabulary.surface}・{question.vocabulary.reading}・{question.vocabulary.meaningZh}
        </p>
      ) : null}
    </>
  );
}
