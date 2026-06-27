// Overall-accuracy donut for the home dashboard (#243). Pure presentational:
// takes a 0-100 percent + a caption and draws an SVG ring. Colours come from
// CSS tokens (home.css) so dark mode is automatic; no chart library.
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AccuracyRing({ percent, caption }: { percent: number; caption: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="accuracy-ring" role="img" aria-label={`${caption}: ${clamped}%`}>
      <svg viewBox="0 0 120 120" className="accuracy-ring-svg" aria-hidden="true">
        <circle className="accuracy-ring-track" cx="60" cy="60" r={RADIUS} />
        {/* rotate -90 so the arc starts at 12 o'clock and grows clockwise */}
        <circle
          className="accuracy-ring-fill"
          cx="60"
          cy="60"
          r={RADIUS}
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="accuracy-ring-center">
        <strong>{clamped}%</strong>
        <small>{caption}</small>
      </div>
    </div>
  );
}
