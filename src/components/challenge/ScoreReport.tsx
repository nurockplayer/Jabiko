import { copy, type Language } from "../../i18n";
import type { PracticeSession } from "../../hooks/usePracticeSession";
import { ShareButtons } from "./ShareButtons";

// The 今日戰報 stats block: answered / correct / review counts, the
// accuracy value, and the accuracy progress bar. Sits atop the right-hand
// 錯題複習 column (since #81). Pure presentation over the session's score
// figures; extracted from ChallengePanel with no behavioural change.
//
// `mistakeCount` is the length of the mistake-review list (shown as the
// 待複習 figure); the list itself is rendered by ReviewList alongside this.
export function ScoreReport({
  language,
  attempts,
  correctCount,
  accuracy,
  mistakeCount
}: Pick<PracticeSession, "attempts" | "correctCount" | "accuracy"> & {
  language: Language;
  mistakeCount: number;
}) {
  const t = copy[language];

  return (
    <div className="score-report" role="group" aria-label="今日戰報">
      <div className="score-strip">
        <span>
          <strong>{attempts.length}</strong>
          {t.answered}
        </span>
        <span>
          <strong>{correctCount}</strong>
          {t.correctShort}
        </span>
        <span>
          <strong>{mistakeCount}</strong>
          {t.reviewShort}
        </span>
      </div>
      <p className="score-accuracy">
        <span className="score-accuracy-label">{t.accuracyLabel}</span>
        <strong className="score-accuracy-value">{accuracy}%</strong>
      </p>
      <div
        className="score-bar"
        role="progressbar"
        aria-valuenow={accuracy}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t.accuracyLabel}
      >
        <span className="score-bar-fill" style={{ width: `${accuracy}%` }} />
      </div>
      {attempts.length > 0 ? (
        <ShareButtons language={language} text={t.shareText(attempts.length, accuracy)} />
      ) : null}
    </div>
  );
}
