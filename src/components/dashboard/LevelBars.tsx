// Per-JLPT-level accuracy bars for the home dashboard (#243). Pure
// presentational: takes the perLevel slice of computeProgressStats and draws
// one labelled horizontal bar per level. Tokenised colours (home.css); no deps.
import type { LevelStat } from "../../domain/stats";

export function LevelBars({
  levels,
  caption,
  answeredLabel
}: {
  levels: LevelStat[];
  caption: string;
  answeredLabel: (count: number) => string;
}) {
  if (levels.length === 0) return null;

  return (
    <div className="level-bars" role="group" aria-label={caption}>
      <p className="level-bars-caption">{caption}</p>
      <ul className="level-bars-list">
        {levels.map((stat) => (
          <li className="level-bar-row" key={stat.level}>
            <span className="level-bar-tag">{stat.level}</span>
            <span
              className="level-bar-track"
              role="progressbar"
              aria-valuenow={stat.accuracy}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${stat.level} ${stat.accuracy}%`}
            >
              <span className="level-bar-fill" style={{ width: `${stat.accuracy}%` }} />
            </span>
            <span className="level-bar-value">
              {stat.accuracy}%
              <small>{answeredLabel(stat.answered)}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
