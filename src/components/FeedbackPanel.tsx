import { CheckCircle2, XCircle } from "lucide-react";
import { copy, type Language } from "../i18n";
import { lookupWordsByReading } from "../domain/readingLookup";
import { lookupPatternMeaning } from "../domain/patternMeaning";
import type { Feedback } from "./types";

// Post-answer panel: shows correct/incorrect/revealed status, the
// accepted answer(s), the explanation, an example sentence, and -- where
// it helps -- what each distractor option actually was (the word a
// reading spells, or a grammar pattern's meaning).
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
  // Post-answer JLPT level tag (N1/N2/N3) for items that carry one -- exam
  // questions + JLPT vocab. Shown only here, never pre-answer, so it can't
  // tip off the question. Basic/cloze/pattern items have no level -> hidden.
  const level = feedback.question.vocabulary.level;

  // Annotate the distractors so a wrong pick teaches something. NOTE all
  // exam items default targetForm to "reading", so we gate on promptLabel,
  // not targetForm, to tell reading drills from grammar items.
  const promptLabel = feedback.question.promptLabel ?? "";
  const answers = new Set(feedback.question.expectedAnswers);
  const distractors = options.filter((option) => !answers.has(option));

  // Reading drills (vocab 単字 = no promptLabel; exam 漢字読み): options are
  // bare kana, so show the word each reads and flag any reading that
  // matches no real word.
  const isReadingGloss =
    promptLabel === "漢字読み" || (promptLabel === "" && feedback.question.targetForm === "reading");
  // Grammar-form items: options are patterns, so show each pattern's gloss.
  const isGrammarGloss = promptLabel === "文法形式選擇" || promptLabel === "文章脈絡";

  // One gloss string PER distractor, rendered one-per-line, so a long
  // option list stays readable on mobile instead of wrapping mid-item.
  let distractorGlosses: string[] = [];
  if (isReadingGloss) {
    distractorGlosses = distractors.map((reading) => {
      const words = lookupWordsByReading(reading);
      return `${reading}（${words.length > 0 ? words.join("／") : t.feedbackNoWord}）`;
    });
  } else if (isGrammarGloss) {
    const glossed = distractors.map((pattern) => ({ pattern, meaning: lookupPatternMeaning(pattern) }));
    // Only show the block if the bank knew at least one pattern -- otherwise
    // it would just re-list the options with no added information.
    if (glossed.some((entry) => entry.meaning)) {
      distractorGlosses = glossed.map((entry) =>
        entry.meaning ? `${entry.pattern}（${entry.meaning}）` : entry.pattern
      );
    }
  }

  return (
    <section className={`feedback ${isCorrect ? "correct" : isRevealed ? "revealed" : "incorrect"}`} aria-live="polite">
      <div className="feedback-title">
        <Icon aria-hidden="true" />
        <h2>{title}</h2>
        {level ? (
          <span className="feedback-level" title={`JLPT ${level}`} aria-label={`JLPT ${level}`}>
            {level}
          </span>
        ) : null}
      </div>
      <p className="answer-key">{t.answerKey}：{feedback.question.expectedAnswers.join(" / ")}</p>
      <p>{feedback.question.explanation}</p>
      {distractorGlosses.length > 0 ? (
        <div className="distractor-gloss">
          <p className="distractor-gloss-label">{t.feedbackOtherOptions}：</p>
          <ul className="distractor-gloss-list">
            {distractorGlosses.map((gloss) => (
              <li key={gloss}>{gloss}</li>
            ))}
          </ul>
        </div>
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
