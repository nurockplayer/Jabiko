// Focus Mode / Pomodoro domain tests (#771).
//
// Covers the pure state machine: phase transitions, deadline-based remaining
// time, hidden-tab / late wake-up recovery, single-fire expiry, day totals,
// summary deltas, and persistence sanitization. All functions are pure with an
// injectable `now`, so these run in node with deterministic clocks.
import { describe, expect, it } from "vitest";
import {
  MS_PER_MINUTE,
  buildFocusSummary,
  createFocusSession,
  dayKeyOf,
  defaultFocusConfig,
  endFocusSession,
  focusRemainingMs,
  parseFocusPersisted,
  reconcileFocus,
  sanitizeFocusConfig,
  sanitizeFocusSession,
  skipBreak,
  startFocusSession,
  type FocusPersistedState,
  type FocusSessionState,
  type FocusSummaryBaseline
} from "./focus";

const FOCUS_MS = 25 * MS_PER_MINUTE;
const BREAK_MS = 5 * MS_PER_MINUTE;

function makeState(now: number, overrides: Partial<FocusSessionState> = {}): FocusPersistedState {
  return {
    config: defaultFocusConfig(),
    session: createFocusSession(now, overrides),
    dayTotals: {}
  };
}

describe("default config and sanitization", () => {
  it("defaults to 25/5", () => {
    expect(defaultFocusConfig()).toEqual({ focusMinutes: 25, breakMinutes: 5 });
  });

  it("accepts a valid config", () => {
    expect(sanitizeFocusConfig({ focusMinutes: 50, breakMinutes: 10 })).toEqual({
      focusMinutes: 50,
      breakMinutes: 10
    });
  });

  it("rejects malformed / out-of-range configs", () => {
    for (const bad of [
      null,
      undefined,
      {},
      { focusMinutes: 0, breakMinutes: 5 },
      { focusMinutes: -1, breakMinutes: 5 },
      { focusMinutes: 1.5, breakMinutes: 5 },
      { focusMinutes: 121, breakMinutes: 5 },
      { focusMinutes: 25, breakMinutes: 0 },
      { focusMinutes: 25, breakMinutes: 61 },
      { focusMinutes: NaN, breakMinutes: 5 },
      { focusMinutes: 25, breakMinutes: Number.POSITIVE_INFINITY }
    ]) {
      expect(sanitizeFocusConfig(bad)).toBeNull();
    }
  });
});

describe("session creation", () => {
  it("starts an idle session in focus phase, cycle 1", () => {
    const session = createFocusSession(1_000_000);
    expect(session).toMatchObject({
      phase: "focus",
      cycle: 1,
      focusStartedAt: 1_000_000,
      breakStartedAt: null,
      breakDone: false,
      summary: null
    });
  });
});

describe("deadline-based remaining time", () => {
  it("counts down from an absolute deadline, not accumulated ticks", () => {
    const state = makeState(0);
    expect(focusRemainingMs(state.session!, state.config, 10 * MS_PER_MINUTE)).toBe(
      15 * MS_PER_MINUTE
    );
    expect(focusRemainingMs(state.session!, state.config, 0)).toBe(FOCUS_MS);
  });

  it("returns 0 after expiry", () => {
    const state = makeState(0);
    expect(focusRemainingMs(state.session!, state.config, FOCUS_MS + 1)).toBe(0);
  });

  it("counts break time from the break deadline", () => {
    const { next } = reconcileFocus(makeState(0), FOCUS_MS);
    expect(next.session!.phase).toBe("break");
    expect(focusRemainingMs(next.session!, next.config, FOCUS_MS + 2 * MS_PER_MINUTE)).toBe(
      BREAK_MS - 2 * MS_PER_MINUTE
    );
  });
});

