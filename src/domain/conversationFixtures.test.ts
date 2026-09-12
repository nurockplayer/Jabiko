import { describe, expect, it } from "vitest";
import {
  conversationScenarios,
  conversationSessionDefinitions,
} from "./conversationFixtures";
import {
  createConversationSession,
  validateConversationSessionDefinitions,
} from "./conversationSession";
import {
  isConversationSkillId,
  localizeConversationLearnerText,
  validateConversationScenarios,
  type ConversationLearnerText,
  type ConversationScenario,
  type ConversationStep,
} from "./conversationScenario";

const DIFFICULTY_KEYS = [
  "linguisticComplexity",
  "partnerSupport",
  "relationshipDistance",
  "topicDepth",
  "interactionPressure",
] as const;

function reachableStepIds(scenario: ConversationScenario): readonly string[] {
  const stepsById = new Map<string, ConversationStep>(
    scenario.steps.map((step) => [step.id, step])
  );
  const reachable = new Set<string>();
  const pending = [scenario.startStepId];

  while (pending.length > 0) {
    const stepId = pending.pop() as string;
    if (reachable.has(stepId)) continue;
    const step = stepsById.get(stepId);
    if (step == null) continue;
    reachable.add(stepId);

    if (step.kind === "partner_line") {
      pending.push(step.nextStepId);
    } else if (step.kind === "learner_response") {
      pending.push(...step.branches.map((branch) => branch.nextStepId));
    }
  }

  return [...reachable];
}

function learnerTextFields(scenario: ConversationScenario): readonly ConversationLearnerText[] {
  const fields: ConversationLearnerText[] = [
    scenario.situation,
    scenario.relationship.context,
    scenario.objective,
    scenario.instruction,
  ];

  for (const step of scenario.steps) {
    if (step.kind === "learner_response") fields.push(step.prompt);
    if (step.kind === "completion") fields.push(step.summary);
  }

  return fields;
}

