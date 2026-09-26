import { describe, expect, it } from "vitest";
import { createConversationSession, validateConversationSessionDefinitions } from "../conversationSession";
import {
  localizeConversationLearnerText,
  type ConversationLearnerText
} from "../conversationScenario";
import { conversationCatalogDefinitions } from "../conversationContent/catalog";
import { selectRelevantSeasonalEvents } from "../seasonalEvents";
import {
  seasonalConversationDefinitions,
  seasonalConversationEvents,
  seasonalConversationFamilies
} from "./catalog";

const expectedAnchors = [
  ["new-year", 1, 1],
  ["foundation-day", 2, 11],
  ["hinamatsuri", 3, 3],
  ["school-year-start", 4, 1],
  ["childrens-day", 5, 5],
  ["time-day", 6, 10],
  ["tanabata", 7, 7],
  ["mountain-day", 8, 11],
  ["disaster-prevention-day", 9, 1],
  ["coffee-day", 10, 1],
  ["culture-day", 11, 3],
  ["labour-thanksgiving-day", 11, 23],
  ["new-years-eve", 12, 31]
] as const;

function allLearnerTexts(
  definitions: typeof seasonalConversationDefinitions
): ConversationLearnerText[] {
  return definitions.flatMap(({ scenario }) => [
    scenario.situation,
    scenario.relationship.context,
    scenario.objective,
    scenario.instruction,
    ...scenario.steps.flatMap((step) => step.kind === "learner_response"
      ? [step.prompt, ...step.responseExamples.flatMap((example) => example.explanation ? [example.explanation] : [])]
      : step.kind === "completion" ? [step.summary] : [])
  ]);
}