describe("reconcile: focus expiry", () => {
  it("does not transition before the deadline", () => {
    const state = makeState(0);
    const { next, transition } = reconcileFocus(state, FOCUS_MS - 1);
    expect(transition).toBe("none");
    expect(next.session).toEqual(state.session);
    expect(next.dayTotals).toEqual({});
  });

  it("transitions to break exactly once on expiry", () => {
    const state = makeState(0);
    const first = reconcileFocus(state, FOCUS_MS);
    expect(first.transition).toBe("focus-completed");
    expect(first.next.session!.phase).toBe("break");
    // Break starts at the reconciliation moment (late wake-up), not the expiry instant.
    expect(first.next.session!.breakStartedAt).toBe(FOCUS_MS);
    expect(first.next.session!.breakDone).toBe(false);
    // focusStartedAt is cleared so a second reconcile cannot re-add the focus time.
    expect(first.next.session!.focusStartedAt).toBeNull();

    const second = reconcileFocus(first.next, FOCUS_MS + 1);
    expect(second.transition).toBe("none");
    expect(second.next.session!.phase).toBe("break");
  });

  it("folds the completed focus time into today's totals, capped at the deadline", () => {
    const state = makeState(0);
    const { next } = reconcileFocus(state, FOCUS_MS + 5 * MS_PER_MINUTE);
    // Device slept well past the deadline: completed focus time is the configured
    // duration (capped), not the whole elapsed span.
    expect(next.dayTotals[dayKeyOf(0)]).toBe(FOCUS_MS);
  });

  it("attributes a manual end before expiry to today's totals as actual elapsed time", () => {
    const state = makeState(0);
    const next = endFocusSession(state, 20 * MS_PER_MINUTE);
    expect(next.session).toBeNull();
    expect(next.dayTotals[dayKeyOf(0)]).toBe(20 * MS_PER_MINUTE);
  });

  it("does not double-count when ending a session that already folded its focus time", () => {
    const state = makeState(0);
    const broken = reconcileFocus(state, FOCUS_MS);
    const ended = endFocusSession(broken.next, FOCUS_MS + 2 * MS_PER_MINUTE);
    expect(ended.session).toBeNull();
    expect(ended.dayTotals[dayKeyOf(0)]).toBe(FOCUS_MS);
  });
});

describe("reconcile: break expiry", () => {
  it("marks the break done once, then stays done", () => {
    const state = makeState(0);
    const broken = reconcileFocus(state, FOCUS_MS);
    const complete = reconcileFocus(broken.next, FOCUS_MS + BREAK_MS);
    expect(complete.transition).toBe("break-completed");
    expect(complete.next.session!.breakDone).toBe(true);

    const again = reconcileFocus(complete.next, FOCUS_MS + BREAK_MS + 1000);
    expect(again.transition).toBe("none");
    expect(again.next.session!.breakDone).toBe(true);
  });

  it("treats a break with no remaining time as completed", () => {
    const state = makeState(0);
    const broken = reconcileFocus(state, FOCUS_MS);
    const complete = reconcileFocus(broken.next, FOCUS_MS + BREAK_MS);
    expect(focusRemainingMs(complete.next.session!, complete.next.config, FOCUS_MS + BREAK_MS)).toBe(0);
  });

  it("performs only one transition per reconcile on a long-hidden tab", () => {
    // Hidden for the whole focus AND break: waking up lands on break-completed,
    // never skipping the break phase. The break clock started at the FOCUS
    // deadline (Issue: reconcile into the ended state, not restart the clock),
    // so the overdue break reads as done.
    const state = makeState(0);
    const { next } = reconcileFocus(state, FOCUS_MS + BREAK_MS + 10_000);
    expect(next.session!.phase).toBe("break");
    expect(next.session!.breakStartedAt).toBe(FOCUS_MS);
    expect(next.session!.breakDone).toBe(true);
    expect(next.dayTotals[dayKeyOf(0)]).toBe(FOCUS_MS);
  });
});

