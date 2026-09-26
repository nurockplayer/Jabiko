import { describe, expect, it } from "vitest";
import { selectRelevantSeasonalEvents, type SeasonalEvent } from "./seasonalEvents";

function annualEvent(
  id: string,
  month: number,
  day: number,
  overrides: Partial<SeasonalEvent> = {}
): SeasonalEvent {
  return {
    id,
    displayName: id,
    contentKey: `seasonal.${id}`,
    category: "cultural_event",
    dateRule: { kind: "annual", start: { month, day } },
    associations: { before: [`${id}.before`], active: [`${id}.active`], after: [`${id}.after`] },
    ...overrides,
  };
}

function oneOffEvent(
  id: string,
  startDate: string,
  endDate: string = startDate,
  overrides: Partial<SeasonalEvent> = {}
): SeasonalEvent {
  return {
    id,
    displayName: id,
    contentKey: `seasonal.${id}`,
    category: "local_event",
    dateRule: { kind: "one_off", startDate, endDate },
    associations: { before: [`${id}.before`], active: [`${id}.active`], after: [`${id}.after`] },
    ...overrides,
  };
}

describe("selectRelevantSeasonalEvents", () => {
  it("resolves recurring event lifecycle boundaries using the default JST calendar", () => {
    const event = annualEvent("festival", 8, 15);

    expect(selectRelevantSeasonalEvents([event], new Date("2026-08-08T03:00:00Z"))[0]).toMatchObject({
      eventId: "festival",
      phase: "imminent",
      contentIds: ["festival.before"],
    });
    expect(selectRelevantSeasonalEvents([event], new Date("2026-08-14T15:00:00Z"))[0]).toMatchObject({
      eventId: "festival",
      phase: "active",
      contentIds: ["festival.active"],
    });
    expect(selectRelevantSeasonalEvents([event], new Date("2026-08-16T03:00:00Z"))[0]).toMatchObject({
      eventId: "festival",
      phase: "recent",
      contentIds: ["festival.after"],
    });
    expect(selectRelevantSeasonalEvents([event], new Date("2026-08-30T03:00:00Z"))).toHaveLength(0);
  });

  it("handles New Year and annual ranges that cross the year boundary", () => {
    const newYear = annualEvent("new-year", 1, 1);
    const holidayWeek = annualEvent("holiday-week", 12, 29, {
      dateRule: {
        kind: "annual",
        start: { month: 12, day: 29 },
        end: { month: 1, day: 3 },
      },
    });

    expect(selectRelevantSeasonalEvents([newYear], new Date("2026-12-31T15:00:00Z"))[0]).toMatchObject({
      phase: "active",
      occurrenceStart: "2027-01-01",
    });
    expect(selectRelevantSeasonalEvents([holidayWeek], new Date("2027-01-02T03:00:00Z"))[0]).toMatchObject({
      phase: "active",
      occurrenceStart: "2026-12-29",
      occurrenceEnd: "2027-01-03",
    });
  });

  it("skips a non-existent annual leap-day occurrence instead of shifting it", () => {
    const leapDay = annualEvent("leap-day", 2, 29);

    expect(selectRelevantSeasonalEvents([leapDay], new Date("2025-02-28T03:00:00Z"))).toHaveLength(0);
    expect(selectRelevantSeasonalEvents([leapDay], new Date("2024-02-29T03:00:00Z"))[0]).toMatchObject({
      phase: "active",
      occurrenceStart: "2024-02-29",
    });
  });

  it("keeps a multi-day one-off event active through its inclusive end date", () => {
    const event = oneOffEvent("local-festival", "2026-07-20", "2026-07-22", {
      scope: { kind: "local", label: "Sapporo" },
      provenance: { source: "city calendar", accessedOn: "2026-01-01" },
    });

    expect(selectRelevantSeasonalEvents([event], new Date("2026-07-21T03:00:00Z"))[0]).toMatchObject({
      eventId: "local-festival",
      phase: "active",
      occurrenceStart: "2026-07-20",
      occurrenceEnd: "2026-07-22",
      contentIds: ["local-festival.active"],
      scope: { kind: "local", label: "Sapporo" },
      provenance: { source: "city calendar", accessedOn: "2026-01-01" },
    });
  });

  it("includes the inclusive default -14/+30 day boundaries and excludes adjacent dates", () => {
    const events = [
      oneOffEvent("past-edge", "2026-09-09"),
      oneOffEvent("past-outside", "2026-09-08"),
      oneOffEvent("future-edge", "2026-10-23"),
      oneOffEvent("future-outside", "2026-10-24"),
    ];

    expect(selectRelevantSeasonalEvents(events, new Date("2026-09-23T03:00:00Z")).map(({ eventId }) => eventId))
      .toEqual(["past-edge", "future-edge"]);
  });

  it("uses the injected instant in each declared timezone", () => {
    const referenceInstant = new Date("2026-09-22T15:30:00Z");
    const japanEvent = oneOffEvent("japan", "2026-09-23");
    const losAngelesEvent = oneOffEvent("los-angeles", "2026-09-22", "2026-09-22", {
      timeZone: "America/Los_Angeles",
    });

    expect(selectRelevantSeasonalEvents([japanEvent], referenceInstant)[0]).toMatchObject({ phase: "active" });
    expect(selectRelevantSeasonalEvents([losAngelesEvent], referenceInstant)[0]).toMatchObject({ phase: "active" });
  });

  it("returns one card per stable event ID and ranks independently of input order", () => {
    const events = [
      oneOffEvent("upcoming", "2026-10-01"),
      oneOffEvent("recent", "2026-09-22"),
      oneOffEvent("active", "2026-09-23"),
      oneOffEvent("active", "2026-09-23"),
      oneOffEvent("imminent", "2026-09-24"),
    ];
    const now = new Date("2026-09-23T03:00:00Z");

    const first = selectRelevantSeasonalEvents(events, now);
    const reversed = selectRelevantSeasonalEvents([...events].reverse(), now);

    expect(first.map(({ eventId, phase }) => [eventId, phase])).toEqual([
      ["active", "active"],
      ["imminent", "imminent"],
      ["recent", "recent"],
      ["upcoming", "upcoming"],
    ]);
    expect(reversed).toEqual(first);
  });

  it("fails closed when the same stable event ID has conflicting definitions", () => {
    const first = oneOffEvent("conflict", "2026-09-23");
    const second = oneOffEvent("conflict", "2026-09-24");

    expect(() => selectRelevantSeasonalEvents([first, second], new Date("2026-09-23T03:00:00Z")))
      .toThrow(/conflicting definitions/i);
  });

  it("rejects impossible one-off dates and undeclared time zones", () => {
    const impossibleDate = oneOffEvent("impossible", "2026-02-30");
    const invalidZone = oneOffEvent("invalid-zone", "2026-09-23", "2026-09-23", {
      timeZone: "Not/A_Time_Zone",
    });

    expect(() => selectRelevantSeasonalEvents([impossibleDate], new Date("2026-02-16T03:00:00Z")))
      .toThrow(/valid calendar date/i);
    expect(() => selectRelevantSeasonalEvents([invalidZone], new Date("2026-09-23T03:00:00Z")))
      .toThrow(/time zone/i);
  });

  it("makes the relevance window configurable", () => {
    const event = oneOffEvent("nearby", "2026-10-03");

    expect(selectRelevantSeasonalEvents([event], new Date("2026-09-23T03:00:00Z"), { futureDays: 9 })).toHaveLength(0);
    expect(selectRelevantSeasonalEvents([event], new Date("2026-09-23T03:00:00Z"), { futureDays: 10 })).toHaveLength(1);
  });

  it("allows zero forward days with the default imminent setting", () => {
    const event = oneOffEvent("tomorrow", "2026-09-24");

    expect(selectRelevantSeasonalEvents([event], new Date("2026-09-23T03:00:00Z"), { futureDays: 0 })).toHaveLength(0);
  });

  it("caps the default imminent phase at a shorter configured forward window", () => {
    const events = [
      oneOffEvent("inside-short-window", "2026-09-26"),
      oneOffEvent("outside-short-window", "2026-09-27"),
    ];

    expect(selectRelevantSeasonalEvents(events, new Date("2026-09-23T03:00:00Z"), { futureDays: 3 }))
      .toMatchObject([{ eventId: "inside-short-window", phase: "imminent" }]);
  });

  it("omits a relevant phase when it has no associated conversation content", () => {
    const event = oneOffEvent("without-content", "2026-09-23", "2026-09-23", {
      associations: { before: [], active: [], after: ["without-content.after"] },
    });

    expect(selectRelevantSeasonalEvents([event], new Date("2026-09-23T03:00:00Z"))).toHaveLength(0);
  });

  it.each(["pastDays", "futureDays", "imminentDays"] as const)(
    "accepts the maximum relevance window for %s",
    (field) => {
      expect(() => selectRelevantSeasonalEvents([], new Date("2026-09-23T03:00:00Z"), { [field]: 3660 }))
        .not.toThrow();
    }
  );

  it("accepts the maximum future window while resolving an annual event", () => {
    const event = annualEvent("annual-at-window-cap", 9, 23);

    expect(selectRelevantSeasonalEvents(
      [event],
      new Date("2026-09-23T03:00:00Z"),
      { futureDays: 3660 }
    )).toMatchObject([{ eventId: "annual-at-window-cap", phase: "active" }]);
  });

  it.each(["pastDays", "futureDays", "imminentDays"] as const)(
    "rejects relevance windows above the maximum for %s",
    (field) => {
      expect(() => selectRelevantSeasonalEvents([], new Date("2026-09-23T03:00:00Z"), { [field]: 3661 }))
        .toThrow(RangeError);
    }
  );

  it.each([
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["negative", -1],
    ["fractional", 1.5],
    ["unsafe integer", Number.MAX_SAFE_INTEGER + 1],
  ] as const)("rejects %s relevance windows for every field", (_description, value) => {
    for (const field of ["pastDays", "futureDays", "imminentDays"] as const) {
      expect(() => selectRelevantSeasonalEvents([], new Date("2026-09-23T03:00:00Z"), { [field]: value }))
        .toThrow(RangeError);
    }
  });

  it("rejects a safe integer relevance window that would make annual iteration unbounded", () => {
    expect(() => selectRelevantSeasonalEvents(
      [annualEvent("annual", 9, 23)],
      new Date("2026-09-23T03:00:00Z"),
      { futureDays: Number.MAX_SAFE_INTEGER }
    )).toThrow(RangeError);
  });
});
