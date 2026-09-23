import { describe, expect, it } from "vitest";
import type { ConversationLearnerText, ConversationLearnerResponseStep } from "../conversationScenario";
import { resolveConversationNextStep } from "../conversationScenario";
import { validateConversationSessionDefinitions } from "../conversationSession";
import { weatherConversationDefinitions } from "./weather";
import { weekendConversationDefinitions } from "./weekend";
import { schoolWorkConversationDefinitions } from "./schoolWork";
import { foodConversationDefinitions } from "./food";

function collectStableIds(definitions: typeof foodConversationDefinitions): string[] {
  return definitions.flatMap(({ scenario, responses }) => [
    scenario.id,
    ...scenario.steps.flatMap((step) => [
      step.id,
      ...(step.kind === "learner_response"
        ? [...step.responseExamples.map(({ id }) => id), ...step.branches.map(({ id }) => id)]
        : [])
    ]),
    ...responses.map(({ feedback }) => feedback.id)
  ]);
}

function responseStep(
  definition: (typeof foodConversationDefinitions)[number],
  stepId: string
): ConversationLearnerResponseStep {
  const step = definition.scenario.steps.find((candidate) => candidate.id === stepId);
  if (step?.kind !== "learner_response") throw new Error(`Expected learner response step ${stepId}`);
  return step;
}

function localizedTexts(definition: (typeof foodConversationDefinitions)[number]): ConversationLearnerText[] {
  const texts: ConversationLearnerText[] = [
    definition.scenario.situation,
    definition.scenario.relationship.context,
    definition.scenario.objective,
    definition.scenario.instruction
  ];
  for (const step of definition.scenario.steps) {
    if (step.kind === "completion") texts.push(step.summary);
    if (step.kind === "learner_response") {
      texts.push(step.prompt);
      for (const example of step.responseExamples) {
        if (example.explanation) texts.push(example.explanation);
      }
    }
  }
  return texts;
}

