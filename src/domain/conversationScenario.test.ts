import { describe, expect, it } from "vitest";
import {
  CONVERSATION_SKILLS,
  type ConversationLength,
  type ConversationScenario,
  isConversationSkillId,
  localizeConversationLearnerText,
  resolveConversationNextStep,
  validateConversationScenarios,
} from "./conversationScenario";

function createScenario(id: string, length: ConversationLength): ConversationScenario {
  return {
    id,
    topic: "weather",
    world: "school",
    situation: {
      textZh: "上課前和同學一起走進教室。",
      textI18n: {
        en: "Walking into class with a classmate before the lesson.",
        ja: "授業前にクラスメートと一緒に教室へ入る。",
      },
    },
    relationship: {
      learnerRole: "classmate",
      partnerRole: "classmate",
      context: {
        textZh: "平常會聊天的同學。",
        textI18n: {
          en: "A classmate the learner chats with regularly.",
          ja: "普段から話すクラスメート。",
        },
      },
    },
    length,
    primarySkills: ["open"],
    difficulty: {
      linguisticComplexity: "basic",
      partnerSupport: "supportive",
      relationshipDistance: "familiar",
      topicDepth: "concrete",
      interactionPressure: "low",
    },
    objective: {
      textZh: "用共同情境自然地開始對話。",
      textI18n: {
        en: "Open naturally from the shared situation.",
        ja: "共有している状況から自然に会話を始める。",
      },
    },
    instruction: {
      textZh: "說一句讓對方容易接話的話。",
      textI18n: {
        en: "Say something the partner can easily respond to.",
        ja: "相手が返しやすい一言を言いましょう。",
      },
    },
    startStepId: "partner-arrives",
    steps: [
      {
        id: "partner-arrives",
        kind: "partner_line",
        japanese: "今日も暑いですね。",
        nextStepId: "learner-opens",
      },
      {
        id: "learner-opens",
        kind: "learner_response",
        prompt: {
          textZh: "回應並延續這個話題。",
          textI18n: {
            en: "Respond and keep this topic going.",
            ja: "返事をして、この話題を続けましょう。",
          },
        },
        responseExamples: [
          {
            id: "shared-experience",
            kind: "suggested",
            japanese: "本当ですね。朝から暑かったです。",
          },
        ],
        branches: [{ id: "continue", nextStepId: "complete" }],
        defaultBranchId: "continue",
      },
      {
        id: "complete",
        kind: "completion",
        summary: {
          textZh: "從共同情境開始了一段對話。",
          textI18n: {
            en: "Opened a conversation from a shared situation.",
            ja: "共有している状況から会話を始めた。",
          },
        },
      },
    ],
    seasonalAssociation: { eventId: "summer-heat" },
    sources: [
      {
        title: "Event background",
        url: "https://example.com/event-background",
        accessedOn: "2026-08-30",
      },
    ],
  };
}

