import { describe, expect, it } from "vitest";
import {
  createConversationSession,
  validateConversationSessionDefinitions,
  type ConversationSessionDefinition,
  type ConversationSessionResponseBinding
} from "./conversationSession";
import type { CuratedConversationResponse } from "./conversationFeedback";
import type { ConversationScenario, ConversationSkillId } from "./conversationScenario";

type CuratedResponse = CuratedConversationResponse<ConversationSkillId>;

// --- Short scenario: one learner moment, two authored responses. ---

const weekendShortScenario: ConversationScenario = {
  id: "weekend-short",
  topic: "weekend",
  world: "classroom",
  situation: { textZh: "上課前，同學問起週末。" },
  relationship: {
    learnerRole: "classmate",
    partnerRole: "classmate",
    context: { textZh: "平常會聊天、使用普通禮貌體的同學。" }
  },
  length: "short",
  primarySkills: ["react", "expand"],
  difficulty: {
    linguisticComplexity: "basic",
    partnerSupport: "supportive",
    relationshipDistance: "familiar",
    topicDepth: "personal",
    interactionPressure: "low"
  },
  objective: { textZh: "回答週末做了什麼，讓對方能接話。" },
  instruction: { textZh: "選一個回應，讓對話可以繼續。" },
  startStepId: "weekend-line",
  steps: [
    {
      id: "weekend-line",
      kind: "partner_line",
      japanese: "週末何しました？",
      nextStepId: "weekend-response"
    },
    {
      id: "weekend-response",
      kind: "learner_response",
      prompt: { textZh: "回答你的週末。" },
      responseExamples: [
        { id: "weekend-brief", kind: "suggested", japanese: "家にいました。" },
        {
          id: "weekend-rich",
          kind: "accepted",
          japanese: "家にいました。映画を見ました。"
        }
      ],
      branches: [
        { id: "weekend-brief-path", nextStepId: "weekend-complete" },
        { id: "weekend-rich-path", nextStepId: "weekend-complete" }
      ],
      defaultBranchId: "weekend-brief-path"
    },
    {
      id: "weekend-complete",
      kind: "completion",
      summary: { textZh: "完成短對話的反應與追問練習。" }
    }
  ]
};

const weekendBriefFeedback: CuratedResponse = {
  id: "weekend-brief-feedback",
  responseJapanese: "家にいました。",
  context: {
    situation: "A classmate asks what the learner did over the weekend.",
    relationship: "Classmates who use friendly polite Japanese with each other.",
    discourse: "The learner answers the partner's direct question about the weekend."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "dead_end",
    registerContextFit: "fits",
    composition: [],
    authorRationale: {
      natural: "The short answer is natural for this casual exchange.",
      continuation: "The answer gives the partner nothing specific to follow up on."
    }
  }
};

const weekendRichFeedback: CuratedResponse = {
  id: "weekend-rich-feedback",
  responseJapanese: "家にいました。映画を見ました。",
  context: {
    situation: "A classmate asks what the learner did over the weekend.",
    relationship: "Classmates who use friendly polite Japanese with each other.",
    discourse: "The learner answers the partner's direct question about the weekend."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [
      { feature: "answer", canonicalSkillId: "share" },
      { feature: "add", canonicalSkillId: "expand" }
    ],
    authorRationale: {
      continuation: "The added detail about the movie gives the partner a clear next move."
    }
  }
};

const weekendShortDefinition: ConversationSessionDefinition = {
  scenario: weekendShortScenario,
  responses: [
    {
      stepId: "weekend-response",
      responseExampleId: "weekend-brief",
      branchId: "weekend-brief-path",
      feedback: weekendBriefFeedback
    },
    {
      stepId: "weekend-response",
      responseExampleId: "weekend-rich",
      branchId: "weekend-rich-path",
      feedback: weekendRichFeedback
    }
  ]
};

// --- Medium scenario: a several-turn Answer -> Add -> Ask rally. ---

