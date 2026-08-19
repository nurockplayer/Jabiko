// FocusBreakOverlay (#771): the soft-strict full-screen break surface shown
// when focus time expires. It interrupts active study (the overlay is modal)
// but never traps the learner: Skip break / End Focus Mode are always
// available, and Escape intentionally does NOT dismiss it (a stray Escape must
// not silently swallow the break boundary). Dialog/focus-trap behaviour mirrors
// DeletePracticeHistoryDialog. When no attempt data exists for the focus
// (non-question learning surfaces), the summary section is omitted rather than
// showing empty metrics.
import { useEffect, useId, useRef, type RefObject } from "react";
import { Coffee, Play, X } from "lucide-react";
import { isFocusBreakAdEligible } from "../../domain/adEligibility";
import { AdSensePlacement } from "../ads/AdSensePlacement";
import { formatFocusClock } from "./formatFocusClock";

export interface FocusBreakSummaryData {
  /** Actual completed focus minutes this cycle (capped at the configured duration). */
  focusDurationMin: number;
  answered: number;
  accuracy: number;
  /** Today's accumulated completed focus minutes. */
  dayFocusedMin: number;
}

export type FocusBreakOverlayCopy = {
  title: string;
  restPrompt: string;
  skipBreak: string;
  nextCycle: string;
  endMode: string;
  summaryFocus: string;
  summaryQuestions: string;
  summaryAccuracy: string;
  summaryToday: string;
  advertisement: string;
};

export function FocusBreakOverlay({
  open,
  breakRemainingMs,
  breakDone,
  summary,
  onSkip,
  onEnd,
  returnFocusRef,
  copy
}: {
  open: boolean;
  breakRemainingMs: number;
  breakDone: boolean;
  summary: FocusBreakSummaryData | null;
  onSkip: () => void;
  onEnd: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  copy: FocusBreakOverlayCopy;
}) {
  if (!open) return null;
  return (
    <OpenFocusBreakOverlay
      breakRemainingMs={breakRemainingMs}
      breakDone={breakDone}
      summary={summary}
      onSkip={onSkip}
      onEnd={onEnd}
      returnFocusRef={returnFocusRef}
      copy={copy}
    />
  );
}

function OpenFocusBreakOverlay({
  breakRemainingMs,
  breakDone,
  summary,
  onSkip,
  onEnd,
  returnFocusRef,
  copy
}: {
  breakRemainingMs: number;
  breakDone: boolean;
  summary: FocusBreakSummaryData | null;
  onSkip: () => void;
  onEnd: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  copy: FocusBreakOverlayCopy;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const returnFocusTarget = returnFocusRef.current;
    dialogRef.current?.focus();
    return () => {
      returnFocusTarget?.focus();
    };
  }, [returnFocusRef]);

  // Focus trap: Tab/Shift+Tab stay inside the break surface.
  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = [
      ...dialog.querySelectorAll<HTMLElement>(
        'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ].filter(
      (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true"
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const clock = formatFocusClock(breakRemainingMs);
  const primaryActionLabel = breakDone ? copy.nextCycle : copy.skipBreak;

  return (
    <div className="focus-break-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="focus-break-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
      >
        <div className="focus-break-head">
          <Coffee aria-hidden="true" className="focus-break-icon" />
          <h2 id={titleId} className="focus-break-title">
            {copy.title}
          </h2>
        </div>

        <p className="focus-break-clock" aria-live="off">
          {clock}
        </p>

        <p className="focus-break-rest">{copy.restPrompt}</p>

        <AdSensePlacement
          placement="focus-break"
          eligible={summary !== null && isFocusBreakAdEligible(summary)}
          label={copy.advertisement}
        />

        {summary ? (
          <dl className="focus-summary">
            <div className="focus-summary-item">
              <dt>{copy.summaryFocus}</dt>
              <dd>{summary.focusDurationMin}</dd>
            </div>
            <div className="focus-summary-item">
              <dt>{copy.summaryQuestions}</dt>
              <dd>{summary.answered}</dd>
            </div>
            <div className="focus-summary-item">
              <dt>{copy.summaryAccuracy}</dt>
              <dd>{summary.accuracy}%</dd>
            </div>
            <div className="focus-summary-item">
              <dt>{copy.summaryToday}</dt>
              <dd>{summary.dayFocusedMin}</dd>
            </div>
          </dl>
        ) : null}

        <div className="focus-break-actions">
          <button type="button" className="ghost-button" onClick={onEnd}>
            <X aria-hidden="true" />
            {copy.endMode}
          </button>
          <button type="button" className="focus-break-primary" onClick={onSkip}>
            <Play aria-hidden="true" />
            {primaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
