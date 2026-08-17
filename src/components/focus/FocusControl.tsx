// FocusControl (#771): the compact app-chrome entry point. Idle it reads as a
// plain "Focus" pill that opens the configuration dialog; while a session is
// active it becomes a live countdown pill (re-derived from the absolute
// deadline) that opens the active-session menu. It never obscures primary
// navigation and carries a meaningful accessible name in both states.
import { Timer } from "lucide-react";
import type { RefObject } from "react";
import { formatFocusClock } from "./formatFocusClock";

export type FocusPhase = "idle" | "focus" | "break";

export interface FocusControlCopy {
  /** Idle pill label (e.g. "Focus"). */
  label: string;
  /** Accessible name while a session is active, parameterized with the clock. */
  remainingAria: (clock: string) => string;
}

export function FocusControl({
  phase,
  remainingMs,
  onOpenConfigure,
  onOpenActiveMenu,
  triggerRef,
  copy
}: {
  phase: FocusPhase;
  remainingMs: number;
  onOpenConfigure: () => void;
  onOpenActiveMenu: () => void;
  /** The pill button, used as the return-focus target when a dialog closes. */
  triggerRef?: RefObject<HTMLButtonElement | null>;
  copy: FocusControlCopy;
}) {
  if (phase === "idle") {
    return (
      <button
        ref={triggerRef}
        type="button"
        className="theme-toggle focus-toggle"
        aria-label={copy.label}
        onClick={onOpenConfigure}
      >
        <Timer aria-hidden="true" />
        <span className="toggle-text">{copy.label}</span>
      </button>
    );
  }

  const clock = formatFocusClock(remainingMs);
  return (
    <button
      ref={triggerRef}
      type="button"
      className="theme-toggle focus-toggle focus-toggle-active"
      aria-label={copy.remainingAria(clock)}
      onClick={onOpenActiveMenu}
    >
      <Timer aria-hidden="true" />
      <span className="focus-countdown" aria-hidden="true">
        {clock}
      </span>
    </button>
  );
}