const weekendMediumScenario: ConversationScenario = {
  id: "weekend-medium",
  topic: "weekend",
  world: "classroom",
  situation: { textZh: "午休時，同學想多聊一點週末。" },
  relationship: {
    learnerRole: "classmate",
    partnerRole: "classmate",
    context: { textZh: "平常會聊天、使用普通禮貌體的同學。" }
  },
  length: "medium",
  primarySkills: ["share", "expand", "bounce"],
  difficulty: {
    linguisticComplexity: "intermediate",
    partnerSupport: "balanced",
    relationshipDistance: "familiar",
    topicDepth: "personal",
    interactionPressure: "normal"
  },
  objective: { textZh: "用回答、補充、反問延續同一個話題。" },
  instruction: { textZh: "依序完成幾個來回，讓話題延續下去。" },
  startStepId: "medium-line-1",
  steps: [
    {
      id: "medium-line-1",
      kind: "partner_line",
      japanese: "週末何しました？",
      nextStepId: "medium-response-1"
    },
    {
      id: "medium-response-1",
      kind: "learner_response",
      prompt: { textZh: "先回答週末做了什麼。" },
      responseExamples: [
        { id: "medium-answer", kind: "suggested", japanese: "家にいました。" }
      ],
      branches: [{ id: "medium-answer-path", nextStepId: "medium-line-2" }]
    },
    {
      id: "medium-line-2",
      kind: "partner_line",
      japanese: "そうですか。何かしましたか？",
      nextStepId: "medium-response-2"
    },
    {
      id: "medium-response-2",
      kind: "learner_response",
      prompt: { textZh: "補充一個細節。" },
      responseExamples: [
        { id: "medium-add", kind: "accepted", japanese: "映画を見ました。" }
      ],
      branches: [{ id: "medium-add-path", nextStepId: "medium-line-3" }]
    },
    {
      id: "medium-line-3",
      kind: "partner_line",
      japanese: "いいですね。どんな映画ですか？",
      nextStepId: "medium-response-3"
    },
    {
      id: "medium-response-3",
      kind: "learner_response",
      prompt: { textZh: "回答後把話題交回去。" },
      responseExamples: [
        { id: "medium-ask", kind: "accepted", japanese: "日本のアニメです。あなたは何を見ますか？" }
      ],
      branches: [{ id: "medium-ask-path", nextStepId: "medium-complete" }]
    },
    {
      id: "medium-complete",
      kind: "completion",
      summary: { textZh: "完成數個來回的話題延續練習。" }
    }
  ]
};

const mediumAnswerFeedback: CuratedResponse = {
  id: "medium-answer-feedback",
  responseJapanese: "家にいました。",
  context: {
    situation: "A classmate asks what the learner did over the weekend.",
    relationship: "Classmates who use friendly polite Japanese with each other.",
    discourse: "The learner is expected to answer with enough material to continue the rally."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "dead_end",
    registerContextFit: "fits",
    composition: [{ feature: "answer", canonicalSkillId: "share" }],
    authorRationale: {
      continuation: "A bare answer pauses the rally until the partner asks again."
    }
  }
};

const mediumAddFeedback: CuratedResponse = {
  id: "medium-add-feedback",
  responseJapanese: "映画を見ました。",
  context: {
    situation: "A classmate is developing the weekend topic with a follow-up question.",
    relationship: "Classmates who use friendly polite Japanese with each other.",
    discourse: "The learner adds supporting detail to the previous answer."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "opens_thread",
    registerContextFit: "fits",
    composition: [{ feature: "add", canonicalSkillId: "expand" }],
    authorRationale: {
      continuation: "The detail about the movie gives the partner a concrete topic to develop."
    }
  }
};

const mediumAskFeedback: CuratedResponse = {
  id: "medium-ask-feedback",
  responseJapanese: "日本のアニメです。あなたは何を見ますか？",
  context: {
    situation: "A classmate has asked about the movie the learner watched.",
    relationship: "Classmates who use friendly polite Japanese with each other.",
    discourse: "The learner answers and returns conversational responsibility to the partner."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [{ feature: "ask", canonicalSkillId: "bounce" }],
    authorRationale: {
      continuation: "Returning the question keeps the learner and partner on equal footing."
    }
  }
};

