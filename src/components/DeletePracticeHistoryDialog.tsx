import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { HistoryDeletionStatus } from "../hooks/useProgressAttempts";

// #693: confirmation dialog for deleting the signed-in account's synced
// practice history (#692 protocol). A destructive action gets an honest,
// double-confirm UX:
//   - The dialog explicitly lists what IS deleted (synced practice answers,
//     this device's practice records + weak-point/review progress) and what is
//     NOT (account, bookmarks, language & appearance settings).
//   - Confirm stays disabled until the learner ticks "I understand this is
//     irreversible".
//   - While the deletion runs (`deleting`) every control locks -- no repeat
//     operation, no mid-flight close.
//   - onConfirm()===true closes + resets + returns focus (the caller renders
//     the localized success status); ===false keeps the dialog open, shows a
//     retryable error and moves focus to it. Success is never rendered on a
//     failed delete.
//   - Cancel / Escape / backdrop click are side-effect-free and only honoured
//     when not deleting.
// A single instance is shared by the desktop heading-auth entry and the mobile
// 更多 menu; the caller owns the single returnFocusRef.

export type DeletePracticeHistoryCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmDeleting: string;
  cancelLabel: string;
  /** Accessible name for the X close control (distinct from the visible 取消 button). */
  closeLabel: string;
  checkboxLabel: string;
  /** Rendered by the CALLER as an aria-live status after a successful delete. */
  success: string;
  /** Retryable error shown inside the dialog when onConfirm() returns false. */
  error: string;
};

export type DeletePracticeHistoryDialogProps = {
  open: boolean;
  status: HistoryDeletionStatus;
  onConfirm: () => Promise<boolean>;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  copy: DeletePracticeHistoryCopy;
};

export function DeletePracticeHistoryDialog({
  open,
  status,
  onConfirm,
  onClose,
  returnFocusRef,
  copy
}: DeletePracticeHistoryDialogProps) {
  const [understood, setUnderstood] = useState(false);
  const [localError, setLocalError] = useState(false);
  const deleting = status === "deleting";
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();

  // Initial focus into the dialog whenever it opens (div is tabIndex=-1 so
  // calling .focus() never adds it to the tab order). Runs on commit so no
  // state write in render.
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
  }, [open]);

  // Every close (cancel / Escape / backdrop / successful confirm) resets the
  // checkbox + local error and returns focus to the trigger. `deleting` is
  // excluded from the deps on purpose: mid-flight we never reset or return
  // focus, and an in-flight state flip to "deleting" must not re-run this.
  useEffect(() => {
    if (!open && !deleting) {
      setUnderstood(false);
      setLocalError(false);
      returnFocusRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A failed confirm moves focus to the error region so assistive tech lands
  // on the retryable message.
  useEffect(() => {
    if (open && localError) {
      document.getElementById(errorId)?.focus();
    }
  }, [localError, open, errorId]);

  const handleConfirm = useCallback(async () => {
    const ok = await onConfirm();
    if (ok) {
      onClose();
    } else {
      setLocalError(true);
    }
  }, [onConfirm, onClose]);

  // Escape + backdrop click close only when idle/error (never while deleting).
  useEffect(() => {
    if (!open || deleting) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, deleting, onClose]);

  // Focus trap: while open, Tab/Shift+Tab stay inside the dialog. Disabled
  // controls are skipped so the checkbox never traps when confirm is gated.
  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = [...dialog.querySelectorAll<HTMLElement>(
      'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter(
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

  if (!open) {
    return null;
  }

  return (
    <div
      className="delete-history-overlay"
      role="presentation"
      onClick={deleting ? undefined : onClose}
    >
      <div
        ref={dialogRef}
        className="delete-history-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={deleting}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onDialogKeyDown}
      >
        <div className="delete-history-head">
          <h2 id={titleId} className="delete-history-title">
            {copy.title}
          </h2>
          <button
            type="button"
            className="delete-history-close"
            aria-label={copy.closeLabel}
            disabled={deleting}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <p className="delete-history-body">{copy.description}</p>

        {localError ? (
          <p id={errorId} className="delete-history-error" role="alert" tabIndex={-1}>
            <AlertTriangle aria-hidden="true" />
            {copy.error}
          </p>
        ) : null}

        <label className="delete-history-check">
          <input
            type="checkbox"
            checked={understood}
            disabled={deleting}
            onChange={(event) => setUnderstood(event.target.checked)}
          />
          {copy.checkboxLabel}
        </label>

        <div className="delete-history-actions">
          <button
            type="button"
            className="ghost-button"
            disabled={deleting}
            onClick={onClose}
          >
            {copy.cancelLabel}
          </button>
          <button
            type="button"
            className="delete-history-confirm"
            disabled={!understood || deleting}
            onClick={() => void handleConfirm()}
          >
            <Trash2 aria-hidden="true" />
            {deleting ? copy.confirmDeleting : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