describe("seasonal conversation catalog", () => {
  it("contains thirteen fixed, sourced anchors and all three phases", () => {
    expect(seasonalConversationFamilies).toHaveLength(13);
    expect(seasonalConversationEvents).toHaveLength(13);
    expect(seasonalConversationDefinitions).toHaveLength(39);
    expect(seasonalConversationEvents.map(({ id, dateRule }) => [
      id,
      dateRule.kind === "annual" ? dateRule.start.month : null,
      dateRule.kind === "annual" ? dateRule.start.day : null
    ])).toEqual(expectedAnchors);
    expect(new Set(seasonalConversationEvents.map(({ id }) => id)).size).toBe(13);

    for (const family of seasonalConversationFamilies) {
      expect(family.event.provenance?.source).toMatch(/^https:\/\//);
      expect(family.event.provenance?.accessedOn).toBe("2026-09-26");
      expect(family.event.timeZone).toBe("Asia/Tokyo");
      expect(family.event.dateRule.kind).toBe("annual");
      expect(family.event.associations.before).toHaveLength(1);
      expect(family.event.associations.active).toHaveLength(1);
      expect(family.event.associations.after).toHaveLength(1);
      expect(family.definitions).toHaveLength(3);
      expect(family.definitions.map(({ scenario }) => scenario.seasonalAssociation?.eventId))
        .toEqual([family.event.id, family.event.id, family.event.id]);
      for (const definition of family.definitions) {
        expect(definition.scenario.sources).toEqual([
          expect.objectContaining({ url: family.event.provenance?.source, accessedOn: "2026-09-26" })
        ]);
      }
    }
  });

  it("keeps every selector result closed over its authored phase and scenario", () => {
    const eventsById = new Map(seasonalConversationEvents.map((event) => [event.id, event]));
    const definitionsById = new Map(seasonalConversationDefinitions.map((definition) => [
      definition.scenario.id,
      definition
    ]));

    for (let year = 2026; year <= 2028; year += 1) {
      const daysInYear = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
      for (let day = 0; day < daysInYear; day += 1) {
        const date = new Date(Date.UTC(year, 0, day + 1)).toISOString().slice(0, 10);
        const selected = selectRelevantSeasonalEvents(
          seasonalConversationEvents,
          new Date(`${date}T12:00:00+09:00`)
        );
        expect(selected.length, `no seasonal content on ${date}`).toBeGreaterThan(0);
        for (const relevance of selected) {
          const event = eventsById.get(relevance.eventId);
          expect(event, relevance.eventId).toBeDefined();
          const association = relevance.phase === "active"
            ? event?.associations.active
            : relevance.phase === "recent"
              ? event?.associations.after
              : event?.associations.before;
          expect(relevance.contentIds).toEqual(association);
          for (const contentId of relevance.contentIds) {
            expect(definitionsById.get(contentId)?.scenario.seasonalAssociation?.eventId)
              .toBe(relevance.eventId);
          }
        }
      }
    }

    const yearBoundary = selectRelevantSeasonalEvents(
      seasonalConversationEvents,
      new Date("2026-12-31T15:00:00Z")
    );
    expect(yearBoundary.map(({ eventId }) => eventId)).toContain("new-year");
    expect(yearBoundary.map(({ eventId }) => eventId)).toContain("new-years-eve");
  });

  it("selects the correct authored association at every annual phase boundary", () => {
    for (const event of seasonalConversationEvents) {
      if (event.dateRule.kind !== "annual") throw new Error(`${event.id} must be annual`);
      const { month, day } = event.dateRule.start;
      const occurrence = new Date(Date.UTC(2028, month - 1, day, 3));
      const instantAtOffset = (offset: number) => new Date(occurrence.getTime() + offset * 86_400_000);
      const expected = [
        [-8, "upcoming", event.associations.before],
        [-1, "imminent", event.associations.before],
        [0, "active", event.associations.active],
        [14, "recent", event.associations.after]
      ] as const;
      for (const [offset, phase, contentIds] of expected) {
        const result = selectRelevantSeasonalEvents(
          [event],
          instantAtOffset(offset)
        )[0];
        expect(result, `${event.id} ${offset} days`).toMatchObject({ phase, contentIds });
      }
    }

    const newYear = seasonalConversationEvents.find(({ id }) => id === "new-year");
    if (!newYear) throw new Error("new-year event is missing");
    for (const day of [2, 15]) {
      const selected = selectRelevantSeasonalEvents(
        [newYear],
        new Date(`2027-01-${String(day).padStart(2, "0")}T12:00:00+09:00`)
      )[0];
      expect(selected?.phase).toBe("recent");
      expect(selected?.contentIds).toEqual(newYear.associations.after);
    }
    const newYearAfter = seasonalConversationDefinitions.find(({ scenario }) =>
      scenario.id === "seasonal-new-year-after"
    );
    if (!newYearAfter) throw new Error("new-year recent scenario is missing");
    expect(newYearAfter?.scenario.situation.textZh).toContain("元日");
    expect(newYearAfter?.scenario.situation.textI18n?.ja).toContain("元日");
    expect(newYearAfter?.scenario.situation.textI18n?.en).toContain("New Year");
    for (const step of newYearAfter.scenario.steps) {
      if (step.kind === "partner_line") expect(step.japanese).not.toMatch(/昨日|明日/);
      if (step.kind === "learner_response") {
        for (const example of step.responseExamples) expect(example.japanese).not.toMatch(/昨日|明日/);
      }
    }
    const yearEndAfter = seasonalConversationDefinitions.find(({ scenario }) =>
      scenario.id === "seasonal-new-years-eve-after"
    );
    if (!yearEndAfter) throw new Error("new-years-eve recent scenario is missing");
    const yearEndResponses = yearEndAfter.scenario.steps.flatMap((step) =>
      step.kind === "learner_response" ? step.responseExamples.map(({ japanese }) => japanese) : []
    );
    expect(yearEndResponses.some((line) => line.includes("去年撮った写真"))).toBe(true);
    expect(yearEndResponses.some((line) => line.includes("今年撮った写真"))).toBe(false);
  });

  it("uses distinct authored medium and deeper long learning arcs", () => {
    const medium = seasonalConversationDefinitions.filter(({ scenario }) => scenario.length === "medium");
    const long = seasonalConversationDefinitions.filter(({ scenario }) => scenario.length === "long");
    expect(medium.length).toBeGreaterThanOrEqual(3);
    expect(long.length).toBeGreaterThanOrEqual(3);
    const deeperLong = long.filter(({ scenario }) =>
      scenario.difficulty.linguisticComplexity === "advanced" &&
      scenario.difficulty.topicDepth !== "concrete"
    );
    expect(deeperLong.length).toBeGreaterThanOrEqual(3);
    for (const { scenario } of long) {
      const responseSteps = scenario.steps.filter((step) => step.kind === "learner_response");
      expect(responseSteps.length, scenario.id).toBeGreaterThanOrEqual(3);
      expect(scenario.primarySkills).toEqual(expect.arrayContaining(["narrate"]));
      if (scenario.difficulty.linguisticComplexity === "advanced") {
        expect(responseSteps.map((step) => step.prompt.textZh).join(" ")).toMatch(/理由|原因|経験|考え|目標|選択|忙碌|多種看法/);
      }
    }
  });

  it("keeps all seasonal and evergreen IDs, response bindings, and graph references valid together", () => {
    const allDefinitions = [...conversationCatalogDefinitions, ...seasonalConversationDefinitions];
    const allIds = allDefinitions.flatMap(({ scenario, responses }) => [
      scenario.id,
      ...scenario.steps.flatMap((step) => [
        step.id,
        ...(step.kind === "learner_response"
          ? [...step.responseExamples.map(({ id }) => id), ...step.branches.map(({ id }) => id)]
          : [])
      ]),
      ...responses.map(({ feedback }) => feedback.id)
    ]);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(validateConversationSessionDefinitions(allDefinitions)).toEqual({ valid: true, errors: [] });

    for (const definition of seasonalConversationDefinitions) {
      const authoredSkills = new Set(definition.responses.flatMap(({ feedback }) =>
        feedback.feedback.composition.map(({ canonicalSkillId }) => canonicalSkillId)
      ));
      expect(definition.scenario.primarySkills.every((skill) => authoredSkills.has(skill)), definition.scenario.id)
        .toBe(true);
      for (const binding of definition.responses) {
        const session = createConversationSession([definition]);
        expect(session.select(definition.scenario.id)).toBe(true);
        expect(session.start()).toBe(true);
        let guard = 0;
        while (session.getState().phase !== "complete" && guard < 40) {
          guard += 1;
          const state = session.getState();
          if (state.step?.kind === "partner_line") {
            expect(session.advance()).toBe(true);
          } else if (state.step?.kind === "learner_response") {
            const choice = state.step.responseExamples.find(({ id }) =>
              state.step?.kind === "learner_response" && state.step.id === binding.stepId && id === binding.responseExampleId
            ) ?? state.step.responseExamples[0];
            expect(session.submitResponse(choice.id)).not.toBeNull();
            expect(session.continue()).toBe(true);
          } else {
            break;
          }
        }
        expect(session.getState().phase, `${definition.scenario.id} ${binding.responseExampleId}`)
          .toBe("complete");
      }
    }
  });

  it("provides complete launched-locale overlays and only established relationship roles", () => {
    const expectedRoles = new Set(["coworker", "classmate", "participant"]);
    const actualRoles = new Set(seasonalConversationDefinitions.flatMap(({ scenario }) => [
      scenario.relationship.learnerRole,
      scenario.relationship.partnerRole
    ]));
    expect(actualRoles).toEqual(expectedRoles);

    for (const text of allLearnerTexts(seasonalConversationDefinitions)) {
      expect(text.textZh.trim()).not.toBe("");
      expect(text.textI18n?.ja?.trim()).toBeTruthy();
      expect(text.textI18n?.en?.trim()).toBeTruthy();
      for (const locale of ["zh-Hant", "ja", "en"] as const) {
        expect(localizeConversationLearnerText(text, locale).trim()).not.toBe("");
      }
    }
    for (const family of seasonalConversationFamilies) {
      for (const text of [family.title, family.note]) {
        expect(text.textI18n?.ja?.trim()).toBeTruthy();
        expect(text.textI18n?.en?.trim()).toBeTruthy();
      }
    }
  });

  it("does not attach exact-day language to the broad before/after windows", () => {
    const exactTiming = /明日|昨日|今週末|来週|tomorrow|yesterday|this weekend|next week/i;
    for (const family of seasonalConversationFamilies) {
      const beforeAndAfter = [family.definitions[0], family.definitions[2]];
      for (const text of allLearnerTexts(beforeAndAfter)) {
        expect(text.textZh, family.event.id).not.toMatch(exactTiming);
        expect(text.textI18n?.ja, family.event.id).not.toMatch(exactTiming);
        expect(text.textI18n?.en, family.event.id).not.toMatch(exactTiming);
      }
      for (const definition of beforeAndAfter) {
        for (const step of definition.scenario.steps) {
          if (step.kind === "partner_line") expect(step.japanese).not.toMatch(exactTiming);
          if (step.kind === "learner_response") {
            for (const example of step.responseExamples) expect(example.japanese).not.toMatch(exactTiming);
          }
        }
      }
    }
  });
});