const weekendMediumDefinition: ConversationSessionDefinition = {
  scenario: weekendMediumScenario,
  responses: [
    {
      stepId: "medium-response-1",
      responseExampleId: "medium-answer",
      branchId: "medium-answer-path",
      feedback: mediumAnswerFeedback
    },
    {
      stepId: "medium-response-2",
      responseExampleId: "medium-add",
      branchId: "medium-add-path",
      feedback: mediumAddFeedback
    },
    {
      stepId: "medium-response-3",
      responseExampleId: "medium-ask",
      branchId: "medium-ask-path",
      feedback: mediumAskFeedback
    }
  ]
};

// --- Long scenario: narration, opinion and negotiation across several turns. ---

const meetupLongScenario: ConversationScenario = {
  id: "meetup-long",
  topic: "meetup",
  world: "community event",
  situation: { textZh: "在社區活動中與剛認識的人聊天。" },
  relationship: {
    learnerRole: "guest",
    partnerRole: "guest",
    context: { textZh: "活動中初次見面、需要完整說明與協商的對象。" }
  },
  length: "long",
  primarySkills: ["narrate", "opinion", "negotiate"],
  difficulty: {
    linguisticComplexity: "advanced",
    partnerSupport: "low_support",
    relationshipDistance: "neutral",
    topicDepth: "abstract",
    interactionPressure: "high"
  },
  objective: { textZh: "敘述經驗、表達意見並協商出可行的結論。" },
  instruction: { textZh: "完成一個需要敘述、表達意見與協商的完整交流。" },
  startStepId: "long-line-1",
  steps: [
    {
      id: "long-line-1",
      kind: "partner_line",
      japanese: "今日はどちらから来ましたか？",
      nextStepId: "long-response-1"
    },
    {
      id: "long-response-1",
      kind: "learner_response",
      prompt: { textZh: "說明你從哪裡來，並敘述最近的一趟旅行。" },
      responseExamples: [
        {
          id: "long-narrate",
          kind: "suggested",
          japanese: "台北から来ました。先週、友達と台南へ旅行に行ったんです。"
        }
      ],
      branches: [{ id: "long-narrate-path", nextStepId: "long-line-2" }]
    },
    {
      id: "long-line-2",
      kind: "partner_line",
      japanese: "いいですね。その旅行はどうでしたか？",
      nextStepId: "long-response-2"
    },
    {
      id: "long-response-2",
      kind: "learner_response",
      prompt: { textZh: "表達你對那趟旅行的看法。" },
      responseExamples: [
        {
          id: "long-opinion",
          kind: "accepted",
          japanese: "とても楽しかったですが、少し疲れました。"
        }
      ],
      branches: [{ id: "long-opinion-path", nextStepId: "long-line-3" }]
    },
    {
      id: "long-line-3",
      kind: "partner_line",
      japanese: "そうですか。次の旅行はどうしたいですか？",
      nextStepId: "long-response-3"
    },
    {
      id: "long-response-3",
      kind: "learner_response",
      prompt: { textZh: "提出並協商一個可行的旅行方案。" },
      responseExamples: [
        {
          id: "long-negotiate",
          kind: "accepted",
          japanese: "春なら京都がいいですが、費用を考えると短めにしたいです。"
        }
      ],
      branches: [{ id: "long-negotiate-path", nextStepId: "long-complete" }]
    },
    {
      id: "long-complete",
      kind: "completion",
      summary: { textZh: "完成敘述、表達意見與協商的長交流。" }
    }
  ]
};

const longNarrateFeedback: CuratedResponse = {
  id: "long-narrate-feedback",
  responseJapanese: "台北から来ました。先週、友達と台南へ旅行に行ったんです。",
  context: {
    situation: "A new acquaintance at a community event asks where the learner is from.",
    relationship: "Two guests meeting for the first time at a public event.",
    discourse: "The learner narrates a recent experience and offers material to develop."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [{ feature: "answer", canonicalSkillId: "narrate" }],
    authorRationale: {
      continuation: "The travel narration gives the partner an obvious follow-up question."
    }
  }
};

