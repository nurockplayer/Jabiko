// Focus Mode / Pomodoro domain (#771).
//
// A global study-focus timer, NOT a Challenge-only clock. State is modelled
// from absolute wall-clock deadlines, never accumulated interval ticks: the UI
// may refresh the display on a timer, but elapsed/remaining time is always
// derived from `deadline - now`, so a throttled tab, device sleep, or reload
// cannot drift the clock. All functions here are pure with an injectable `now`
// (same convention as srs.ts / stats.ts) so tests run on deterministic clocks.
//
// Persistence is deliberately minimal (Issue contract): configured durations,
// the current phase with its timestamps, a per-cycle attempt baseline for the
// Break summary, and per-day accumulated completed-focus time. No new remote
// data model -- the summary is a delta over Jabiko's existing local attempts.

export const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

// UI / config bounds (simple custom durations; no preset system in v1).
export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
export const MIN_FOCUS_MINUTES = 1;
export const MAX_FOCUS_MINUTES = 120;
export const MIN_BREAK_MINUTES = 1;
export const MAX_BREAK_MINUTES = 60;
// Completed-focus day buckets are retained for today and yesterday only (the
// Break surface only reports "today's accumulated focus time"); anything older
// is pruned on write so the store cannot grow unbounded.
const DAY_TOTAL_RETENTION = 1;

export type FocusPhase = "idle" | "focus" | "break";

export interface FocusConfig {
  focusMinutes: number;
  breakMinutes: number;
}

/** Attempt totals captured when a focus cycle starts; the Break summary is the
 *  delta between this baseline and the totals at focus completion. */
export interface FocusSummaryBaseline {
  answered: number;
  correct: number;
}

export interface FocusSessionState {
  phase: FocusPhase;
  /** 1-based number of the current focus cycle within this Focus Mode run. */
  cycle: number;
  /** Wall-clock start of the current focus phase (ms epoch), null outside focus. */
  focusStartedAt: number | null;
  /** Wall-clock start of the current break phase (ms epoch), null outside break. */
  breakStartedAt: number | null;
  /** True once the break's deadline passed; the surface then offers the next cycle. */
  breakDone: boolean;
  /** Attempt baseline for the CURRENT focus cycle (set at cycle start). */
  summary: FocusSummaryBaseline | null;
}

/** Completed focus time (ms) bucketed by UTC day index (stats.ts convention). */
export type FocusDayTotals = Record<string, number>;

export interface FocusPersistedState {
  config: FocusConfig;
  session: FocusSessionState | null;
  dayTotals: FocusDayTotals;
}

export type FocusTransition = "none" | "focus-completed" | "break-completed";

export function defaultFocusConfig(): FocusConfig {
  return { focusMinutes: DEFAULT_FOCUS_MINUTES, breakMinutes: DEFAULT_BREAK_MINUTES };
}

/**
 * Validate persisted/config durations. Returns null for anything malformed or
 * out of range so the app fails safe to the default (never crashes on bad
 * localStorage state).
 */
export function sanitizeFocusConfig(value: unknown): FocusConfig | null {
  if (typeof value !== "object" || value === null) return null;
  const { focusMinutes, breakMinutes } = value as Record<string, unknown>;
  if (!isValidMinutes(focusMinutes, MIN_FOCUS_MINUTES, MAX_FOCUS_MINUTES)) return null;
  if (!isValidMinutes(breakMinutes, MIN_BREAK_MINUTES, MAX_BREAK_MINUTES)) return null;
  return { focusMinutes, breakMinutes };
}

