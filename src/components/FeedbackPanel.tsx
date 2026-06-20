import { CheckCircle2, XCircle } from "lucide-react";
import { copy, type Language } from "../i18n";
import { lookupWordsByReading } from "../domain/readingLookup";
import type { Feedback } from "./types";

// Post-answer panel: shows correct/incorrect/revealed status, the
// accepted answer(s), the explanation, an example sentence, and -- for
// reading drills -- what each distractor option actually was.
export function FeedbackPanel({
  feedback,
  language,
  options
}: {
  feedback: NonNullable<Feedback>;
  language: Language;
  options: string[];
}) {
  const t = copy[language];
  const isCorrect = feedback.status === "correct";
  const isRevealed = feedback.status === "revealed";
  const title = isCorrect ? t.correct : isRevealed ? t.revealed : t.incorrect;
  const Icon = isCorrect ? CheckCircle2 : XCircle;

  // For reading drills the options are bare readings, so a wrong pick
  // teaches nothing on its own. List each distractor with the word it
  // reads (たいしょう -> 対象); mark any reading that matches no real word.
  const isReading = feedback.question.targetForm === "reading";
  const answers = new Set(feedback.question.expectedAnswers);
  const distractorGloss = isReading
    ? options
        .filter((option) => !answers.has(option))
        .map((reading) => {
          const words = lookupWordsByReading(reading);
          return `${reading}（${words.length > 0 ? words.join("／") : t.feedbackNoWord}）`;
        })
        .join("・")
    : "";

  return (
    <section className={`feedback ${isCorrect ? "correct" : isRevealed ? "revealed" : "incorrect"}`} aria-live="polite">
      <div className="feedback-title">
        <Icon aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      <p className="answer-key">{t.answerKey}：{feedback.question.expectedAnswers.join(" / ")}</p>
      <p>{feedback.question.explanation}</p>
      {distractorGloss ? (
        <p className="distractor-gloss">
          {t.feedbackOtherOptions}：{distractorGloss}
        </p>
      ) : null}
      {feedback.question.vocabulary.examples[0] ? (
        <p className="example">
          {feedback.question.vocabulary.examples[0].japanese}
          <span>{feedback.question.vocabulary.examples[0].meaningZh}</span>
        </p>
      ) : null}
    </section>
  );
}