const longOpinionFeedback: CuratedResponse = {
  id: "long-opinion-feedback",
  responseJapanese: "とても楽しかったですが、少し疲れました。",
  context: {
    situation: "The partner asks how the narrated trip felt.",
    relationship: "Two guests meeting for the first time at a public event.",
    discourse: "The learner gives a balanced opinion about the experience."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "opens_thread",
    registerContextFit: "fits",
    composition: [{ feature: "answer", canonicalSkillId: "opinion" }],
    authorRationale: {
      continuation: "The mixed evaluation invites the partner to probe either side."
    }
  }
};

const longNegotiateFeedback: CuratedResponse = {
  id: "long-negotiate-feedback",
  responseJapanese: "春なら京都がいいですが、費用を考えると短めにしたいです。",
  context: {
    situation: "The partner asks what the learner wants to do on the next trip.",
    relationship: "Two guests meeting for the first time at a public event.",
    discourse: "The learner proposes a preference while leaving room to negotiate."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [{ feature: "answer", canonicalSkillId: "negotiate" }],
    authorRationale: {
      continuation: "The softened preference keeps the negotiation open for the partner."
    }
  }
};

const meetupLongDefinition: ConversationSessionDefinition = {
  scenario: meetupLongScenario,
  responses: [
    {
      stepId: "long-response-1",
      responseExampleId: "long-narrate",
      branchId: "long-narrate-path",
      feedback: longNarrateFeedback
    },
    {
      stepId: "long-response-2",
      responseExampleId: "long-opinion",
      branchId: "long-opinion-path",
      feedback: longOpinionFeedback
    },
    {
      stepId: "long-response-3",
      responseExampleId: "long-negotiate",
      branchId: "long-negotiate-path",
      feedback: longNegotiateFeedback
    }
  ]
};

const sessionDefinitions: readonly ConversationSessionDefinition[] = [
  weekendShortDefinition,
  weekendMediumDefinition,
  meetupLongDefinition
];

function definitionWithResponses(
  definition: ConversationSessionDefinition,
  responses: readonly ConversationSessionResponseBinding[]
): ConversationSessionDefinition {
  return { scenario: definition.scenario, responses };
}

const [weekendBriefBinding, weekendRichBinding] = weekendShortDefinition.responses;

