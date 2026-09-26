import { describe, expect, it } from "vitest";
import { conversationSessionDefinitions } from "../conversationFixtures";
import { validateConversationSessionDefinitions } from "../conversationSession";
import { conversationCatalogDefinitions, conversationProductionDefinitions } from "./catalog";

describe("conversation content catalog", () => {
  it("adds eighteen production definitions to the three existing fixtures", () => {
    expect(conversationProductionDefinitions).toHaveLength(18);
    expect(conversationCatalogDefinitions).toHaveLength(21);
    expect(conversationCatalogDefinitions.slice(0, conversationSessionDefinitions.length))
      .toEqual(conversationSessionDefinitions);
    expect(conversationCatalogDefinitions.slice(conversationSessionDefinitions.length))
      .toEqual(conversationProductionDefinitions);
    expect(validateConversationSessionDefinitions(conversationCatalogDefinitions))
      .toEqual({ valid: true, errors: [] });
  });

  it("keeps authored scenario and runtime reference IDs unique across the full catalog", () => {
    const ids = conversationCatalogDefinitions.flatMap(({ scenario, responses }) => [
      scenario.id,
      ...scenario.steps.flatMap((step) => [
        step.id,
        ...(step.kind === "learner_response"
          ? [
            ...step.responseExamples.map(({ id }) => id),
            ...step.branches.map(({ id }) => id)
          ]
          : [])
      ]),
      ...responses.map(({ feedback }) => feedback.id)
    ]);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