describe("skipBreak and next cycle", () => {
  it("starts the next focus cycle immediately with a fresh baseline", () => {
    const state = makeState(0);
    const broken = reconcileFocus(state, FOCUS_MS);
    const baseline: FocusSummaryBaseline = { answered: 7, correct: 5 };
    const next = skipBreak(broken.next, FOCUS_MS + 1000, baseline);

    expect(next.session!.phase).toBe("focus");
    expect(next.session!.cycle).toBe(2);
    expect(next.session!.focusStartedAt).toBe(FOCUS_MS + 1000);
    expect(next.session!.breakStartedAt).toBeNull();
    expect(next.session!.breakDone).toBe(false);
    expect(next.session!.summary).toEqual(baseline);
  });

  it("skips a break that has not started (focus still active) safely", () => {
    // Guard: skipBreak is only reachable from a break surface, but the domain
    // must not corrupt state if called early.
    const state = makeState(0);
    const next = skipBreak(state, 1000, { answered: 0, correct: 0 });
    expect(next.session!.phase).toBe("focus");
    expect(next.session!.cycle).toBe(2);
    expect(next.session!.focusStartedAt).toBe(1000);
  });
});

describe("startFocusSession", () => {
  it("starts a fresh session from idle", () => {
    const prev: FocusPersistedState = {
      config: defaultFocusConfig(),
      session: null,
      dayTotals: {}
    };
    const baseline: FocusSummaryBaseline = { answered: 3, correct: 3 };
    const next = startFocusSession(prev, 5000, baseline);
    expect(next.session!.phase).toBe("focus");
    expect(next.session!.cycle).toBe(1);
    expect(next.session!.focusStartedAt).toBe(5000);
    expect(next.session!.summary).toEqual(baseline);
  });
});

describe("summary deltas", () => {
  it("derives answered/correct/accuracy from the baseline delta", () => {
    const baseline: FocusSummaryBaseline = { answered: 10, correct: 7 };
    const summary = buildFocusSummary(baseline, 14, 11, FOCUS_MS, 2 * FOCUS_MS);
    expect(summary).toEqual({
      answered: 4,
      correct: 4,
      accuracy: 100,
      focusDurationMs: FOCUS_MS,
      dayFocusedMs: 2 * FOCUS_MS
    });
  });

  it("computes a non-100 accuracy from mixed results", () => {
    const baseline: FocusSummaryBaseline = { answered: 10, correct: 7 };
    const summary = buildFocusSummary(baseline, 14, 9, FOCUS_MS, FOCUS_MS);
    expect(summary.answered).toBe(4);
    expect(summary.correct).toBe(2);
    expect(summary.accuracy).toBe(50);
  });

  it("degrades to zero accuracy when nothing was answered this focus", () => {
    const baseline: FocusSummaryBaseline = { answered: 5, correct: 5 };
    const summary = buildFocusSummary(baseline, 5, 5, FOCUS_MS, FOCUS_MS);
    expect(summary.answered).toBe(0);
    expect(summary.correct).toBe(0);
    expect(summary.accuracy).toBe(0);
  });
});

describe("day totals housekeeping", () => {
  it("drops totals older than the retention window when a new day is added", () => {
    const state = makeState(0);
    state.dayTotals[dayKeyOf(-2 * 86_400_000)] = FOCUS_MS; // stale
    const { next } = reconcileFocus(state, FOCUS_MS);
    const keys = Object.keys(next.dayTotals);
    expect(keys).toContain(dayKeyOf(0));
    expect(keys).not.toContain(dayKeyOf(-2 * 86_400_000));
  });
});

describe("recovery semantics", () => {
  it("a long-hidden focus reconciles into break on wake, not a restarted clock", () => {
    const start = 1_000_000;
    const state = makeState(start);
    // Slept past the whole focus, woke two minutes into what should have been
    // the break: the focus is done (time folded), and the break is already
    // running from the focus deadline -- the focus clock was NOT restarted.
    const wake = start + FOCUS_MS + 2 * MS_PER_MINUTE;
    const { next } = reconcileFocus(state, wake);
    expect(next.session!.phase).toBe("break");
    expect(next.session!.breakStartedAt).toBe(start + FOCUS_MS);
    expect(focusRemainingMs(next.session!, next.config, wake)).toBe(BREAK_MS - 2 * MS_PER_MINUTE);
    expect(next.dayTotals[dayKeyOf(wake)]).toBe(FOCUS_MS);
  });
});

