import { describe, expect, it } from "vitest";
import { seasonalConversationFamilies } from "./seasonalConversationContent/catalog";
import { getSeasonalConversationDiscoveryCards } from "./seasonalConversationDiscovery";
import type { SeasonalConversationFamily } from "./seasonalConversationContent/catalog";

const reference = new Date("2026-04-01T12:00:00.000Z");

function withAnnualDate(family: SeasonalConversationFamily, month: number, day: number): SeasonalConversationFamily {
  return {
    ...family,
    event: {
      ...family.event,
      dateRule: { kind: "annual", start: { month, day } }
    }
  };
}

function family(id: string): SeasonalConversationFamily {
  const match = seasonalConversationFamilies.find(({ event }) => event.id === id);
  if (match == null) throw new Error(`Missing seasonal fixture family ${id}`);
  return match;
}

describe("seasonal conversation discovery presenter (#818)", () => {
  it("maps recent, active, imminent and upcoming phases while retaining selector order and its four-card limit", () => {
    const fixtures = [
      withAnnualDate(family("new-year"), 3, 31),
      withAnnualDate(family("hinamatsuri"), 4, 1),
      withAnnualDate(family("childrens-day"), 4, 7),
      withAnnualDate(family("time-day"), 4, 21),
      withAnnualDate(family("tanabata"), 4, 22)
    ];

    const cards = getSeasonalConversationDiscoveryCards(fixtures, reference);

    expect(cards).toHaveLength(4);
    expect(cards.map(({ eventId, phase }) => [eventId, phase])).toEqual([
      ["hinamatsuri", "now"],
      ["childrens-day", "coming_soon"],
      ["new-year", "recent"],
      ["time-day", "coming_soon"]
    ]);
    expect(new Set(cards.map(({ eventId }) => eventId)).size).toBe(cards.length);
    for (const card of cards) {
      expect(card.definition.scenario.id).toBe(card.scenarioId);
      expect(card.definition.scenario.seasonalAssociation?.eventId).toBe(card.eventId);
    }
  });

  it("chooses the first declared valid association and skips orphan or ambiguous families before filling four cards", () => {
    const multi = family("new-year");
    const multiAssociation = {
      ...multi.event,
      dateRule: { kind: "annual" as const, start: { month: 4, day: 1 } },
      associations: {
        ...multi.event.associations,
        active: [multi.definitions[1].scenario.id, multi.definitions[0].scenario.id]
      }
    };
    const orphan = family("hinamatsuri");
    const orphanAssociation = {
      ...orphan,
      event: {
        ...orphan.event,
        dateRule: { kind: "annual" as const, start: { month: 4, day: 1 } },
        associations: { ...orphan.event.associations, active: ["not-in-this-family"] }
      }
    };
    const foreign = family("culture-day");
    const foreignAssociation = {
      ...foreign,
      event: {
        ...foreign.event,
        dateRule: { kind: "annual" as const, start: { month: 4, day: 1 } },
        associations: {
          ...foreign.event.associations,
          active: [family("new-year").definitions[1].scenario.id]
        }
      }
    };
    const mixed = family("foundation-day");
    const mixedAssociation = {
      ...mixed,
      event: {
        ...mixed.event,
        dateRule: { kind: "annual" as const, start: { month: 4, day: 1 } },
        associations: {
          ...mixed.event.associations,
          active: [mixed.definitions[1].scenario.id, "also-not-in-this-family"]
        }
      }
    };
    const empty = family("school-year-start");
    const emptyAssociation = {
      ...empty,
      event: {
        ...empty.event,
        dateRule: { kind: "annual" as const, start: { month: 4, day: 1 } },
        associations: { ...empty.event.associations, active: [] }
      }
    };
    const ambiguous = family("childrens-day");
    const ambiguousAssociation = {
      ...ambiguous,
      definitions: [...ambiguous.definitions, ambiguous.definitions[1]],
      event: {
        ...ambiguous.event,
        dateRule: { kind: "annual" as const, start: { month: 4, day: 1 } },
        associations: { ...ambiguous.event.associations, active: [ambiguous.definitions[1].scenario.id] }
      }
    };
    const later = [
      withAnnualDate(family("time-day"), 4, 21),
      withAnnualDate(family("tanabata"), 4, 22),
      withAnnualDate(family("mountain-day"), 4, 23)
    ];

    const cards = getSeasonalConversationDiscoveryCards([
      { ...multi, event: multiAssociation }, orphanAssociation, foreignAssociation, mixedAssociation,
      emptyAssociation, ambiguousAssociation, ...later
    ], reference);

    expect(cards.map(({ eventId }) => eventId)).toEqual(["new-year", "time-day", "tanabata", "mountain-day"]);
    expect(cards[0].scenarioId).toBe(multi.definitions[1].scenario.id);
  });

  it("uses the merged New Year's Eve event across the JST Dec 31 / Jan 1 boundary", () => {
    const newYearsEve = [family("new-years-eve")];
    // Both instants are Dec 31 in UTC; only Tokyo midnight changes the phase.
    const justBeforeTokyoMidnight = getSeasonalConversationDiscoveryCards(
      newYearsEve,
      new Date("2026-12-31T14:59:59.999Z")
    );
    const atTokyoMidnight = getSeasonalConversationDiscoveryCards(
      newYearsEve,
      new Date("2026-12-31T15:00:00.000Z")
    );

    expect(justBeforeTokyoMidnight[0]).toMatchObject({
      eventId: "new-years-eve",
      phase: "now",
      scenarioId: "seasonal-new-years-eve-active"
    });
    expect(atTokyoMidnight[0]).toMatchObject({
      eventId: "new-years-eve",
      phase: "recent",
      scenarioId: "seasonal-new-years-eve-after"
    });
  });

  it("returns an empty list for no relevant families", () => {
    expect(getSeasonalConversationDiscoveryCards([], reference)).toEqual([]);
  });
});
