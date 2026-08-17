// FocusActiveDialog (#771): the menu behind the active countdown pill. It lets
// the learner end Focus Mode mid-cycle -- skip/end must always be reachable --
// without leaving the current learning surface.
import { useEffect, useId, useRef, type RefObject } from "react";
import { X } from "lucide-react";
import { formatFocusClock } from "./formatFocusClock";

export type FocusActiveDialogCopy = {
  title: string;
  remainingLabel: string;
  cycleLabel: (cycle: number) => string;
  endMode: string;
  close: string;
};

export function FocusActiveDialog({
  open,
  cycle,
  remainingMs,
  onEnd,
  onClose,
  returnFocusRef,
  copy
}: {
  open: boolean;
  cycle: number;
  remainingMs: number;
  onEnd: () => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  copy: FocusActiveDialogCopy;
}) {
  if (!open) return null;
  return (
    <OpenFocusActiveDialog
      cycle={cycle}
      remainingMs={remainingMs}
      onEnd={onEnd}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      copy={copy}
    />
  );
}

function OpenFocusActiveDialog({
  cycle,
  remainingMs,
  onEnd,
  onClose,
  returnFocusRef,
  copy
}: {
  cycle: number;
  remainingMs: number;
  onEnd: () => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  copy: FocusActiveDialogCopy;
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  return (
    <div className="focus-dialog-overlay" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="focus-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onDialogKeyDown}
      >
        <div className="focus-dialog-head">
          <h2 id={titleId} className="focus-dialog-title">
            {copy.title}
          </h2>
          <button
            type="button"
            className="focus-dialog-close"
            aria-label={copy.close}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <p className="focus-active-meta">
          <span className="focus-active-cycle">{copy.cycleLabel(cycle)}</span>
          <span className="focus-active-sep"> · </span>
          <span className="focus-active-remaining">
            <span className="focus-active-remaining-label">{copy.remainingLabel}</span>{" "}
            <span className="focus-active-clock">{formatFocusClock(remainingMs)}</span>
          </span>
        </p>

        <div className="focus-dialog-actions">
          <button type="button" className="focus-break-primary" onClick={onEnd}>
            {copy.endMode}
          </button>
        </div>
      </div>
    </div>
  );
}
