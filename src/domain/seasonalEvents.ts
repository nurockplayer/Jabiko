export const DEFAULT_SEASONAL_RELEVANCE_WINDOW = {
  pastDays: 14,
  futureDays: 30,
  imminentDays: 7,
} as const;

export const DEFAULT_SEASONAL_TIME_ZONE = "Asia/Tokyo";

export type SeasonalEventCategory =
  | "holiday"
  | "seasonal_phenomenon"
  | "cultural_event"
  | "school_work_season"
  | "local_event"
  | "other";

export interface SeasonalMonthDay {
  month: number;
  day: number;
}

/** Inclusive ISO 8601 Gregorian calendar dates in the event's declared time zone. */
export type SeasonalEventDateRule =
  | {
      kind: "annual";
      start: SeasonalMonthDay;
      end?: SeasonalMonthDay;
    }
  | {
      kind: "one_off";
      startDate: string;
      endDate: string;
    };

export interface SeasonalEvent {
  id: string;
  displayName: string;
  contentKey: string;
  category: SeasonalEventCategory;
  dateRule: SeasonalEventDateRule;
  timeZone?: string;
  scope?: {
    kind: "japan" | "local" | "global";
    label?: string;
  };
  associations: {
    before: readonly string[];
    active: readonly string[];
    after: readonly string[];
  };
  provenance?: {
    source: string;
    accessedOn?: string;
  };
}

export type SeasonalEventPhase = "active" | "imminent" | "upcoming" | "recent";

export interface SeasonalEventRelevance {
  eventId: string;
  displayName: string;
  contentKey: string;
  category: SeasonalEventCategory;
  phase: SeasonalEventPhase;
  occurrenceStart: string;
  occurrenceEnd: string;
  contentIds: readonly string[];
  timeZone: string;
  scope?: SeasonalEvent["scope"];
  provenance?: SeasonalEvent["provenance"];
}

export interface SeasonalRelevanceWindow {
  pastDays: number;
  futureDays: number;
  imminentDays: number;
}

interface Occurrence {
  start: string;
  end: string;
}

interface Candidate {
  result: SeasonalEventRelevance;
  phaseRank: number;
  boundaryDistance: number;
}

const PHASE_RANK: Record<SeasonalEventPhase, number> = {
  active: 0,
  imminent: 1,
  recent: 2,
  upcoming: 3,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Selects one deterministic lifecycle card per event ID for the injected instant.
 * Date windows use calendar days in each event's declared time zone.
 */
export function selectRelevantSeasonalEvents(
  events: readonly SeasonalEvent[],
  referenceInstant: Date,
  window: Partial<SeasonalRelevanceWindow> = {}
): SeasonalEventRelevance[] {
  if (Number.isNaN(referenceInstant.getTime())) {
    throw new RangeError("referenceInstant must be a valid Date");
  }

  const relevanceWindow = { ...DEFAULT_SEASONAL_RELEVANCE_WINDOW, ...window };
  validateWindow(relevanceWindow);
  validateEventIds(events);

  const candidates: Candidate[] = [];
  for (const event of events) {
    const timeZone = event.timeZone ?? DEFAULT_SEASONAL_TIME_ZONE;
    const today = getCalendarDate(referenceInstant, timeZone);
    for (const occurrence of getOccurrences(event.dateRule, today.year, relevanceWindow)) {
      const candidate = resolveOccurrence(event, occurrence, today.iso, timeZone, relevanceWindow);
      if (candidate != null) candidates.push(candidate);
    }
  }

  candidates.sort(compareCandidates);
  const seenEventIds = new Set<string>();
  const results: SeasonalEventRelevance[] = [];
  for (const candidate of candidates) {
    if (seenEventIds.has(candidate.result.eventId)) continue;
    seenEventIds.add(candidate.result.eventId);
    results.push(candidate.result);
  }
  return results;
}

function validateWindow(window: SeasonalRelevanceWindow): void {
  for (const [name, value] of Object.entries(window)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`${name} must be a non-negative safe integer`);
    }
  }
}

function validateEventIds(events: readonly SeasonalEvent[]): void {
  const definitions = new Map<string, string>();
  for (const event of events) {
    if (event.id.trim().length === 0) throw new TypeError("event id must not be empty");
    const fingerprint = stableSerialize(event);
    const previous = definitions.get(event.id);
    if (previous != null && previous !== fingerprint) {
      throw new TypeError(`Event ${event.id} has conflicting definitions`);
    }
    definitions.set(event.id, fingerprint);
  }
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value != null && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) => compareStrings(left, right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function getCalendarDate(instant: Date, timeZone: string): { iso: string; year: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(instant);
  } catch {
    throw new RangeError(`Invalid seasonal event time zone: ${timeZone}`);
  }

  const values = new Map(parts.map(({ type, value }) => [type, value]));
  const year = Number(values.get("year"));
  const month = Number(values.get("month"));
  const day = Number(values.get("day"));
  return { iso: formatIsoDate(year, month, day), year };
}

