// Format a duration in milliseconds as `mm:ss` for the Focus countdown
// display. Lives outside the component files so it can be shared without
// tripping the react-refresh only-export-components rule.
export function formatFocusClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
