// Focus Mode lifecycle hook (#771). Owns the persisted Focus state, the
// wall-clock display tick, and visibility recovery:
//   - State is reconciled against the absolute deadline on every tick, on
//     visibility return, and on mount, so a throttled tab, device sleep, or
//     reload folds correctly instead of restarting the clock.
//   - The UI tick runs ONLY while the document is visible (no background timer
//     loop doing work in a hidden tab); the display is re-derived from
//     `deadline - now` so it cannot drift.
//   - expiry transitions fire exactly once (domain single-fire reconcile).
// Fire-and-forget lifecycle analytics are low-cardinality metadata only.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  endFocusSession,
  focusRemainingMs,
  reconcileFocus,
  skipBreak as domainSkipBreak,
  startFocusSession,
  type FocusConfig,
  type FocusPersistedState,
  type FocusPhase,
  type FocusSummaryBaseline
} from "../domain/focus";
import { createFocusStore } from "../domain/focusStorage";
import { trackEvent } from "../lib/analytics";
import type { LocaleCode } from "../domain/types";

const focusStore = createFocusStore();

const TICK_MS = 1000;

function defaultNow(): number {
  return Date.now();
}

export interface UseFocusModeOptions {
  /** UI locale, used only for low-cardinality lifecycle analytics. */
  locale: LocaleCode;
  /** Injectable clock for deterministic tests. Defaults to Date.now. */
  now?: () => number;
}

export function useFocusMode(options: UseFocusModeOptions) {
  // Stable clock: useState initializer captures the caller's now() once (a ref
  // cannot be read during render under react-hooks v7). Effects and callbacks
  // depend on this stable value, so the interval never churns.
  const [nowFn] = useState<() => number>(() => options.now ?? defaultNow);

  const [state, setState] = useState<FocusPersistedState>(() => {
    const persisted = focusStore.read();
    return reconcileFocus(persisted, nowFn()).next;
  });
  const [now, setNow] = useState<number>(() => nowFn());
  const [visible, setVisible] = useState<boolean>(
    () => typeof document === "undefined" || !document.hidden
  );

  // Latest state for stable action callbacks (actions read config/cycle
  // without re-creating identity on every render).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist every reconciled state change (config, session, day totals).
  useEffect(() => {
    focusStore.write(state);
  }, [state]);

  // Reconcile the persisted state against a wall-clock instant and refresh the
  // display clock. Pure functional update; reconcile is single-fire.
  const applyNow = useCallback((now: number) => {
    setNow(now);
    setState((current) => reconcileFocus(current, now).next);
  }, []);

  // UI tick only while visible AND a session is active (an idle timer needs no
  // display refresh); hidden tabs do no background work at all.
  useEffect(() => {
    if (!visible || state.session === null) return;
    const id = window.setInterval(() => applyNow(nowFn()), TICK_MS);
    return () => window.clearInterval(id);
  }, [visible, nowFn, applyNow, state.session]);

  // Pause/resume ticking on visibility changes and reconcile on return so a
  // slept-through deadline folds correctly rather than restarting the clock.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      const hidden = document.hidden;
      setVisible(!hidden);
      if (!hidden) {
        applyNow(nowFn());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [nowFn, applyNow]);

  // Low-cardinality analytics: fire focus_cycle_completed exactly when a focus
  // phase folds into the break. The ref guards against a repeat fire across
  // re-renders (expiry must not double-fire).
  const prevPhaseRef = useRef<FocusPhase | null>(null);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    const current = state.session?.phase ?? "idle";
    prevPhaseRef.current = current;
    if (prev === "focus" && current === "break") {
      trackEvent("focus_cycle_completed", {
        durationMin: state.config.focusMinutes,
        locale: options.locale
      });
    }
  }, [state, options.locale]);

  const start = useCallback(
    (config: FocusConfig, baseline: FocusSummaryBaseline) => {
      const now = nowFn();
      setState((current) => startFocusSession({ ...current, config }, now, baseline));
      setNow(now);
      trackEvent("focus_started", {
        focusMin: config.focusMinutes,
        breakMin: config.breakMinutes,
        locale: options.locale
      });
    },
    [nowFn, options.locale]
  );

  const skipBreak = useCallback(
    (baseline: FocusSummaryBaseline) => {
      const now = nowFn();
      const config = stateRef.current.config;
      setState((current) => domainSkipBreak(current, now, baseline));
      setNow(now);
      trackEvent("focus_started", {
        focusMin: config.focusMinutes,
        breakMin: config.breakMinutes,
        locale: options.locale
      });
    },
    [nowFn, options.locale]
  );

  const end = useCallback(() => {
    const now = nowFn();
    const cycles = stateRef.current.session?.cycle ?? 0;
    setState((current) => endFocusSession(current, now));
    setNow(now);
    trackEvent("focus_ended", { cycles, locale: options.locale });
  }, [nowFn, options.locale]);

  const remainingMs =
    state.session === null ? 0 : focusRemainingMs(state.session, state.config, now);

  return { state, now, remainingMs, start, skipBreak, end };
}