function isValidMinutes(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

/** A fresh focus cycle. `overrides` is a test/derivation seam only. */
export function createFocusSession(now: number, overrides: Partial<FocusSessionState> = {}): FocusSessionState {
  return {
    phase: "focus",
    cycle: 1,
    focusStartedAt: now,
    breakStartedAt: null,
    breakDone: false,
    summary: null,
    ...overrides
  };
}

/**
 * Validate a persisted session shape. Returns null for anything malformed so
 * recovery fails safe to "no active session" instead of crashing. A focus
 * session must carry its start timestamp, a break its own; timestamps are
 * normalized to the phase's own field.
 */
export function sanitizeFocusSession(value: unknown): FocusSessionState | null {
  if (typeof value !== "object" || value === null) return null;
  const { phase, cycle, focusStartedAt, breakStartedAt, breakDone, summary } = value as Record<
    string,
    unknown
  >;
  if (phase !== "focus" && phase !== "break") return null;
  if (typeof cycle !== "number" || !Number.isInteger(cycle) || cycle < 1) return null;
  if (typeof breakDone !== "boolean") return null;
  if (
    phase === "focus" &&
    (typeof focusStartedAt !== "number" || !Number.isFinite(focusStartedAt))
  ) {
    return null;
  }
  if (
    phase === "break" &&
    (typeof breakStartedAt !== "number" || !Number.isFinite(breakStartedAt))
  ) {
    return null;
  }
  const sanitizedSummary = sanitizeBaseline(summary);
  if (summary !== null && summary !== undefined && sanitizedSummary === null) {
    return null;
  }
  return {
    phase,
    cycle,
    focusStartedAt: phase === "focus" ? (focusStartedAt as number) : null,
    breakStartedAt: phase === "break" ? (breakStartedAt as number) : null,
    breakDone,
    summary: sanitizedSummary
  };
}

function sanitizeBaseline(value: unknown): FocusSummaryBaseline | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return null;
  const { answered, correct } = value as Record<string, unknown>;
  if (!isNonNegativeNumber(answered)) return null;
  if (!isNonNegativeNumber(correct)) return null;
  return { answered, correct };
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function sanitizeDayTotals(value: unknown): FocusDayTotals {
  if (typeof value !== "object" || value === null) return {};
  const out: FocusDayTotals = {};
  for (const [key, ms] of Object.entries(value)) {
    const day = Number(key);
    if (isNonNegativeNumber(ms) && Number.isFinite(day) && day >= 0) {
      out[key] = ms;
    }
  }
  return out;
}

/**
 * Parse the persisted localStorage payload into a safe state. Malformed JSON,
 * an invalid config, or an invalid session each fall back to their safe
 * default independently -- a bad config never wipes valid day totals, and a
 * bad session never crashes the app.
 */
export function parseFocusPersisted(raw: string | null): FocusPersistedState {
  if (raw === null || raw === undefined) {
    return { config: defaultFocusConfig(), session: null, dayTotals: {} };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { config: defaultFocusConfig(), session: null, dayTotals: {} };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { config: defaultFocusConfig(), session: null, dayTotals: {} };
  }
  const { config, session, dayTotals } = parsed as Record<string, unknown>;
  return {
    config: sanitizeFocusConfig(config) ?? defaultFocusConfig(),
    session: session === null || session === undefined ? null : sanitizeFocusSession(session),
    dayTotals: sanitizeDayTotals(dayTotals)
  };
}

/** UTC day-bucket key for a timestamp (same bucket as stats.ts dayOf). */
export function dayKeyOf(ts: number): string {
  return String(Math.floor(ts / MS_PER_DAY));
}

/**
 * Remaining time for the CURRENT phase, derived from its absolute deadline.
 * Returns 0 once the deadline has passed (or the break is already done).
 */
export function focusRemainingMs(session: FocusSessionState, config: FocusConfig, now: number): number {
  const deadline =
    session.phase === "focus"
      ? (session.focusStartedAt ?? 0) + config.focusMinutes * MS_PER_MINUTE
      : session.breakDone
        ? 0
        : (session.breakStartedAt ?? 0) + config.breakMinutes * MS_PER_MINUTE;
  return Math.max(0, deadline - now);
}

/**
 * Advance a persisted state by reconciling it against `now`. Handles at most
 * the pending transitions: an expired focus folds its completed time into the
 * day totals and enters the break (break clock starts at the FOCUS deadline,
 * not the reconciliation moment, so a long-hidden tab cannot farm unlimited
 * "completed" focus time), and an expired break is marked done. Both can fire
 * in a single call on a long-hidden tab, but never twice -- once the state has
 * moved, a further reconcile is a no-op (single-fire expiry).
 */
export function reconcileFocus(
  prev: FocusPersistedState,
  now: number
): { next: FocusPersistedState; transition: FocusTransition } {
  const session = prev.session;
  if (!session) {
    return { next: prev, transition: "none" };
  }

  let nextSession = session;
  let transition: FocusTransition = "none";
  let dayTotals = prev.dayTotals;
  const config = prev.config;

  if (nextSession.phase === "focus" && nextSession.focusStartedAt !== null) {
    const deadline = nextSession.focusStartedAt + config.focusMinutes * MS_PER_MINUTE;
    if (now >= deadline) {
      // Focus completed. The break runs from the focus deadline (the natural
      // end of the focus), so the completed focus time is capped at the
      // configured duration regardless of when the tab was last visible.
      const naturalEnd = Math.min(now, deadline);
      const completedMs = Math.max(0, naturalEnd - nextSession.focusStartedAt);
      dayTotals = addDayTotal(dayTotals, dayKeyOf(now), completedMs);
      nextSession = {
        ...nextSession,
        phase: "break",
        breakStartedAt: deadline,
        focusStartedAt: null,
        breakDone: false
      };
      transition = "focus-completed";
    }
  }

  if (
    nextSession.phase === "break" &&
    nextSession.breakStartedAt !== null &&
    !nextSession.breakDone
  ) {
    const deadline = nextSession.breakStartedAt + config.breakMinutes * MS_PER_MINUTE;
    if (now >= deadline) {
      nextSession = { ...nextSession, breakDone: true };
      transition = "break-completed";
    }
  }

  if (nextSession === session && dayTotals === prev.dayTotals) {
    return { next: prev, transition: "none" };
  }
  return {
    next: { ...prev, session: nextSession, dayTotals: pruneDayTotals(dayTotals, now) },
    transition
  };
}

/**
 * End Focus Mode. The current focus, if any, is folded into today's completed
 * total at its actual elapsed duration (not capped -- the learner really
 * practised). If the focus already folded its time on expiry, nothing is added
 * twice. The session is cleared; config and day totals persist.
 */
export function endFocusSession(prev: FocusPersistedState, now: number): FocusPersistedState {
  const session = prev.session;
  if (!session) return prev;

  let dayTotals = prev.dayTotals;
  if (session.phase === "focus" && session.focusStartedAt !== null) {
    const completedMs = Math.max(0, now - session.focusStartedAt);
    dayTotals = addDayTotal(dayTotals, dayKeyOf(now), completedMs);
  }

  return {
    ...prev,
    session: null,
    dayTotals: pruneDayTotals(dayTotals, now)
  };
}

/**
 * Start the next focus cycle from the break surface (the "Skip break" /
 * "start next cycle" action). Always advances the cycle; a fresh summary
 * baseline is captured for the upcoming focus.
 */
export function skipBreak(
  prev: FocusPersistedState,
  now: number,
  baseline: FocusSummaryBaseline
): FocusPersistedState {
  const session = prev.session;
  return {
    ...prev,
    session: createFocusSession(now, {
      cycle: (session?.cycle ?? 0) + 1,
      summary: baseline
    })
  };
}

/** Start a fresh Focus Mode run from idle. */
export function startFocusSession(
  prev: FocusPersistedState,
  now: number,
  baseline: FocusSummaryBaseline
): FocusPersistedState {
  return {
    ...prev,
    session: createFocusSession(now, { summary: baseline })
  };
}

export interface FocusSessionSummary {
  answered: number;
  correct: number;
  accuracy: number;
  focusDurationMs: number;
  dayFocusedMs: number;
}

/** Derive the Break summary from the cycle baseline delta + actual durations. */
export function buildFocusSummary(
  baseline: FocusSummaryBaseline,
  totalAnswered: number,
  totalCorrect: number,
  focusDurationMs: number,
  dayFocusedMs: number
): FocusSessionSummary {
  const answered = Math.max(0, totalAnswered - baseline.answered);
  const correct = Math.max(0, totalCorrect - baseline.correct);
  return {
    answered,
    correct,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    focusDurationMs,
    dayFocusedMs
  };
}

function addDayTotal(totals: FocusDayTotals, key: string, ms: number): FocusDayTotals {
  return { ...totals, [key]: (totals[key] ?? 0) + ms };
}

function pruneDayTotals(totals: FocusDayTotals, now: number): FocusDayTotals {
  const today = Math.floor(now / MS_PER_DAY);
  const keepFrom = today - DAY_TOTAL_RETENTION;
  let changed = false;
  const out: FocusDayTotals = {};
  for (const [key, value] of Object.entries(totals)) {
    const day = Number(key);
    if (Number.isFinite(day) && day >= keepFrom && day <= today) {
      out[key] = value;
    } else {
      changed = true;
    }
  }
  return changed ? out : totals;
}