describe("persistence sanitization", () => {
  it("parses a null/empty store into a safe default state", () => {
    const state = parseFocusPersisted(null);
    expect(state.config).toEqual(defaultFocusConfig());
    expect(state.session).toBeNull();
    expect(state.dayTotals).toEqual({});
  });

  it("falls back to default on malformed JSON", () => {
    const state = parseFocusPersisted("{{{ not json");
    expect(state.config).toEqual(defaultFocusConfig());
    expect(state.session).toBeNull();
  });

  it("sanitizes an invalid config back to defaults while keeping the rest", () => {
    const raw = JSON.stringify({
      config: { focusMinutes: 0, breakMinutes: 99 },
      session: createFocusSession(1000),
      dayTotals: { [dayKeyOf(1000)]: 500 }
    });
    const state = parseFocusPersisted(raw);
    expect(state.config).toEqual(defaultFocusConfig());
    expect(state.session).not.toBeNull();
    expect(state.dayTotals[dayKeyOf(1000)]).toBe(500);
  });

  it("rejects malformed sessions without crashing", () => {
    for (const bad of [
      {
        phase: "bogus",
        cycle: 1,
        focusStartedAt: 0,
        breakStartedAt: null,
        breakDone: false,
        summary: null
      },
      {
        phase: "focus",
        cycle: 0,
        focusStartedAt: 0,
        breakStartedAt: null,
        breakDone: false,
        summary: null
      },
      {
        phase: "focus",
        cycle: 1.5,
        focusStartedAt: 0,
        breakStartedAt: null,
        breakDone: false,
        summary: null
      },
      {
        phase: "focus",
        cycle: 1,
        focusStartedAt: null,
        breakStartedAt: null,
        breakDone: false,
        summary: null
      },
      {
        phase: "break",
        cycle: 1,
        focusStartedAt: 0,
        breakStartedAt: null,
        breakDone: false,
        summary: null
      },
      {
        phase: "focus",
        cycle: 1,
        focusStartedAt: 0,
        breakStartedAt: null,
        breakDone: "yes",
        summary: null
      },
      {
        phase: "focus",
        cycle: 1,
        focusStartedAt: 0,
        breakStartedAt: null,
        breakDone: false,
        summary: { answered: 1, correct: "x" }
      },
      "not an object",
      42
    ]) {
      expect(sanitizeFocusSession(bad)).toBeNull();
    }
  });

  it("keeps a valid session", () => {
    const session = {
      phase: "break" as const,
      cycle: 3,
      focusStartedAt: null,
      breakStartedAt: 5_000,
      breakDone: false,
      summary: { answered: 2, correct: 1 }
    };
    expect(sanitizeFocusSession(session)).toEqual(session);
  });

  it("round-trips a full valid persisted state", () => {
    const state: FocusPersistedState = {
      config: { focusMinutes: 40, breakMinutes: 10 },
      session: {
        phase: "focus",
        cycle: 2,
        focusStartedAt: 12345,
        breakStartedAt: null,
        breakDone: false,
        summary: null
      },
      dayTotals: { [dayKeyOf(12345)]: 1_500_000 }
    };
    expect(parseFocusPersisted(JSON.stringify(state))).toEqual(state);
  });

  it("filters malformed day-total entries", () => {
    const raw = JSON.stringify({
      config: defaultFocusConfig(),
      session: null,
      dayTotals: { abc: 100, "-1": 100, [dayKeyOf(0)]: 60_000, extra: "junk" }
    });
    const state = parseFocusPersisted(raw);
    expect(state.dayTotals).toEqual({ [dayKeyOf(0)]: 60_000 });
  });
});