describe("representative conversation fixtures", () => {
  it("ships exactly one short, medium, and long learning job", () => {
    expect(conversationScenarios).toHaveLength(3);
    expect(conversationScenarios.map(({ length }) => length)).toEqual([
      "short",
      "medium",
      "long",
    ]);
    expect(conversationSessionDefinitions).toHaveLength(3);
    expect(conversationSessionDefinitions.map(({ scenario }) => scenario)).toEqual(
      conversationScenarios
    );
  });

  it("keeps every scenario id fixture-scoped and stable", () => {
    for (const scenario of conversationScenarios) {
      expect(scenario.id).toMatch(/^fx-/);
    }
    expect(new Set(conversationScenarios.map(({ id }) => id)).size).toBe(3);
  });

  it("keeps the five difficulty dimensions available for every fixture", () => {
    for (const scenario of conversationScenarios) {
      expect(Object.keys(scenario.difficulty)).toEqual([...DIFFICULTY_KEYS]);
    }
  });

  it("gives each length class a distinct objective and conversation graph", () => {
    const objectives = conversationScenarios.map(({ objective }) => objective.textZh);
    expect(new Set(objectives).size).toBe(3);

    const graphSignatures = conversationScenarios.map((scenario) =>
      scenario.steps.map((step) => step.id).join(">")
    );
    expect(new Set(graphSignatures).size).toBe(3);

    const learnerTurnCounts = conversationScenarios.map(
      (scenario) => scenario.steps.filter((step) => step.kind === "learner_response").length
    );
    expect(learnerTurnCounts[0]).toBe(1);
    expect(learnerTurnCounts[1]).toBeGreaterThanOrEqual(2);
    expect(learnerTurnCounts[2]).toBeGreaterThanOrEqual(3);
    expect(new Set(learnerTurnCounts).size).toBe(3);
  });

  it("keeps the long fixture a several-turn scenario instead of an immediate completion", () => {
    const longScenario = conversationScenarios[2];
    expect(longScenario.length).toBe("long");
    expect(longScenario.primarySkills).toEqual(
      expect.arrayContaining(["narrate", "opinion", "negotiate"])
    );

    const startStep = longScenario.steps.find((step) => step.id === longScenario.startStepId);
    expect(startStep?.kind).toBe("partner_line");
    expect(
      longScenario.steps.filter((step) => step.kind === "learner_response").length
    ).toBeGreaterThanOrEqual(3);
  });

  it("validates the scenario graphs without broken references", () => {
    expect(validateConversationScenarios(conversationScenarios)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("binds one authored response to every reachable learner step", () => {
    expect(validateConversationSessionDefinitions(conversationSessionDefinitions)).toEqual({
      valid: true,
      errors: [],
    });

    for (const definition of conversationSessionDefinitions) {
      const { scenario } = definition;
      const reachableLearnerStepIds = reachableStepIds(scenario).filter(
        (stepId) =>
          scenario.steps.find((step) => step.id === stepId)?.kind === "learner_response"
      );
      expect(reachableLearnerStepIds.length).toBeGreaterThan(0);

      const boundStepIds = new Set(definition.responses.map(({ stepId }) => stepId));
      for (const stepId of reachableLearnerStepIds) {
        expect(boundStepIds.has(stepId)).toBe(true);
      }
    }
  });

  it("keeps feedback metadata truthful and independent per authored response", () => {
    for (const definition of conversationSessionDefinitions) {
      const bindingKeys = definition.responses.map(
        ({ stepId, responseExampleId }) => `${stepId}::${responseExampleId}`
      );
      expect(new Set(bindingKeys).size).toBe(bindingKeys.length);
      expect(new Set(definition.responses.map(({ feedback }) => feedback.id)).size).toBe(
        definition.responses.length
      );

      for (const binding of definition.responses) {
        const step = definition.scenario.steps.find(({ id }) => id === binding.stepId);
        expect(step?.kind).toBe("learner_response");
        if (step?.kind !== "learner_response") continue;

        const example = step.responseExamples.find(({ id }) => id === binding.responseExampleId);
        expect(example).toBeDefined();
        expect(binding.feedback.responseJapanese).toBe(example?.japanese);

        const { situation, relationship, discourse } = binding.feedback.context;
        expect(situation.trim()).not.toBe("");
        expect(relationship.trim()).not.toBe("");
        expect(discourse.trim()).not.toBe("");

        const compositionFeatures = binding.feedback.feedback.composition.map(
          ({ feature }) => feature
        );
        expect(new Set(compositionFeatures).size).toBe(compositionFeatures.length);
        for (const signal of binding.feedback.feedback.composition) {
          expect(isConversationSkillId(signal.canonicalSkillId)).toBe(true);
        }
      }
    }
  });

  it("keeps a natural, register-fitting response that still needs continuation work", () => {
    const hasImprovementGap = conversationSessionDefinitions.some((definition) =>
      definition.responses.some(
        ({ feedback }) =>
          feedback.feedback.languageQuality === "natural" &&
          feedback.feedback.continuation === "dead_end" &&
          feedback.feedback.registerContextFit === "fits"
      )
    );
    expect(hasImprovementGap).toBe(true);
  });

  it("provides launched-language overlays for every learner-facing text field", () => {
    for (const scenario of conversationScenarios) {
      for (const field of learnerTextFields(scenario)) {
        expect(field.textI18n?.ja?.trim()).toBeTruthy();
        expect(field.textI18n?.en?.trim()).toBeTruthy();
        expect(localizeConversationLearnerText(field, "ja")).not.toBe(field.textZh);
        expect(localizeConversationLearnerText(field, "en")).not.toBe(field.textZh);
      }
    }
  });

  it("prepares every definition for createConversationSession", () => {
    expect(() => createConversationSession(conversationSessionDefinitions)).not.toThrow();

    for (const definition of conversationSessionDefinitions) {
      expect(() => createConversationSession([definition])).not.toThrow();
      const session = createConversationSession([definition]);
      expect(session.select(definition.scenario.id)).toBe(true);
    }
  });
});
