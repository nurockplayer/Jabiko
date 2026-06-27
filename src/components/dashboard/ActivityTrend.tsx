// Daily practice-volume bar strip for the home dashboard (#243). Pure
// presentational: takes the dense TrendPoint[] from computeActivityTrend and
// draws one bar per day, height scaled to the busiest day. Honest label:
// this is attempts-per-day (題數), not study time. Tokenised colours; no deps.
import type { TrendPoint } from "../../domain/analytics/trend";

export function ActivityTrend({
  points,
  title,
  rangeLabel,
  dayLabel
}: {
  points: TrendPoint[];
  title: string;
  rangeLabel: string;
  /** Builds the per-bar tooltip, e.g. (date, count) => "2026-06-27：8 題". */
  dayLabel: (date: string, count: number) => string;
}) {
  if (points.length === 0) return null;

  // Scale against the busiest day; floor at 1 so an all-zero week doesn't /0.
  const peak = Math.max(1, ...points.map((p) => p.attempts));

  return (
    <div className="activity-trend" role="group" aria-label={title}>
      <div className="activity-trend-head">
        <span className="activity-trend-title">{title}</span>
        <span className="activity-trend-range">{rangeLabel}</span>
      </div>
      <ol className="activity-trend-bars">
        {points.map((point) => (
          <li
            key={point.dayBucket}
            className={`activity-trend-bar${point.attempts === 0 ? " is-empty" : ""}`}
            title={dayLabel(point.date, point.attempts)}
          >
            <span
              className="activity-trend-bar-fill"
              style={{ height: `${(point.attempts / peak) * 100}%` }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
