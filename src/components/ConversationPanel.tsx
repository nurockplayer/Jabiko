import { useState } from "react";
import { conversationCatalogDefinitions } from "../domain/conversationContent/catalog";
import {
  seasonalConversationDefinitions,
  seasonalConversationFamilies
} from "../domain/seasonalConversationContent/catalog";
import { getSeasonalConversationDiscoveryCards } from "../domain/seasonalConversationDiscovery";
import type { ConversationSessionDefinition } from "../domain/conversationSession";
import type { Language } from "../i18n";
import { ConversationExperience } from "./ConversationExperience";

// Small Talk keeps the full discovery, chooser, replay, and catalog behavior in
// this lazy wrapper. ConversationExperience itself has no catalog import and
// can also present a world-bound session from the separate lazy game resource.
const productionSessionDefinitions = [
  ...conversationCatalogDefinitions,
  ...seasonalConversationDefinitions
];

export function ConversationPanel({ language, definitions, referenceInstant }: {
  language: Language;
  definitions?: readonly ConversationSessionDefinition[];
  /** Stable time seam for deterministic discovery tests. */
  referenceInstant?: Date;
}) {
  const [browseInstant, setBrowseInstant] = useState(() => referenceInstant ?? new Date());
  const sessionDefinitions = definitions ?? productionSessionDefinitions;
  const chooserDefinitions = definitions ?? conversationCatalogDefinitions;
  const families = definitions === undefined ? seasonalConversationFamilies : [];
  const discoveryCards = definitions === undefined
    ? getSeasonalConversationDiscoveryCards(families, referenceInstant ?? browseInstant)
    : [];

  return (
    <ConversationExperience
      language={language}
      definitions={sessionDefinitions}
      chooserDefinitions={chooserDefinitions}
      seasonalFamilies={families}
      discoveryCards={discoveryCards}
      showSeasonalDiscovery={definitions === undefined}
      referenceInstant={referenceInstant}
      onRefreshDiscovery={referenceInstant === undefined ? () => setBrowseInstant(new Date()) : undefined}
    />
  );
}