describe("conversation session definition validation", () => {
  it("accepts scenarios whose authored bindings match the step, example, branch and curated feedback", () => {
    expect(validateConversationSessionDefinitions(sessionDefinitions)).toEqual({
      valid: true,
      errors: []
    });
    expect(() => createConversationSession(sessionDefinitions)).not.toThrow();
  });

  it("rejects a definition whose binding points at unknown step, example or branch references", () => {
    const unknownStep = validateConversationSessionDefinitions([
      definitionWithResponses(weekendShortDefinition, [
        { ...weekendBriefBinding, stepId: "weekend-missing-step" }
      ])
    ]);
    expect(unknownStep.valid).toBe(false);
    expect(unknownStep.errors.map((error) => error.code)).toContain("unknown_step");

    const unknownExample = validateConversationSessionDefinitions([
      definitionWithResponses(weekendShortDefinition, [
        { ...weekendBriefBinding, responseExampleId: "weekend-missing-example" }
      ])
    ]);
    expect(unknownExample.errors.map((error) => error.code)).toContain(
      "unknown_response_example"
    );

    const unknownBranch = validateConversationSessionDefinitions([
      definitionWithResponses(weekendShortDefinition, [
        { ...weekendBriefBinding, branchId: "weekend-missing-branch" }
      ])
    ]);
    expect(unknownBranch.errors.map((error) => error.code)).toContain("unknown_branch");

    expect(() =>
      createConversationSession([
        definitionWithResponses(weekendShortDefinition, [
          { ...weekendBriefBinding, branchId: "weekend-missing-branch" }
        ])
      ])
    ).toThrow();
  });

  it("rejects feedback whose Japanese text does not correspond to the bound response example", () => {
    const mismatched = {
      ...weekendBriefFeedback,
      responseJapanese: "まったく違う文です。"
    };
    const result = validateConversationSessionDefinitions([
      definitionWithResponses(weekendShortDefinition, [
        { ...weekendBriefBinding, feedback: mismatched }
      ])
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain("response_text_mismatch");
  });

  it("rejects duplicate bindings, duplicate feedback records and unusable feedback context", () => {
    const duplicated = validateConversationSessionDefinitions([
      definitionWithResponses(weekendShortDefinition, [
        weekendBriefBinding,
        weekendBriefBinding
      ])
    ]);
    expect(duplicated.errors.map((error) => error.code)).toContain("duplicate_binding");

    const reusedFeedback = validateConversationSessionDefinitions([
      definitionWithResponses(weekendShortDefinition, [
        weekendBriefBinding,
        { ...weekendRichBinding, feedback: weekendBriefFeedback }
      ])
    ]);
    expect(reusedFeedback.errors.map((error) => error.code)).toContain(
      "duplicate_feedback_id"
    );

    const emptyContext = validateConversationSessionDefinitions([
      definitionWithResponses(weekendShortDefinition, [
        {
          ...weekendBriefBinding,
          feedback: {
            ...weekendBriefFeedback,
            id: "weekend-empty-context-feedback",
            context: { situation: "  ", relationship: "classmates", discourse: "answering" }
          }
        }
      ])
    ]);
    expect(emptyContext.errors.map((error) => error.code)).toContain(
      "invalid_feedback_context"
    );
  });

  it("rejects non-terminating scenario graphs and learner steps without authored responses", () => {
    const loopingScenario: ConversationScenario = {
      ...weekendShortScenario,
      id: "weekend-loop",
      steps: [
        {
          id: "weekend-line",
          kind: "partner_line",
          japanese: "週末何しました？",
          nextStepId: "weekend-line"
        }
      ]
    };
    const looping = validateConversationSessionDefinitions([
      { scenario: loopingScenario, responses: [] }
    ]);
    expect(looping.errors.map((error) => error.code)).toContain("invalid_scenario");

    const unbound = validateConversationSessionDefinitions([
      definitionWithResponses(weekendShortDefinition, [])
    ]);
    expect(unbound.errors.map((error) => error.code)).toContain("unbound_learner_step");
  });

  it("rejects a reachable response example without its own authored binding", () => {
    const partial = validateConversationSessionDefinitions([
      definitionWithResponses(weekendShortDefinition, [weekendBriefBinding])
    ]);

    expect(partial.valid).toBe(false);
    expect(partial.errors).toContainEqual({
      code: "unbound_response_example",
      scenarioId: "weekend-short",
      stepId: "weekend-response",
      referenceId: "weekend-rich"
    });
    expect(() =>
      createConversationSession([
        definitionWithResponses(weekendShortDefinition, [weekendBriefBinding])
      ])
    ).toThrow();
  });

  it("keeps response bindings distinct when identifiers contain the binding delimiter", () => {
    const [firstBinding, secondBinding, thirdBinding] = weekendMediumDefinition.responses;
    const collisionScenario: ConversationScenario = {
      ...weekendMediumScenario,
      steps: weekendMediumScenario.steps.map((step) => {
        if (step.kind === "partner_line") {
          const nextStepId = step.nextStepId === "medium-response-1"
            ? "a"
            : step.nextStepId === "medium-response-2" ? "a::b" : step.nextStepId;
          return { ...step, nextStepId };
        }
        if (step.kind !== "learner_response") return step;
        if (step.id === "medium-response-1") {
          return {
            ...step,
            id: "a",
            responseExamples: step.responseExamples.map((example) => ({ ...example, id: "b::c" }))
          };
        }
        if (step.id === "medium-response-2") {
          return {
            ...step,
            id: "a::b",
            responseExamples: [
              { id: "c", kind: "accepted", japanese: "追加の未結合例です。" },
              ...step.responseExamples.map((example) => ({ ...example, id: "other" }))
            ]
          };
        }
        return step;
      })
    };
    const unboundCollision: ConversationSessionDefinition = {
      scenario: collisionScenario,
      responses: [
        { ...firstBinding, stepId: "a", responseExampleId: "b::c" },
        { ...secondBinding, stepId: "a::b", responseExampleId: "other" },
        thirdBinding
      ]
    };
    const targetBinding: ConversationSessionResponseBinding = {
      ...secondBinding,
      stepId: "a::b",
      responseExampleId: "c",
      feedback: { ...secondBinding.feedback, id: "medium-collision-feedback", responseJapanese: "追加の未結合例です。" }
    };

    const missing = validateConversationSessionDefinitions([unboundCollision]);
    expect(missing.valid).toBe(false);
    expect(missing.errors).toContainEqual({
      code: "unbound_response_example",
      scenarioId: collisionScenario.id,
      stepId: "a::b",
      referenceId: "c"
    });
    expect(() => createConversationSession([unboundCollision])).toThrow();
    expect(validateConversationSessionDefinitions([{
      ...unboundCollision,
      responses: [...unboundCollision.responses, targetBinding]
    }])).toEqual({ valid: true, errors: [] });
  });
});

describe("conversation session runtime", () => {
  it("runs intro -> interaction -> feedback -> completion and keeps feedback visible for the last response", () => {
    const session = createConversationSession(sessionDefinitions);
    expect(session.getState()).toMatchObject({
      phase: "intro",
      scenario: null,
      step: null,
      feedback: null,
      summary: null
    });

    expect(session.start()).toBe(false);
    expect(session.select("unknown-scenario")).toBe(false);
    expect(session.getState()).toMatchObject({ phase: "intro", scenario: null });

    expect(session.select("weekend-short")).toBe(true);
    expect(session.getState()).toMatchObject({
      phase: "intro",
      summary: null,
      feedback: null
    });
    expect(session.getState().scenario?.id).toBe("weekend-short");

    expect(session.start()).toBe(true);
    expect(session.getState().phase).toBe("interaction");
    expect(session.getState().step).toMatchObject({
      id: "weekend-line",
      kind: "partner_line",
      japanese: "週末何しました？"
    });

    expect(session.advance()).toBe(true);
    expect(session.getState().step?.id).toBe("weekend-response");

    const feedback = session.submitResponse("weekend-brief");
    expect(feedback?.dimensions).toEqual({
      understandable: "met",
      correct: "met",
      natural: "met",
      continuation: "needs_work",
      register_context_fit: "met"
    });
    expect(feedback?.source).toBe("curated");
    expect(session.getState().phase).toBe("feedback");
    expect(session.getState().feedback).toBe(feedback);
    expect(session.getState().summary).toBeNull();

    expect(session.continue()).toBe(true);
    const state = session.getState();
    expect(state.phase).toBe("complete");
    expect(state.summary?.scenarioId).toBe("weekend-short");
    expect(state.summary?.length).toBe("short");
    expect(state.summary?.responses).toHaveLength(1);
    expect(state.summary?.skillsPracticed).toEqual([]);
    expect(state.summary?.responses[0].feedback).toBe(feedback);
  });

  it("retries the same learner moment and lets a richer authored response improve continuation", () => {
    const session = createConversationSession(sessionDefinitions);
    session.select("weekend-short");
    session.start();
    session.advance();

    const brief = session.submitResponse("weekend-brief");
    expect(brief?.dimensions.continuation).toBe("needs_work");
    expect(brief?.dimensions.natural).toBe("met");

    expect(session.retry()).toBe(true);
    const retryState = session.getState();
    expect(retryState.phase).toBe("interaction");
    expect(retryState.feedback).toBeNull();
    expect(retryState.summary).toBeNull();
    expect(retryState.step).toMatchObject({
      id: "weekend-response",
      kind: "learner_response"
    });
    expect(retryState.scenario?.id).toBe("weekend-short");

    const richer = session.submitResponse("weekend-rich");
    expect(richer?.dimensions.continuation).toBe("met");
    expect(richer?.dimensions.natural).toBe("met");
    expect(session.getState().phase).toBe("feedback");

    expect(session.continue()).toBe(true);
    const state = session.getState();
    expect(state.phase).toBe("complete");
    expect(state.summary?.responses).toHaveLength(1);
    expect(state.summary?.responses[0].responseExampleId).toBe("weekend-rich");
    expect(state.summary?.skillsPracticed).toEqual(["share", "expand"]);
  });

  it("sustains the medium Answer -> Add -> Ask rally across several turns", () => {
    const session = createConversationSession(sessionDefinitions);
    session.select("weekend-medium");
    expect(session.start()).toBe(true);
    expect(session.getState().scenario?.primarySkills).toEqual(["share", "expand", "bounce"]);

    const turns = [
      { partner: "medium-line-1", response: "medium-answer" },
      { partner: "medium-line-2", response: "medium-add" },
      { partner: "medium-line-3", response: "medium-ask" }
    ];

    for (const turn of turns) {
      expect(session.getState().step).toMatchObject({ id: turn.partner, kind: "partner_line" });
      expect(session.advance()).toBe(true);
      expect(session.submitResponse(turn.response)).not.toBeNull();
      expect(session.getState().phase).toBe("feedback");
      expect(session.continue()).toBe(true);
    }

    const state = session.getState();
    expect(state.phase).toBe("complete");
    expect(state.summary?.skillsPracticed).toEqual(["share", "expand", "bounce"]);
    expect(state.summary?.responses).toHaveLength(3);
  });

  it("supports a genuinely several-turn long scenario instead of a single labelled completion node", () => {
    const session = createConversationSession(sessionDefinitions);
    session.select("meetup-long");
    expect(session.start()).toBe(true);

    const state = session.getState();
    expect(state.phase).toBe("interaction");
    expect(state.step).toMatchObject({ id: "long-line-1", kind: "partner_line" });
    expect(state.summary).toBeNull();

    const turns = ["long-narrate", "long-opinion", "long-negotiate"];
    const reachedSteps: string[] = [];
    for (const response of turns) {
      reachedSteps.push(session.getState().step?.id ?? "");
      expect(session.advance()).toBe(true);
      reachedSteps.push(session.getState().step?.id ?? "");
      expect(session.submitResponse(response)).not.toBeNull();
      expect(session.continue()).toBe(true);
    }

    expect(reachedSteps).toEqual([
      "long-line-1",
      "long-response-1",
      "long-line-2",
      "long-response-2",
      "long-line-3",
      "long-response-3"
    ]);

    const completed = session.getState();
    expect(completed.phase).toBe("complete");
    expect(completed.summary?.scenarioId).toBe("meetup-long");
    expect(completed.summary?.length).toBe("long");
    expect(completed.summary?.responses).toHaveLength(3);
    expect(completed.summary?.skillsPracticed).toEqual(["narrate", "opinion", "negotiate"]);
  });

  it("clears every previous response, feedback and summary fact on select, change and reset", () => {
    const session = createConversationSession(sessionDefinitions);
    session.select("weekend-short");
    session.start();
    session.advance();
    session.submitResponse("weekend-rich");

    expect(session.select("weekend-medium")).toBe(true);
    expect(session.getState()).toMatchObject({
      phase: "intro",
      scenario: weekendMediumScenario,
      step: null,
      feedback: null,
      summary: null
    });

    session.start();
    session.advance();
    session.submitResponse("medium-answer");
    expect(session.getState().phase).toBe("feedback");

    expect(session.reset()).toBe(true);
    expect(session.getState()).toMatchObject({
      phase: "intro",
      scenario: null,
      step: null,
      feedback: null,
      summary: null
    });
  });

  it("fails closed on mismatched, stale or out-of-phase actions without leaking state", () => {
    const session = createConversationSession(sessionDefinitions);
    session.select("weekend-short");
    session.start();

    expect(session.submitResponse("weekend-brief")).toBeNull();
    expect(session.retry()).toBe(false);
    expect(session.continue()).toBe(false);
    expect(session.getState()).toMatchObject({ phase: "interaction", feedback: null });
    expect(session.getState().step?.id).toBe("weekend-line");

    session.advance();
    const beforeMismatch = session.getState();
    expect(session.submitResponse("medium-answer")).toBeNull();
    expect(session.submitResponse("missing-response")).toBeNull();
    expect(session.getState()).toEqual(beforeMismatch);

    const feedback = session.submitResponse("weekend-brief");
    expect(feedback).not.toBeNull();
    const beforeStale = session.getState();
    expect(session.submitResponse("weekend-rich")).toBeNull();
    expect(session.advance()).toBe(false);
    expect(session.getState()).toEqual(beforeStale);
    expect(session.getState().feedback).toBe(feedback);
  });
});
