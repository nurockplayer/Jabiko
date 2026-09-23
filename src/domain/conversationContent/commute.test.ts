import { describe, expect, it } from "vitest";
import type { ConversationLearnerText, ConversationLearnerResponseStep } from "../conversationScenario";
import { resolveConversationNextStep } from "../conversationScenario";
import { validateConversationSessionDefinitions } from "../conversationSession";
import { weatherConversationDefinitions } from "./weather";
import { weekendConversationDefinitions } from "./weekend";
import { schoolWorkConversationDefinitions } from "./schoolWork";
import { foodConversationDefinitions } from "./food";
import { commuteConversationDefinitions } from "./commute";

function collectStableIds(definitions: typeof commuteConversationDefinitions): string[] {
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
  definition: (typeof commuteConversationDefinitions)[number],
  stepId: string
): ConversationLearnerResponseStep {
  const step = definition.scenario.steps.find((candidate) => candidate.id === stepId);
  if (step?.kind !== "learner_response") throw new Error(`Expected learner response step ${stepId}`);
  return step;
}

function learnerTexts(definition: (typeof commuteConversationDefinitions)[number]): ConversationLearnerText[] {
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

describe("commute, train, and neighborhood conversation content", () => {
  it("provides three valid localized scenarios with IDs unique across the content pack", () => {
    expect(commuteConversationDefinitions.map(({ scenario }) => scenario.length)).toEqual([
      "short", "medium", "long"
    ]);
    expect(validateConversationSessionDefinitions(commuteConversationDefinitions)).toEqual({ valid: true, errors: [] });

    const allIds = [
      ...collectStableIds(weatherConversationDefinitions),
      ...collectStableIds(weekendConversationDefinitions),
      ...collectStableIds(schoolWorkConversationDefinitions),
      ...collectStableIds(foodConversationDefinitions),
      ...collectStableIds(commuteConversationDefinitions)
    ];
    expect(new Set(allIds).size).toBe(allIds.length);

    for (const definition of commuteConversationDefinitions) {
      for (const text of learnerTexts(definition)) {
        expect(text.textZh.trim()).not.toBe("");
        expect(text.textZh).not.toMatch(/[\u3040-\u30ff]/);
        expect(text.textI18n?.ja?.trim()).toBeTruthy();
        expect(text.textI18n?.en?.trim()).toBeTruthy();
      }
    }
  });

  it("opens from a shared station context with a low-pressure route question", () => {
    const definition = commuteConversationDefinitions.find(({ scenario }) => scenario.length === "short");
    expect(definition).toBeDefined();
    if (!definition) return;
    expect(definition.scenario.primarySkills).toEqual(["open"]);
    expect(definition.scenario.primarySkills).not.toContain("react");
    const first = definition.scenario.steps.find(({ id }) => id === definition.scenario.startStepId);
    expect(first?.kind).toBe("partner_line");
    if (first?.kind !== "partner_line") return;
    expect(first.japanese).toMatch(/天気/);
    expect(first.japanese).not.toMatch(/ご一緒しましたね|桜町駅|青葉線/);
    const reply = responseStep(definition, "commute-short-station-opening");
    expect(reply.responseExamples.length).toBeGreaterThanOrEqual(2);
    expect(reply.responseExamples.every(({ japanese }) => /駅|路線|通勤/.test(japanese))).toBe(true);
    expect(reply.responseExamples.every(({ japanese }) => /ですか|ますか/.test(japanese))).toBe(true);
    expect(reply.responseExamples.every(({ japanese }) => !/大変ですね/.test(japanese))).toBe(true);
    expect(reply.responseExamples.some(({ japanese }) => /どちらの駅から/.test(japanese))).toBe(true);
    expect(reply.responseExamples.some(({ japanese }) => /路線はよく利用/.test(japanese))).toBe(true);
    expect(reply.responseExamples.every(({ japanese }) => !/同じ路線なんですね/.test(japanese))).toBe(true);
    for (const example of reply.responseExamples) {
      const binding = definition.responses.find(({ responseExampleId }) => responseExampleId === example.id);
      expect(binding?.feedback.responseJapanese).toBe(example.japanese);
      const next = binding && resolveConversationNextStep(definition.scenario, reply.id, binding.branchId);
      expect(next?.kind).toBe("partner_line");
      if (next?.kind === "partner_line") {
        expect(next.japanese).toMatch(/桜町駅|商店街/);
        expect(next.japanese).toMatch(/この路線に乗っています/);
      }
    }
  });

  it("sustains a reciprocal medium commute-choice thread across two responses", () => {
    const definition = commuteConversationDefinitions.find(({ scenario }) => scenario.length === "medium");
    expect(definition).toBeDefined();
    if (!definition) return;
    expect(definition.scenario.primarySkills).toEqual(expect.arrayContaining(["share", "bounce"]));
    const learnerSteps = definition.scenario.steps.filter((step) => step.kind === "learner_response");
    expect(learnerSteps).toHaveLength(2);
    expect(definition.scenario.objective.textI18n?.en).toMatch(/experience|question/i);
    for (const step of learnerSteps) {
      if (step.kind !== "learner_response") continue;
      for (const example of step.responseExamples) {
        const binding = definition.responses.find(({ stepId, responseExampleId }) =>
          stepId === step.id && responseExampleId === example.id
        );
        expect(binding?.feedback.responseJapanese).toBe(example.japanese);
        const next = binding && resolveConversationNextStep(definition.scenario, step.id, binding.branchId);
        expect(next?.kind).toBe("partner_line");
        if (next?.kind === "partner_line" && step.id === learnerSteps[0]?.id) {
          expect(next.japanese).toMatch(/自転車だと職場まで/);
          expect(next.japanese).toMatch(/十五分/);
        }
        if (next?.kind === "partner_line" && step.id === learnerSteps[1]?.id) {
          expect(next.japanese).toMatch(/雨の日/);
          expect(next.japanese).toMatch(/桜町駅/);
        }
      }
    }
    const eveningReply = responseStep(definition, "commute-medium-return-response");
    expect(eveningReply.responseExamples.every(({ japanese }) => !japanese.includes("私も立つ"))).toBe(true);
  });

  it("supports a nuanced first-meeting route and neighborhood comparison", () => {
    const definition = commuteConversationDefinitions.find(({ scenario }) => scenario.length === "long");
    expect(definition).toBeDefined();
    if (!definition) return;
    expect(definition.scenario.primarySkills).toEqual(["share", "bounce", "expand", "opinion"]);
    expect(definition.scenario.difficulty.linguisticComplexity).toBe("intermediate");
    expect(definition.scenario.difficulty.relationshipDistance).toBe("neutral");
    expect(definition.scenario.relationship.context.textI18n?.en).toMatch(/just met|newly met/i);
    expect(definition.scenario.objective.textI18n?.en).toMatch(/compare|clarify/i);
    const allJapanese = definition.scenario.steps
      .filter((step) => step.kind !== "completion")
      .map((step) => step.kind === "partner_line" ? step.japanese : step.responseExamples.map(({ japanese }) => japanese).join(" "))
      .join(" ");
    expect(allJapanese).toMatch(/青葉|桜町/);
    expect(allJapanese).not.toMatch(/\d時\d分|毎日[0-9０-９]+分/);
    const responseSteps = definition.scenario.steps.filter((step) => step.kind === "learner_response");
    expect(responseSteps).toHaveLength(3);
    for (const step of responseSteps) {
      if (step.kind !== "learner_response") continue;
      for (const example of step.responseExamples) {
        const binding = definition.responses.find(({ stepId, responseExampleId }) =>
          stepId === step.id && responseExampleId === example.id
        );
        expect(binding?.feedback.responseJapanese).toBe(example.japanese);
        expect(binding?.feedback.context.situation.trim()).not.toBe("");
        const next = binding && resolveConversationNextStep(definition.scenario, step.id, binding.branchId);
        expect(next?.kind).toMatch(/partner_line|completion/);
        if (next?.kind === "partner_line" && step.id === "commute-long-needs-response") {
          expect(next.japanese).toMatch(/中央駅/);
          expect(next.japanese).toMatch(/食材/);
        }
        if (next?.kind === "partner_line" && step.id === "commute-long-station-comparison-response") {
          expect(next.japanese).toMatch(/買い物/);
          expect(next.japanese).toMatch(/乗り換え/);
        }
        if (next?.kind === "partner_line" && step.id === "commute-long-route-answer-response") {
          expect(next.japanese).toMatch(/ありがとうございます/);
          expect(next.japanese).toMatch(/桜町駅/);
        }
      }
    }
    const needsStep = responseStep(definition, "commute-long-needs-response");
    expect(needsStep.responseExamples.every(({ japanese }) => !/私も|私は/.test(japanese))).toBe(true);
    const needsReply = definition.scenario.steps.find(({ id }) => id === "commute-long-needs-reply");
    expect(needsReply?.kind).toBe("partner_line");
    if (needsReply?.kind === "partner_line") {
      expect(needsReply.japanese).toMatch(/通勤を優先/);
      expect(needsReply.japanese).toMatch(/食材/);
    }
    const needsBindings = definition.responses.filter(({ stepId }) => stepId === needsStep.id);
    expect(needsBindings.every(({ feedback }) =>
      feedback.feedback.composition.some(({ feature, canonicalSkillId }) => feature === "ask" && canonicalSkillId === "bounce")
    )).toBe(true);
    const comparisonBindings = definition.responses.filter(({ stepId }) => stepId === "commute-long-station-comparison-response");
    expect(comparisonBindings.every(({ feedback }) =>
      feedback.feedback.composition.some(({ canonicalSkillId }) => canonicalSkillId === "opinion")
        && feedback.feedback.composition.some(({ feature, canonicalSkillId }) => feature === "ask" && canonicalSkillId === "bounce")
    )).toBe(true);
    const commutePriorityOption = responseStep(definition, "commute-long-station-comparison-response")
      .responseExamples.find(({ id }) => id === "commute-long-compare-distance-shopping");
    expect(commutePriorityOption?.japanese).toMatch(/通勤を優先.*青葉駅.*(?:使いやす|向いて|便利)/);
    expect(commutePriorityOption?.explanation?.textI18n?.en).toMatch(/commute priority|prioritizes the commute/i);
    const routeAnswerBindings = definition.responses.filter(({ stepId }) => stepId === "commute-long-route-answer-response");
    expect(routeAnswerBindings.every(({ feedback }) =>
      feedback.feedback.composition.some(({ feature, canonicalSkillId }) => feature === "add" && canonicalSkillId === "expand")
    )).toBe(true);
  });
});