function getOccurrences(
  rule: SeasonalEventDateRule,
  referenceYear: number,
  window: SeasonalRelevanceWindow
): Occurrence[] {
  if (rule.kind === "one_off") {
    validateIsoDate(rule.startDate, "startDate");
    validateIsoDate(rule.endDate, "endDate");
    if (rule.startDate > rule.endDate) throw new RangeError("Event endDate must not precede startDate");
    return [{ start: rule.startDate, end: rule.endDate }];
  }

  validateMonthDay(rule.start, "start");
  if (rule.end != null) validateMonthDay(rule.end, "end");

  const yearRadius = Math.ceil(Math.max(window.pastDays, window.futureDays) / 365) + 2;
  const occurrences: Occurrence[] = [];
  for (let year = referenceYear - yearRadius; year <= referenceYear + yearRadius; year += 1) {
    const start = monthDayInYear(rule.start, year);
    const endTuple = rule.end ?? rule.start;
    const wrapsYear = compareMonthDay(endTuple, rule.start) < 0;
    const end = monthDayInYear(endTuple, year + (wrapsYear ? 1 : 0));
    if (start != null && end != null) occurrences.push({ start, end });
  }
  return occurrences;
}

function validateMonthDay(value: SeasonalMonthDay, name: string): void {
  if (!Number.isInteger(value.month) || !Number.isInteger(value.day)
    || value.month < 1 || value.month > 12 || value.day < 1 || value.day > 31) {
    throw new RangeError(`Annual ${name} must be a valid month/day`);
  }
  // 2000 is a leap year and catches invalid dates such as February 30.
  if (monthDayInYear(value, 2000) == null) throw new RangeError(`Annual ${name} must be a valid month/day`);
}

function monthDayInYear(value: SeasonalMonthDay, year: number): string | null {
  const date = makeUtcDate(year, value.month, value.day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== value.month - 1 || date.getUTCDate() !== value.day) {
    return null;
  }
  return formatIsoDate(year, value.month, value.day);
}

function compareMonthDay(left: SeasonalMonthDay, right: SeasonalMonthDay): number {
  return left.month - right.month || left.day - right.day;
}

function validateIsoDate(value: string, name: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError(`${name} must use YYYY-MM-DD`);
  const [year, month, day] = value.split("-").map(Number);
  const date = makeUtcDate(year, month, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`${name} is not a valid calendar date`);
  }
}

function makeUtcDate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function resolveOccurrence(
  event: SeasonalEvent,
  occurrence: Occurrence,
  today: string,
  timeZone: string,
  window: SeasonalRelevanceWindow
): Candidate | null {
  const daysUntilStart = calendarDaysBetween(today, occurrence.start);
  const daysSinceEnd = calendarDaysBetween(occurrence.end, today);
  let phase: SeasonalEventPhase;
  let boundaryDistance: number;
  let contentIds: readonly string[];
  const imminentLimit = Math.min(window.imminentDays, window.futureDays);

  if (daysUntilStart <= 0 && daysSinceEnd <= 0) {
    phase = "active";
    boundaryDistance = 0;
    contentIds = event.associations.active;
  } else if (daysUntilStart >= 1 && daysUntilStart <= imminentLimit) {
    phase = "imminent";
    boundaryDistance = daysUntilStart;
    contentIds = event.associations.before;
  } else if (daysUntilStart > imminentLimit && daysUntilStart <= window.futureDays) {
    phase = "upcoming";
    boundaryDistance = daysUntilStart;
    contentIds = event.associations.before;
  } else if (daysSinceEnd >= 1 && daysSinceEnd <= window.pastDays) {
    phase = "recent";
    boundaryDistance = daysSinceEnd;
    contentIds = event.associations.after;
  } else {
    return null;
  }

  if (contentIds.length === 0) return null;

  return {
    phaseRank: PHASE_RANK[phase],
    boundaryDistance,
    result: {
      eventId: event.id,
      displayName: event.displayName,
      contentKey: event.contentKey,
      category: event.category,
      phase,
      occurrenceStart: occurrence.start,
      occurrenceEnd: occurrence.end,
      contentIds: [...contentIds],
      timeZone,
      ...(event.scope == null ? {} : { scope: event.scope }),
      ...(event.provenance == null ? {} : { provenance: event.provenance }),
    },
  };
}

function calendarDaysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

function compareCandidates(left: Candidate, right: Candidate): number {
  return left.phaseRank - right.phaseRank
    || left.boundaryDistance - right.boundaryDistance
    || compareStrings(left.result.eventId, right.result.eventId)
    || compareStrings(left.result.occurrenceStart, right.result.occurrenceStart)
    || compareStrings(left.result.contentKey, right.result.contentKey)
    || compareStrings(left.result.contentIds.join("\u0000"), right.result.contentIds.join("\u0000"));
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
