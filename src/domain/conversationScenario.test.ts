import { describe, expect, it } from "vitest";
import {
  type ConversationLength,
  type ConversationScenario,
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
      distance: "familiar",
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
});
