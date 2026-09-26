import { conversationSessionDefinitions } from "../conversationFixtures";
import type { ConversationSessionDefinition } from "../conversationSession";
import { commuteConversationDefinitions } from "./commute";
import { foodConversationDefinitions } from "./food";
import { hobbiesConversationDefinitions } from "./hobbies";
import { schoolWorkConversationDefinitions } from "./schoolWork";
import { weatherConversationDefinitions } from "./weather";
import { weekendConversationDefinitions } from "./weekend";

export const conversationProductionDefinitions: readonly ConversationSessionDefinition[] = [
  ...commuteConversationDefinitions,
  ...foodConversationDefinitions,
  ...hobbiesConversationDefinitions,
  ...schoolWorkConversationDefinitions,
  ...weatherConversationDefinitions,
  ...weekendConversationDefinitions
];

export const conversationCatalogDefinitions: readonly ConversationSessionDefinition[] = [
  ...conversationSessionDefinitions,
  ...conversationProductionDefinitions
];
