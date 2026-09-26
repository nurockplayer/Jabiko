import {
  selectRelevantSeasonalEvents,
  type SeasonalEventPhase
} from "./seasonalEvents";
import type { ConversationSessionDefinition } from "./conversationSession";
import type { ConversationLearnerText } from "./conversationScenario";
import type { SeasonalConversationFamily } from "./seasonalConversationContent/catalog";

export type SeasonalConversationDiscoveryPhase = "now" | "coming_soon" | "recent";

export interface SeasonalConversationDiscoveryCard {
  eventId: string;
  scenarioId: string;
  phase: SeasonalConversationDiscoveryPhase;
  title: ConversationLearnerText;
  note: ConversationLearnerText;
  definition: ConversationSessionDefinition;
}

const MAX_DISCOVERY_CARDS = 4;

/** Resolves bounded #816 relevance results to their authored family content. */
export function getSeasonalConversationDiscoveryCards(
  families: readonly SeasonalConversationFamily[],
  referenceInstant: Date
): SeasonalConversationDiscoveryCard[] {
  const relevantEvents = selectRelevantSeasonalEvents(
    families.map(({ event }) => event),
    referenceInstant
  );
  const cards: SeasonalConversationDiscoveryCard[] = [];

  for (const relevantEvent of relevantEvents) {
    const matchingFamilies = families.filter(({ event }) => event.id === relevantEvent.eventId);
    if (matchingFamilies.length !== 1) continue;
    const family = matchingFamilies[0];
    if (family == null || relevantEvent.contentIds.length === 0) continue;

    const resolvedDefinitions: ConversationSessionDefinition[] = [];
    let associationIsComplete = true;
    for (const contentId of relevantEvent.contentIds) {
      const matches = family.definitions.filter(({ scenario }) => scenario.id === contentId);
      if (matches.length !== 1) {
        associationIsComplete = false;
        break;
      }
      resolvedDefinitions.push(matches[0]);
    }
    if (!associationIsComplete || resolvedDefinitions.length === 0) continue;

    const definition = resolvedDefinitions[0];
    if (definition == null) continue;
    cards.push({
      eventId: relevantEvent.eventId,
      scenarioId: definition.scenario.id,
      phase: mapPhase(relevantEvent.phase),
      title: family.title,
      note: family.note,
      definition
    });
    if (cards.length === MAX_DISCOVERY_CARDS) break;
  }

  return cards;
}

function mapPhase(phase: SeasonalEventPhase): SeasonalConversationDiscoveryPhase {
  switch (phase) {
    case "active":
      return "now";
    case "imminent":
    case "upcoming":
      return "coming_soon";
    case "recent":
      return "recent";
  }
}