describe("conversation scenario contract", () => {
  it("represents valid short, medium, and long scenarios with explicit context", () => {
    const scenarios = [
      createScenario("weather-short", "short"),
      createScenario("weather-medium", "medium"),
      createScenario("weather-long", "long"),
    ];

    expect(validateConversationScenarios(scenarios)).toEqual({ valid: true, errors: [] });
    expect(scenarios.map((scenario) => scenario.length)).toEqual(["short", "medium", "long"]);
    expect(scenarios[0]?.difficulty).toEqual({
      linguisticComplexity: "basic",
      partnerSupport: "supportive",
      relationshipDistance: "familiar",
      topicDepth: "concrete",
      interactionPressure: "low",
    });
  });

  it("exposes only the canonical conversation skill taxonomy", () => {
    expect(CONVERSATION_SKILLS).toEqual([
      "open",
      "react",
      "expand",
      "share",
      "bounce",
      "transition",
      "repair",
      "join",
      "exit",
      "narrate",
      "opinion",
      "agree_disagree",
      "negotiate",
      "register_adapt",
    ]);
    expect(isConversationSkillId("share")).toBe(true);
    expect(["answer", "add", "ask"].map(isConversationSkillId)).toEqual([false, false, false]);
  });

  it("rejects duplicate scenario ids, non-canonical skills, and broken step references", () => {
    const first = createScenario("duplicate", "short");
    const invalid = {
      ...createScenario("duplicate", "medium"),
      primarySkills: ["answer"],
      steps: [
        {
          id: "partner-arrives",
          kind: "partner_line",
          japanese: "今日も暑いですね。",
          nextStepId: "missing-step",
        },
      ],
    } as unknown as ConversationScenario;

    expect(validateConversationScenarios([first, invalid])).toEqual({
      valid: false,
      errors: [
        { code: "duplicate_scenario_id", scenarioId: "duplicate" },
        {
          code: "invalid_skill_reference",
          scenarioId: "duplicate",
          referenceId: "answer",
        },
        {
          code: "broken_step_reference",
          scenarioId: "duplicate",
          stepId: "partner-arrives",
          referenceId: "missing-step",
        },
      ],
    });
  });

  it("resolves direct and selected curated branches deterministically", () => {
    const scenario = createScenario("weather-branching", "short");

    expect(resolveConversationNextStep(scenario, "partner-arrives")?.id).toBe(
      "learner-opens"
    );
    expect(resolveConversationNextStep(scenario, "learner-opens", "continue")?.id).toBe(
      "complete"
    );
    expect(resolveConversationNextStep(scenario, "learner-opens")?.id).toBe("complete");
    expect(resolveConversationNextStep(scenario, "complete")).toBeNull();
  });

  it("reads learner-facing content through the existing locale fallback contract", () => {
    const scenario = createScenario("weather-localized", "short");

    expect(localizeConversationLearnerText(scenario.instruction, "en")).toBe(
      "Say something the partner can easily respond to."
    );
    expect(localizeConversationLearnerText(scenario.instruction, "zh-Hant")).toBe(
      "說一句讓對方容易接話的話。"
    );
    expect(localizeConversationLearnerText(scenario.instruction, "th")).toBe(
      "說一句讓對方容易接話的話。"
    );
  });

  it("rejects duplicate nested ids and every broken deterministic branch reference", () => {
    const base = createScenario("broken-graph", "medium");
    const learnerStep = base.steps[1];
    if (learnerStep?.kind !== "learner_response") throw new Error("fixture must contain a prompt");

    const scenario: ConversationScenario = {
      ...base,
      startStepId: "missing-start",
      steps: [
        base.steps[0]!,
        { ...base.steps[2]!, id: "partner-arrives" },
        {
          ...learnerStep,
          responseExamples: [
            learnerStep.responseExamples[0]!,
            { ...learnerStep.responseExamples[0]! },
          ],
          branches: [
            { id: "continue", nextStepId: "missing-step" },
            { id: "continue", nextStepId: "partner-arrives" },
          ],
          defaultBranchId: "missing-branch",
        },
      ],
    };

    const result = validateConversationScenarios([scenario]);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual([
      "duplicate_step_id",
      "broken_start_step_reference",
      "duplicate_response_example_id",
      "broken_step_reference",
      "duplicate_branch_id",
      "broken_default_branch_reference",
    ]);
  });

  it("requires at least one primary canonical skill", () => {
    const scenario = { ...createScenario("no-primary-skill", "short"), primarySkills: [] };

    expect(validateConversationScenarios([scenario])).toEqual({
      valid: false,
      errors: [{ code: "missing_primary_skill", scenarioId: "no-primary-skill" }],
    });
  });

  it("keeps seasonal association optional and supports source provenance metadata", () => {
    const seasonal = createScenario("seasonal", "short");
    const timeless = createScenario("timeless", "short");
    delete timeless.seasonalAssociation;
    delete timeless.sources;

    expect(validateConversationScenarios([seasonal, timeless]).valid).toBe(true);
    expect(seasonal.seasonalAssociation).toEqual({ eventId: "summer-heat" });
    expect(seasonal.sources).toEqual([
      {
        title: "Event background",
        url: "https://example.com/event-background",
        accessedOn: "2026-08-30",
      },
    ]);
  });
});