describe("food, lunch, and restaurant conversation content", () => {
  it("provides three valid localized scenarios with globally unique stable IDs", () => {
    expect(foodConversationDefinitions.map(({ scenario }) => scenario.length)).toEqual([
      "short", "medium", "long"
    ]);
    expect(validateConversationSessionDefinitions(foodConversationDefinitions)).toEqual({ valid: true, errors: [] });

    const allIds = [
      ...collectStableIds(weatherConversationDefinitions),
      ...collectStableIds(weekendConversationDefinitions),
      ...collectStableIds(schoolWorkConversationDefinitions),
      ...collectStableIds(foodConversationDefinitions)
    ];
    expect(new Set(allIds).size).toBe(allIds.length);

    for (const definition of foodConversationDefinitions) {
      for (const text of localizedTexts(definition)) {
        expect(text.textZh.trim()).not.toBe("");
        expect(text.textZh).not.toMatch(/[\u3040-\u30ff]/);
        expect(text.textI18n?.ja?.trim()).toBeTruthy();
        expect(text.textI18n?.en?.trim()).toBeTruthy();
      }
    }
  });

  it("uses a short clarification whose common answer resolves each accepted question", () => {
    const definition = foodConversationDefinitions.find(({ scenario }) => scenario.length === "short");
    expect(definition).toBeDefined();
    if (!definition) return;
    const prompt = responseStep(definition, "food-short-daily-special-response");
    expect(definition.scenario.primarySkills).toEqual(["repair"]);
    expect(prompt.responseExamples.length).toBeGreaterThanOrEqual(2);

    for (const example of prompt.responseExamples) {
      const binding = definition.responses.find(({ responseExampleId }) => responseExampleId === example.id);
      expect(binding?.feedback.responseJapanese).toBe(example.japanese);
      expect(binding?.feedback.feedback.continuation).toBe("opens_thread");
      const answer = binding && resolveConversationNextStep(definition.scenario, prompt.id, binding.branchId);
      expect(answer?.kind).toBe("partner_line");
      if (answer?.kind === "partner_line") {
        expect(answer.japanese).toMatch(/日替わり|毎日/);
        expect(answer.japanese).toMatch(/ご飯|ごはん/);
        expect(answer.japanese).toMatch(/今日.*焼き魚/);
      }
    }
    const todayDish = prompt.responseExamples.find(({ id }) => id === "food-short-daily-special-today");
    expect(todayDish?.japanese).toMatch(/日替わり定食/);
    expect(todayDish?.japanese).toMatch(/分からない/);
    expect(todayDish?.japanese).toMatch(/今日.*料理/);
    expect(todayDish?.explanation?.textI18n?.en).toMatch(/not sure|still unsure|do not know|unclear/i);
  });

  it("simulates every medium recommendation response through the shared reply path", () => {
    const definition = foodConversationDefinitions.find(({ scenario }) => scenario.length === "medium");
    expect(definition).toBeDefined();
    if (!definition) return;
    const firstTurn = responseStep(definition, "food-medium-lunch-preference-response");
    const secondTurn = responseStep(definition, "food-medium-lunch-recommendation-response");
    expect(definition.scenario.primarySkills).toEqual(["share", "bounce"]);

    for (const step of [firstTurn, secondTurn]) {
      for (const example of step.responseExamples) {
        const binding = definition.responses.find(({ responseExampleId }) => responseExampleId === example.id);
        expect(binding?.feedback.responseJapanese).toBe(example.japanese);
        const next = binding && resolveConversationNextStep(definition.scenario, step.id, binding.branchId);
        expect(next?.kind).toBe("partner_line");
        if (next?.kind === "partner_line" && step.id === firstTurn.id) {
          expect(next.japanese).toMatch(/ゆっくり話|座って/);
          expect(next.japanese).toMatch(/魚料理/);
          expect(next.japanese).toMatch(/千五百円/);
        }
        if (next?.kind === "partner_line" && step.id === secondTurn.id) {
          expect(next.japanese).toMatch(/その店|そこ/);
          expect(next.japanese).toMatch(/魚|予算/);
        }
      }
    }
    const sharedReply = definition.scenario.steps.find((step) => step.id === "food-medium-lunch-response");
    expect(sharedReply?.kind).toBe("partner_line");
    if (sharedReply?.kind === "partner_line") {
      expect(sharedReply.japanese).toContain("友人");
      expect(sharedReply.japanese).not.toContain("ご友人");
    }
    const firstRecommendationBindings = definition.responses.filter(({ stepId }) => stepId === firstTurn.id);
    for (const binding of firstRecommendationBindings) {
      expect(binding.feedback.feedback.composition).toEqual([
        { feature: "answer", canonicalSkillId: "share" },
        { feature: "add", canonicalSkillId: "share" },
        { feature: "ask", canonicalSkillId: "bounce" }
      ]);
    }
    const secondRecommendationBindings = definition.responses.filter(({ stepId }) => stepId === secondTurn.id);
    for (const binding of secondRecommendationBindings) {
      expect(binding.feedback.feedback.composition).toEqual([
        { feature: "answer", canonicalSkillId: "share" },
        { feature: "add", canonicalSkillId: "share" },
        { feature: "ask", canonicalSkillId: "bounce" }
      ]);
    }
    expect(secondTurn.responseExamples[0]?.japanese).toMatch(/駅前の魚定食の店/);
    expect(secondTurn.responseExamples[1]?.japanese).toMatch(/商店街の和食食堂なら/);
    expect(secondTurn.responseExamples.every(({ japanese }) => !/^.*(?:店|食堂)も/.test(japanese))).toBe(true);
    expect(secondTurn.responseExamples[1]?.explanation?.textI18n?.en).not.toMatch(/another|alternative/i);
  });

  it("makes long lunch negotiation use a real time constraint and respectful register", () => {
    const definition = foodConversationDefinitions.find(({ scenario }) => scenario.length === "long");
    expect(definition).toBeDefined();
    if (!definition) return;
    expect(definition.scenario.primarySkills).toEqual(expect.arrayContaining(["negotiate", "register_adapt"]));
    expect(definition.scenario.difficulty.linguisticComplexity).toBe("intermediate");
    const responseSteps = definition.scenario.steps.filter((step) => step.kind === "learner_response");
    expect(responseSteps).toHaveLength(3);
    const firstTurn = responseStep(definition, "food-long-time-constraint-response");
    for (const example of firstTurn.responseExamples) {
      expect(example.japanese).toMatch(/会議|打ち合わせ/);
      expect(example.japanese).toMatch(/三十分|30分/);
      const binding = definition.responses.find(({ responseExampleId }) => responseExampleId === example.id);
      const partnerReply = binding && resolveConversationNextStep(definition.scenario, firstTurn.id, binding.branchId);
      expect(partnerReply?.kind).toBe("partner_line");
      if (partnerReply?.kind === "partner_line") expect(partnerReply.japanese).not.toMatch(/行きましょう|そうしましょう/);
    }
    const negotiate = responseStep(definition, "food-long-lunch-negotiation-response");
    for (const example of negotiate.responseExamples) {
      expect(example.japanese).toMatch(/ラーメン|昼食/);
      expect(example.japanese).toMatch(/今度|別の日|余裕のある日/);
      const binding = definition.responses.find(({ responseExampleId }) => responseExampleId === example.id);
      expect(binding?.feedback.responseJapanese).toBe(example.japanese);
      const partnerReply = binding && resolveConversationNextStep(definition.scenario, negotiate.id, binding.branchId);
      expect(partnerReply?.kind).toBe("partner_line");
      if (partnerReply?.kind === "partner_line") {
        expect(partnerReply.japanese).toMatch(/社食/);
        expect(partnerReply.japanese).toMatch(/ラーメン.*今度/);
        expect(partnerReply.japanese).not.toMatch(/駅前|味噌|魚/);
      }
    }
    const timeFitExample = negotiate.responseExamples.find(({ id }) => id === "food-long-lunch-negotiate-cafeteria");
    expect(timeFitExample?.japanese).toContain("午後の会議に間に合うよう");
    expect(timeFitExample?.japanese).not.toContain("会議に戻る");
    const timeFitBinding = definition.responses.find(({ responseExampleId }) => responseExampleId === timeFitExample?.id);
    expect(timeFitBinding?.feedback.responseJapanese).toBe(timeFitExample?.japanese);
  });
});
