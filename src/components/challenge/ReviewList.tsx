import { copy, type Language } from "../../i18n";
import type { PracticeSession } from "../../hooks/usePracticeSession";

// The 錯題複習 list: the heading plus the running list of questions the
// learner has missed this session (or the "no mistakes" line). Pure
// presentation over the session's mistakeQuestions; extracted from
// ChallengePanel with no behavioural change.
export function ReviewList({
  language,
  mistakeQuestions
}: Pick<PracticeSession, "mistakeQuestions"> & { language: Language }) {
  const t = copy[language];

  return (
    <>
      <div className="review-heading">
        <h2>{t.mistakeReview}</h2>
      </div>
      {mistakeQuestions.length > 0 ? (
        <ul>
          {mistakeQuestions.map((question) => (
            <li key={question.id}>
              {question.vocabulary.surface} {"->"} {question.promptLabel ?? t.targetForms[question.targetForm]}
            </li>
          ))}
        </ul>
      ) : (
        <p>{t.noMistakes}</p>
      )}
    </>
  );
}
