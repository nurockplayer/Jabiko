// Per-question-type weakness bars for the home dashboard (#243, phase 2).
// Pure presentational: takes the weakest-first QuestionTypeStat[] and draws a
// labelled bar per type, colour-banded by accuracy (weak = vermilion, mid =
// gold, strong = matcha) so the soft spots pop. Tokenised colours; no deps.
import type { QuestionTypeStat } from "../../domain/analytics/weakness";
import type { QuestionType } from "../../domain/analytics/questionType";

function band(accuracy: number): string {
  if (accuracy < 60) return "is-weak";
  if (accuracy < 80) return "is-mid";
  return "is-strong";
}

export function TypeBars({
  stats,
  caption,
  label,
  answeredLabel
}: {
  stats: QuestionTypeStat[];
  caption: string;
  label: (type: QuestionType) => string;
  answeredLabel: (count: number) => string;
}) {
  if (stats.length === 0) return null;

  return (
    <div className="type-bars" role="group" aria-label={caption}>
      <p className="type-bars-caption">{caption}</p>
      <ul className="type-bars-list">
        {stats.map((stat) => (
          <li className="type-bar-row" key={stat.type}>
            <span className="type-bar-tag">{label(stat.type)}</span>
            <span
              className="type-bar-track"
              role="progressbar"
              aria-valuenow={stat.accuracy}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label(stat.type)} ${stat.accuracy}%`}
            >
              <span
                className={`type-bar-fill ${band(stat.accuracy)}`}
                style={{ width: `${stat.accuracy}%` }}
              />
            </span>
            <span className="type-bar-value">
              {stat.accuracy}%<small>{answeredLabel(stat.answered)}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
