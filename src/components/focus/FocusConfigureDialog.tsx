// FocusConfigureDialog (#771): the simple first-version duration configuration
// (no preset system). Two bounded number inputs plus start/cancel. The Start
// button is gated on a valid config so the persisted durations can never be
// out of range or malformed.
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { Play, X } from "lucide-react";
import { sanitizeFocusConfig, type FocusConfig } from "../../domain/focus";

export type FocusConfigureDialogCopy = {
  title: string;
  focusMinutes: string;
  breakMinutes: string;
  start: string;
  close: string;
};

export function FocusConfigureDialog({
  open,
  defaultFocusMinutes,
  defaultBreakMinutes,
  onStart,
  onClose,
  returnFocusRef,
  copy
}: {
  open: boolean;
  defaultFocusMinutes: number;
  defaultBreakMinutes: number;
  onStart: (config: FocusConfig) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  copy: FocusConfigureDialogCopy;
}) {
  if (!open) return null;
  return (
    <OpenFocusConfigureDialog
      defaultFocusMinutes={defaultFocusMinutes}
      defaultBreakMinutes={defaultBreakMinutes}
      onStart={onStart}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      copy={copy}
    />
  );
}

function OpenFocusConfigureDialog({
  defaultFocusMinutes,
  defaultBreakMinutes,
  onStart,
  onClose,
  returnFocusRef,
  copy
}: {
  defaultFocusMinutes: number;
  defaultBreakMinutes: number;
  onStart: (config: FocusConfig) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  copy: FocusConfigureDialogCopy;
}) {
  const [focusMinutes, setFocusMinutes] = useState(defaultFocusMinutes);
  const [breakMinutes, setBreakMinutes] = useState(defaultBreakMinutes);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const focusId = useId();
  const breakId = useId();

  const config = sanitizeFocusConfig({ focusMinutes, breakMinutes });

  useEffect(() => {
    const returnFocusTarget = returnFocusRef.current;
    dialogRef.current?.focus();
    return () => {
      returnFocusTarget?.focus();
    };
  }, [returnFocusRef]);

  // Escape closes the configuration dialog (unlike the soft-strict break
  // surface, this is a plain settings dialog).
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

  const handleStart = () => {
    if (config) {
      onStart(config);
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

        <div className="focus-dialog-fields">
          <label className="focus-field" htmlFor={focusId}>
            {copy.focusMinutes}
          </label>
          <input
            id={focusId}
            type="number"
            min={1}
            max={120}
            inputMode="numeric"
            value={Number.isNaN(focusMinutes) ? "" : focusMinutes}
            onChange={(event) => setFocusMinutes(event.target.valueAsNumber)}
          />
          <label className="focus-field" htmlFor={breakId}>
            {copy.breakMinutes}
          </label>
          <input
            id={breakId}
            type="number"
            min={1}
            max={60}
            inputMode="numeric"
            value={Number.isNaN(breakMinutes) ? "" : breakMinutes}
            onChange={(event) => setBreakMinutes(event.target.valueAsNumber)}
          />
        </div>

        <div className="focus-dialog-actions">
          <button
            type="button"
            className="ghost-button"
            disabled={!config}
            onClick={handleStart}
          >
            <Play aria-hidden="true" />
            {copy.start}
          </button>
        </div>
      </div>
    </div>
  );
}
