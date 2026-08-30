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
  const baseScenario: ConversationScenario = {
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
  };

  if (length === "short") {
    return {
      ...baseScenario,
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

  if (length === "medium") {
    return {
      ...baseScenario,
      topic: "hobbies",
      situation: {
        textZh: "課後和剛開始熟悉的同學聊最近的興趣。",
        textI18n: {
          en: "Talking about recent interests with a classmate after class.",
          ja: "授業後、少しずつ親しくなっているクラスメートと最近の趣味を話す。",
        },
      },
      relationship: {
        learnerRole: "classmate",
        partnerRole: "classmate",
        context: {
          textZh: "剛開始會在下課後聊天的同學。",
          textI18n: {
            en: "A classmate the learner has recently started talking with after class.",
            ja: "最近、授業後に話すようになったクラスメート。",
          },
        },
      },
      primarySkills: ["share", "expand", "bounce"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "neutral",
        topicDepth: "personal",
        interactionPressure: "normal",
      },
      objective: {
        textZh: "延續同一話題，並把對話責任交還給對方。",
        textI18n: {
          en: "Sustain a thread and return conversational responsibility to the partner.",
          ja: "一つの話題を続け、会話の役割を相手に返す。",
        },
      },
      instruction: {
        textZh: "回答、補充細節，再問對方相關的問題。",
        textI18n: {
          en: "Answer, add a relevant detail, and ask the partner about the same topic.",
          ja: "答えに関連する情報を加え、同じ話題について相手にも聞きましょう。",
        },
      },
      startStepId: "partner-starts",
      steps: [
        {
          id: "partner-starts",
          kind: "partner_line",
          japanese: "最近、何かハマってるものあります？",
          nextStepId: "learner-shares",
        },
        {
          id: "learner-shares",
          kind: "learner_response",
          prompt: {
            textZh: "回答並補充一個讓對方能追問的細節。",
            textI18n: {
              en: "Answer and add one detail the partner can follow up on.",
              ja: "答えて、相手が質問を続けられる情報を一つ加えましょう。",
            },
          },
          responseExamples: [
            {
              id: "camera-hobby",
              kind: "suggested",
              japanese: "最近、写真を撮るのにハマっています。休みの日によく散歩しながら撮ります。",
            },
          ],
          branches: [{ id: "continue", nextStepId: "partner-follows-up" }],
          defaultBranchId: "continue",
        },
        {
          id: "partner-follows-up",
          kind: "partner_line",
          japanese: "どんな写真を撮るんですか？",
          nextStepId: "learner-bounces",
        },
        {
          id: "learner-bounces",
          kind: "learner_response",
          prompt: {
            textZh: "回答追問，然後把話題交還給對方。",
            textI18n: {
              en: "Answer the follow-up, then return the topic to the partner.",
              ja: "質問に答えてから、同じ話題を相手に返しましょう。",
            },
          },
          responseExamples: [
            {
              id: "street-photos-and-ask-back",
              kind: "suggested",
              japanese: "街の写真が多いです。○○さんは何か撮りますか？",
            },
          ],
          branches: [{ id: "return-ball", nextStepId: "partner-answers" }],
          defaultBranchId: "return-ball",
        },
        {
          id: "partner-answers",
          kind: "partner_line",
          japanese: "私は料理の写真をよく撮ります。",
          nextStepId: "complete",
        },
        {
          id: "complete",
          kind: "completion",
          summary: {
            textZh: "延續了興趣話題，也讓對方接回對話。",
            textI18n: {
              en: "Sustained the topic and gave the partner a clear turn to continue.",
              ja: "趣味の話題を続け、相手が話せる番を作った。",
            },
          },
        },
      ],
    };
  }

  return {
    ...baseScenario,
    topic: "introductions-and-shared-interests",
    world: "community-meetup",
    situation: {
      textZh: "第一次參加社群交流會，和剛認識的參加者聊天。",
      textI18n: {
        en: "Meeting another participant for the first time at a community meetup.",
        ja: "初参加の交流会で、初対面の参加者と話す。",
      },
    },
    relationship: {
      learnerRole: "meetup participant",
      partnerRole: "meetup participant",
      context: {
        textZh: "初次見面、可能有共同興趣的同輩參加者。",
        textI18n: {
          en: "A newly met peer who may share the learner's interests.",
          ja: "共通の興味がありそうな、初対面の同年代の参加者。",
        },
      },
    },
    primarySkills: ["share", "expand", "transition", "exit"],
    difficulty: {
      linguisticComplexity: "intermediate",
      partnerSupport: "balanced",
      relationshipDistance: "neutral",
      topicDepth: "personal",
      interactionPressure: "normal",
    },
    objective: {
      textZh: "從自我介紹開始，找出共同興趣、建立下一步，並自然結束互動。",
      textI18n: {
        en: "Complete a multi-stage social interaction from introduction through a natural exit.",
        ja: "自己紹介から共通の興味と次の約束につなげ、自然に会話を終える。",
      },
    },
    instruction: {
      textZh: "在多個相關階段中記住對方提供的資訊，最後自然離開去拿飲料。",
      textI18n: {
        en: "Carry information across several stages, then leave naturally to get a drink.",
        ja: "複数の段階で相手の情報を覚えて使い、最後は飲み物を取りに自然に離れましょう。",
      },
    },
    startStepId: "partner-greets",
    steps: [
      {
        id: "partner-greets",
        kind: "partner_line",
        japanese: "初めまして。今日、初めて参加したんですか？",
        nextStepId: "learner-introduces",
      },
      {
        id: "learner-introduces",
        kind: "learner_response",
        prompt: {
          textZh: "回答並分享一點自己的背景。",
          textI18n: {
            en: "Answer and share a little background about yourself.",
            ja: "答えて、自分の背景を少し話しましょう。",
          },
        },
        responseExamples: [
          {
            id: "first-time-introduction",
            kind: "suggested",
            japanese: "はい、初めてです。台湾から来て、今は東京で働いています。",
          },
        ],
        branches: [{ id: "continue", nextStepId: "partner-shares-interest" }],
        defaultBranchId: "continue",
      },
      {
        id: "partner-shares-interest",
        kind: "partner_line",
        japanese: "私も初参加です。映画が好きで、こういう会に来てみました。",
        nextStepId: "learner-expands",
      },
      {
        id: "learner-expands",
        kind: "learner_response",
        prompt: {
          textZh: "根據對方剛提供的興趣追問。",
          textI18n: {
            en: "Develop the interest the partner just mentioned.",
            ja: "相手が話した興味について質問を続けましょう。",
          },
        },
        responseExamples: [
          {
            id: "ask-film-preference",
            kind: "suggested",
            japanese: "映画、私も好きです。どんな映画をよく見ますか？",
          },
        ],
        branches: [{ id: "continue", nextStepId: "partner-transitions-to-plan" }],
        defaultBranchId: "continue",
      },
      {
        id: "partner-transitions-to-plan",
        kind: "partner_line",
        japanese: "日本映画が多いですね。今度、この近くで映画祭もあるみたいですよ。",
        nextStepId: "learner-proposes",
      },
      {
        id: "learner-proposes",
        kind: "learner_response",
        prompt: {
          textZh: "回應新資訊，並提出可延續關係的下一步。",
          textI18n: {
            en: "Respond to the new information and suggest a concrete next step.",
            ja: "新しい情報に反応して、次につながる具体的な提案をしましょう。",
          },
        },
        responseExamples: [
          {
            id: "suggest-film-festival",
            kind: "suggested",
            japanese: "面白そうですね。よかったら、あとで映画祭のことを教えてもらえますか？",
          },
        ],
        branches: [{ id: "continue", nextStepId: "partner-confirms" }],
        defaultBranchId: "continue",
      },
      {
        id: "partner-confirms",
        kind: "partner_line",
        japanese: "もちろんです。じゃあ、あとで詳しく話しましょう。",
        nextStepId: "learner-exits",
      },
      {
        id: "learner-exits",
        kind: "learner_response",
        prompt: {
          textZh: "保留稍後再聊的連結，並自然離開去拿飲料。",
          textI18n: {
            en: "Preserve the plan to talk later and leave naturally to get a drink.",
            ja: "あとで話す約束を残し、飲み物を取りに自然に離れましょう。",
          },
        },
        responseExamples: [
          {
            id: "natural-drink-exit",
            kind: "suggested",
            japanese: "ぜひ。ちょっと飲み物を取ってきますね。またあとで。",
          },
        ],
        branches: [{ id: "finish", nextStepId: "complete" }],
        defaultBranchId: "finish",
      },
      {
        id: "complete",
        kind: "completion",
        summary: {
          textZh: "完成了自我介紹、共同興趣、下一步安排與自然離場。",
          textI18n: {
            en: "Completed the introduction, shared-interest, future-plan, and exit stages.",
            ja: "自己紹介、共通の興味、次の約束、自然な退出まで完了した。",
          },
        },
      },
    ],
  };
}

function resolveDefaultPath(scenario: ConversationScenario): string[] {
  const path: string[] = [];
  let step = scenario.steps.find((candidate) => candidate.id === scenario.startStepId) ?? null;

  while (step != null) {
    if (path.includes(step.id)) throw new Error(`fixture contains a cycle at ${step.id}`);
    path.push(step.id);
    step = resolveConversationNextStep(scenario, step.id);
  }

  return path;
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
    expect(scenarios.map((scenario) => localizeConversationLearnerText(scenario.objective, "en"))).toEqual([
      "Open naturally from the shared situation.",
      "Sustain a thread and return conversational responsibility to the partner.",
      "Complete a multi-stage social interaction from introduction through a natural exit.",
    ]);
    expect(resolveDefaultPath(scenarios[0]!)).toEqual([
      "partner-arrives",
      "learner-opens",
      "complete",
    ]);
    expect(resolveDefaultPath(scenarios[1]!)).toEqual([
      "partner-starts",
      "learner-shares",
      "partner-follows-up",
      "learner-bounces",
      "partner-answers",
      "complete",
    ]);
    expect(resolveDefaultPath(scenarios[2]!)).toEqual([
      "partner-greets",
      "learner-introduces",
      "partner-shares-interest",
      "learner-expands",
      "partner-transitions-to-plan",
      "learner-proposes",
      "partner-confirms",
      "learner-exits",
      "complete",
    ]);
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
      startStepId: "partner-arrives",
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
    const base = createScenario("broken-graph", "short");
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
