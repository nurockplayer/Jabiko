import { describe, expect, it } from "vitest";
import { evaluateCuratedConversationResponse, type CuratedConversationResponse } from "./conversationFeedback";
import type { ConversationScenario } from "./conversationScenario";
import type {
  ConversationSessionResponseRecord,
  ConversationSessionState
} from "./conversationSession";
import { createConversationSession, type ConversationSessionDefinition } from "./conversationSession";
import {
  applyCompletedConversationSession,
  getAvailableWorldMoments,
  localizeGameWorldText,
  validateGameWorld,
  type GameWorldDefinition
} from "./gameWorld";

const shortScenario: ConversationScenario = {
  id: "station-greeting",
  topic: "weekend",
  world: "everyday-life",
  situation: { textZh: "車站遇到熟人。", textI18n: { en: "Meeting someone at the station.", ja: "駅で知り合いに会う。" } },
  relationship: {
    learnerRole: "acquaintance",
    partnerRole: "classmate",
    context: { textZh: "剛開始熟悉的同學。", textI18n: { en: "A classmate the learner is getting to know.", ja: "知り合い始めたクラスメート。" } }
  },
  length: "short",
  primarySkills: ["open"],
  difficulty: {
    linguisticComplexity: "basic",
    partnerSupport: "supportive",
    relationshipDistance: "neutral",
    topicDepth: "concrete",
    interactionPressure: "low"
  },
  objective: { textZh: "自然地開始對話。" },
  instruction: { textZh: "回應對方的問候。" },
  startStepId: "opening-response",
  steps: [
    {
      id: "opening-response",
      kind: "learner_response",
      prompt: { textZh: "回應對方。" },
      responseExamples: [{ id: "opening", kind: "suggested", japanese: "こんにちは。" }],
      branches: [
        { id: "finish", nextStepId: "complete" },
        { id: "continue", nextStepId: "follow-up-response" }
      ]
    },
    {
      id: "follow-up-response",
      kind: "learner_response",
      prompt: { textZh: "再補充一句。" },
      responseExamples: [{ id: "follow-up", kind: "accepted", japanese: "そうですね。" }],
      branches: [{ id: "finish", nextStepId: "complete" }]
    },
    { id: "complete", kind: "completion", summary: { textZh: "對話完成。" } }
  ]
};

const mediumScenario: ConversationScenario = {
  ...shortScenario,
  id: "cafe-follow-up",
  length: "medium",
  primarySkills: ["share", "bounce"],
  relationship: {
    ...shortScenario.relationship,
    context: { textZh: "幾次聊天後熟悉的同學。", textI18n: { en: "A classmate familiar after several chats.", ja: "何度か話して親しくなったクラスメート。" } }
  }
};

function learnerText(textZh: string) {
  return { textZh, textI18n: { en: "English text.", ja: "日本語のテキスト。" } };
}

function createWorld(): GameWorldDefinition {
  return {
    id: "first-day",
    locations: [
      { id: "station", name: learnerText("車站"), description: learnerText("附近的車站。"), category: "transit" },
      { id: "cafe", name: learnerText("咖啡店"), description: learnerText("安靜的咖啡店。"), category: "food" },
      { id: "park", name: learnerText("公園"), description: learnerText("安靜的公園。"), category: "community" }
    ],
    npcs: [
      {
        id: "aki",
        displayName: learnerText("あき"),
        presentation: learnerText("在車站遇到的同學。"),
        role: "classmate",
        defaultRelationshipContext: learnerText("剛認識的同學。"),
        relationshipStageIds: ["aki-new", "aki-familiar"]
      },
      {
        id: "ren",
        displayName: learnerText("れん"),
        presentation: learnerText("常去咖啡店的同學。"),
        role: "classmate",
        defaultRelationshipContext: learnerText("同一個社團的同學。"),
        relationshipStageIds: ["ren-new"]
      }
    ],
    relationshipStages: [
      { id: "aki-new", npcId: "aki", order: 0, context: learnerText("剛認識。") },
      { id: "aki-familiar", npcId: "aki", order: 1, context: learnerText("已經聊過幾次。") },
      { id: "ren-new", npcId: "ren", order: 0, context: learnerText("剛認識。") }
    ],
    sessionDefinitions: [makeSessionDefinition(shortScenario), makeSessionDefinition(mediumScenario)],
    moments: [
      {
        id: "station-meet",
        locationId: "station",
        npcId: "aki",
        relationshipStageId: "aki-new",
        scenarioId: shortScenario.id,
        objective: learnerText("和あき打招呼。"),
        availability: { requiredCompletedMomentIds: [], requiredRelationshipStageIds: [] },
        onCompletion: {
          unlockLocationIds: ["cafe"],
          unlockMomentIds: ["cafe-chat"],
          relationshipStageUpdates: [{ npcId: "aki", relationshipStageId: "aki-familiar" }]
        },
        conditionalOutcomes: [
          {
            id: "enrich-the-thread",
            responseRequirement: { stepId: "opening-response", minimumContinuationQuality: "opens_thread" },
            unlockMomentIds: ["richer-chat"]
          }
        ]
      },
      {
        id: "cafe-chat",
        locationId: "cafe",
        npcId: "aki",
        relationshipStageId: "aki-familiar",
        scenarioId: mediumScenario.id,
        objective: learnerText("週末の話を続ける。"),
        availability: { requiredCompletedMomentIds: ["station-meet"], requiredRelationshipStageIds: ["aki-familiar"] },
        onCompletion: { unlockLocationIds: [], unlockMomentIds: [], relationshipStageUpdates: [] },
        conditionalOutcomes: [],
        completesArc: true
      },
      {
        id: "richer-chat",
        locationId: "cafe",
        npcId: "aki",
        relationshipStageId: "aki-familiar",
        scenarioId: mediumScenario.id,
        objective: learnerText("話題をさらに広げる。"),
        availability: { requiredCompletedMomentIds: ["station-meet"], requiredRelationshipStageIds: ["aki-familiar"] },
        onCompletion: { unlockLocationIds: [], unlockMomentIds: [], relationshipStageUpdates: [] },
        conditionalOutcomes: [],
        completesArc: true
      }
    ],
    initialState: {
      completedMomentIds: [],
      relationshipStages: { aki: "aki-new", ren: "ren-new" },
      unlockedLocationIds: ["station"],
      unlockedMomentIds: ["station-meet"],
      outcomeReferences: []
    },
    entryMomentIds: ["station-meet"]
  };
}

const continuationFeedback = (
  responseId: string,
  responseJapanese: string,
  quality: "dead_end" | "opens_thread" | "enriches_thread"
) => evaluateCuratedConversationResponse({
  id: responseId,
  responseJapanese,
  context: { situation: "At a station.", relationship: "Classmates.", discourse: "The learner responds." },
  feedback: { languageQuality: "natural", continuation: quality, registerContextFit: "fits", composition: [], authorRationale: {} }
} satisfies CuratedConversationResponse<"open">);

function makeSessionDefinition(
  scenario: ConversationScenario,
  qualities: Readonly<Record<string, "dead_end" | "opens_thread" | "enriches_thread">> = {},
  branchIds: Readonly<Record<string, string>> = {}
): ConversationSessionDefinition {
  return {
    scenario,
    responses: scenario.steps.flatMap((step) => step.kind === "learner_response"
      ? step.responseExamples.map((example) => ({
        stepId: step.id,
        responseExampleId: example.id,
        branchId: branchIds[example.id] ?? (example.id === "opening" ? "continue" : "finish"),
        feedback: {
          id: `feedback-${scenario.id}-${example.id}`,
          responseJapanese: example.japanese,
          context: { situation: "At a station.", relationship: "Classmates.", discourse: "The learner responds." },
          feedback: {
            languageQuality: "natural",
            continuation: qualities[example.id] ?? "enriches_thread",
            registerContextFit: "fits",
            composition: [],
            authorRationale: {}
          }
        } satisfies CuratedConversationResponse<"open">
      }))
      : [])
  };
}

function makeDefinitionWithDeadEndAndOpeningAlternative(): ConversationSessionDefinition {
  const scenario: ConversationScenario = {
    ...shortScenario,
    steps: shortScenario.steps.map((step) => step.id === "opening-response" && step.kind === "learner_response"
      ? {
        ...step,
        responseExamples: [...step.responseExamples, { id: "opening-rich", kind: "accepted", japanese: "本当ですね。" }]
      }
      : step)
  };
  return makeSessionDefinition(scenario, { opening: "dead_end" }, { "opening-rich": "continue" });
}

function responseRecord(
  stepId: string,
  exampleId: string,
  quality: "dead_end" | "opens_thread" | "enriches_thread"
): ConversationSessionResponseRecord {
  return {
    stepId,
    responseExampleId: exampleId,
    feedback: continuationFeedback(`feedback-${shortScenario.id}-${exampleId}`, exampleId === "opening" ? "こんにちは。" : "そうですね。", quality)
  };
}

function withResponseRecords(
  session: ConversationSessionState,
  responses: readonly ConversationSessionResponseRecord[]
): ConversationSessionState {
  return { ...session, summary: { ...session.summary!, responses } };
}

function makeCompletedSession(
  scenarioId = shortScenario.id,
  responseExampleIds: readonly string[] = ["opening", "follow-up"],
  qualities: Readonly<Record<string, "dead_end" | "opens_thread" | "enriches_thread">> = {}
): ConversationSessionState {
  const scenario = scenarioId === mediumScenario.id ? mediumScenario : shortScenario;
  const definition = makeSessionDefinition(scenario, qualities);
  const session = createConversationSession([definition]);
  session.select(scenario.id);
  session.start();
  for (const responseExampleId of responseExampleIds) {
    if (session.getState().step?.kind !== "learner_response") throw new Error("Expected learner response step.");
    if (session.submitResponse(responseExampleId) == null || !session.continue()) throw new Error("Could not advance test session.");
  }
  return session.getState();
}

describe("game world domain", () => {
  it("validates a finite world with two locations, two NPCs, and short/medium scenario bindings", () => {
    expect(validateGameWorld(createWorld())).toEqual({ valid: true, errors: [] });
  });

  it("selects the same available moments deterministically from the same state", () => {
    const world = createWorld();
    const first = getAvailableWorldMoments(world, world.initialState);
    expect(getAvailableWorldMoments(world, world.initialState)).toEqual(first);
    expect(first.map(({ id }) => id)).toEqual(["station-meet"]);
  });

  it("unlocks the next moment and updates the matching relationship after a completed session", () => {
    const world = createWorld();
    const result = applyCompletedConversationSession(world, world.initialState, "station-meet", makeCompletedSession());
    expect(result).toMatchObject({
      applied: true,
      state: {
        completedMomentIds: ["station-meet"],
        unlockedMomentIds: expect.arrayContaining(["station-meet", "cafe-chat"]),
        relationshipStages: { aki: "aki-familiar", ren: "ren-new" }
      }
    });
  });

  it("opens a richer follow-up only from the named response step's structured continuation outcome", () => {
    const world = createWorld();
    const result = applyCompletedConversationSession(world, world.initialState, "station-meet", makeCompletedSession());
    expect(result.state.unlockedMomentIds).toContain("richer-chat");
    expect(result.state.outcomeReferences).toContainEqual({ momentId: "station-meet", outcomeId: "enrich-the-thread" });
  });

  it("does not aggregate continuation quality from a different response step", () => {
    const base = createWorld();
    const definition = makeDefinitionWithDeadEndAndOpeningAlternative();
    const world = { ...base, sessionDefinitions: [definition, base.sessionDefinitions[1]] };
    const session = makeCompletedSession(shortScenario.id, ["opening", "follow-up"], { opening: "dead_end" });
    const result = applyCompletedConversationSession(world, world.initialState, "station-meet", session);
    expect(result.state.unlockedMomentIds).toContain("cafe-chat");
    expect(result.state.unlockedMomentIds).not.toContain("richer-chat");
    expect(result.state.outcomeReferences).toEqual([]);
  });

  it("uses a relationship stage to expose a new scenario/context for the same NPC", () => {
    const world = createWorld();
    const next = applyCompletedConversationSession(world, world.initialState, "station-meet", makeCompletedSession()).state;
    expect(getAvailableWorldMoments(world, next).map(({ scenarioId }) => scenarioId)).toContain("cafe-follow-up");
  });

  it("rejects invalid references in the authored world graph", () => {
    const world = createWorld();
    const missingScenario = {
      ...world,
      moments: world.moments.map((moment) => moment.id === "station-meet"
        ? { ...moment, scenarioId: "missing-scenario" }
        : moment)
    };
    expect(getAvailableWorldMoments(missingScenario, world.initialState)).toEqual([]);
    const invalid = {
      ...world,
      moments: world.moments.map((moment) => moment.id === "station-meet" ? { ...moment, locationId: "missing" } : moment)
    };
    expect(validateGameWorld(invalid).valid).toBe(false);
    const invalidStep = {
      ...world,
      moments: world.moments.map((moment) => moment.id === "station-meet"
        ? { ...moment, conditionalOutcomes: [{ ...moment.conditionalOutcomes[0], responseRequirement: { ...moment.conditionalOutcomes[0].responseRequirement, stepId: "missing-step" } }] }
        : moment)
    };
    expect(validateGameWorld(invalidStep).errors).toContainEqual({
      code: "invalid_response_step_reference",
      entityId: "station-meet",
      referenceId: "missing-step"
    });

    const scenarioWithOrphanResponse: ConversationScenario = {
      ...shortScenario,
      steps: [...shortScenario.steps, {
        id: "orphan-response",
        kind: "learner_response",
        prompt: { textZh: "這一步無法到達。" },
        responseExamples: [{ id: "orphan-example", kind: "suggested", japanese: "はい。" }],
        branches: [{ id: "finish", nextStepId: "complete" }]
      }]
    };
    const unreachableStep = {
      ...world,
      sessionDefinitions: [makeSessionDefinition(scenarioWithOrphanResponse), world.sessionDefinitions[1]],
      moments: world.moments.map((moment) => moment.id === "station-meet"
        ? { ...moment, conditionalOutcomes: [{ ...moment.conditionalOutcomes[0], responseRequirement: { ...moment.conditionalOutcomes[0].responseRequirement, stepId: "orphan-response" } }] }
        : moment)
    };
    expect(validateGameWorld(unreachableStep).errors).toContainEqual({
      code: "invalid_response_step_reference",
      entityId: "station-meet",
      referenceId: "orphan-response"
    });

    const duplicateOutcomeReference = {
      ...world,
      initialState: {
        ...world.initialState,
        outcomeReferences: [
          { momentId: "station-meet", outcomeId: "enrich-the-thread" },
          { momentId: "station-meet", outcomeId: "enrich-the-thread" }
        ]
      }
    };
    expect(validateGameWorld(duplicateOutcomeReference).errors).toContainEqual({
      code: "contradictory_initial_state",
      referenceId: "duplicate-initial-fact"
    });
    const unknownOutcomeReference = {
      ...world,
      initialState: {
        ...world.initialState,
        outcomeReferences: [{ momentId: "station-meet", outcomeId: "missing-outcome" }]
      }
    };
    expect(validateGameWorld(unknownOutcomeReference).errors).toContainEqual({
      code: "contradictory_initial_state",
      referenceId: "station-meet:missing-outcome"
    });
    const outcomeWithoutCompletedMoment = {
      ...world,
      initialState: {
        ...world.initialState,
        outcomeReferences: [{ momentId: "station-meet", outcomeId: "enrich-the-thread" }]
      }
    };
    expect(validateGameWorld(outcomeWithoutCompletedMoment).errors).toContainEqual({
      code: "contradictory_initial_state",
      referenceId: "station-meet:enrich-the-thread"
    });
    const completedButLocked = {
      ...world,
      initialState: {
        ...world.initialState,
        completedMomentIds: ["station-meet"],
        unlockedMomentIds: []
      }
    };
    expect(validateGameWorld(completedButLocked).errors).toContainEqual({
      code: "contradictory_initial_state",
      referenceId: "station-meet"
    });
    expect(applyCompletedConversationSession(world, world.initialState, "missing-moment", makeCompletedSession()).applied).toBe(false);
  });

  it("rejects a bound scenario graph that the conversation runtime cannot start", () => {
    const world = createWorld();
    const brokenScenario = { ...shortScenario, startStepId: "missing-step" };
    const invalidWorld = {
      ...world,
      sessionDefinitions: [makeSessionDefinition(brokenScenario), world.sessionDefinitions[1]]
    };

    expect(validateGameWorld(invalidWorld).errors).toContainEqual({
      code: "invalid_bound_scenario_graph",
      entityId: shortScenario.id
    });
  });

  it("fails closed when a later world state contradicts completed or outcome facts", () => {
    const world = createWorld();
    const completed = applyCompletedConversationSession(world, world.initialState, "station-meet", makeCompletedSession()).state;
    const lockedCompletion = {
      ...completed,
      unlockedMomentIds: completed.unlockedMomentIds.filter((id) => id !== "station-meet")
    };
    const orphanedOutcome = {
      ...world.initialState,
      outcomeReferences: [{ momentId: "station-meet", outcomeId: "enrich-the-thread" }]
    };

    expect(getAvailableWorldMoments(world, lockedCompletion)).toEqual([]);
    expect(applyCompletedConversationSession(world, lockedCompletion, "cafe-chat", makeCompletedSession()).reason).toBe("invalid_state");
    expect(getAvailableWorldMoments(world, orphanedOutcome)).toEqual([]);
    expect(applyCompletedConversationSession(world, orphanedOutcome, "station-meet", makeCompletedSession()).reason).toBe("invalid_state");
  });

  it("rejects moments requiring conflicting relationship stages for one NPC", () => {
    const world = createWorld();
    const conflictingStages = {
      ...world,
      moments: world.moments.map((moment) => moment.id === "cafe-chat"
        ? { ...moment, availability: { ...moment.availability, requiredRelationshipStageIds: ["aki-new", "aki-familiar"] } }
        : moment)
    };
    expect(validateGameWorld(conflictingStages).errors).toContainEqual({
      code: "unsatisfiable_moment_precondition",
      entityId: "cafe-chat"
    });

    const conflictsWithMomentStage = {
      ...world,
      moments: world.moments.map((moment) => moment.id === "cafe-chat"
        ? { ...moment, availability: { ...moment.availability, requiredRelationshipStageIds: ["aki-new"] } }
        : moment)
    };
    expect(validateGameWorld(conflictsWithMomentStage).errors).toContainEqual({
      code: "unsatisfiable_moment_precondition",
      entityId: "cafe-chat"
    });
  });

  it("rejects an arc that can only unlock through continuation quality absent from every trusted answer", () => {
    const base = createWorld();
    const definition = makeSessionDefinition(shortScenario, { opening: "dead_end", "follow-up": "dead_end" });
    const world: GameWorldDefinition = {
      ...base,
      sessionDefinitions: [definition, base.sessionDefinitions[1]],
      moments: [
        {
          ...base.moments[0],
          onCompletion: { unlockLocationIds: ["cafe"], unlockMomentIds: [], relationshipStageUpdates: [{ npcId: "aki", relationshipStageId: "aki-familiar" }] },
          conditionalOutcomes: [{
            id: "quality-gate",
            responseRequirement: { stepId: "opening-response", minimumContinuationQuality: "opens_thread" },
            unlockMomentIds: ["richer-chat"]
          }]
        },
        base.moments[2]
      ]
    };

    expect(validateGameWorld(world).errors).toContainEqual({ code: "unreachable_arc_completion" });
  });

  it("does not invent an impossible dead-end choice that strands an arc with trusted opening answers", () => {
    const base = createWorld();
    const definition = makeSessionDefinition(shortScenario, { opening: "opens_thread", "follow-up": "opens_thread" });
    const world: GameWorldDefinition = {
      ...base,
      sessionDefinitions: [definition, base.sessionDefinitions[1]],
      moments: [
        {
          ...base.moments[0],
          onCompletion: { unlockLocationIds: ["cafe"], unlockMomentIds: [], relationshipStageUpdates: [{ npcId: "aki", relationshipStageId: "aki-familiar" }] },
          conditionalOutcomes: [{
            id: "quality-gate",
            responseRequirement: { stepId: "opening-response", minimumContinuationQuality: "opens_thread" },
            unlockMomentIds: ["richer-chat"]
          }]
        },
        base.moments[2]
      ]
    };

    expect(validateGameWorld(world)).toEqual({ valid: true, errors: [] });
  });

  it("counts a trusted finish branch that skips the conditional response step", () => {
    const base = createWorld();
    const scenario: ConversationScenario = {
      ...shortScenario,
      steps: shortScenario.steps.map((step) => step.id === "opening-response" && step.kind === "learner_response"
        ? { ...step, responseExamples: [...step.responseExamples, { id: "opening-direct", kind: "accepted", japanese: "そうですね。" }] }
        : step)
    };
    const definition = makeSessionDefinition(scenario, { "follow-up": "opens_thread" });
    const world: GameWorldDefinition = {
      ...base,
      sessionDefinitions: [definition, base.sessionDefinitions[1]],
      moments: [
        {
          ...base.moments[0],
          onCompletion: { unlockLocationIds: ["cafe"], unlockMomentIds: [], relationshipStageUpdates: [{ npcId: "aki", relationshipStageId: "aki-familiar" }] },
          conditionalOutcomes: [{
            id: "follow-up-gate",
            responseRequirement: { stepId: "follow-up-response", minimumContinuationQuality: "opens_thread" },
            unlockMomentIds: ["richer-chat"]
          }]
        },
        base.moments[2]
      ]
    };

    expect(validateGameWorld(world).errors).toContainEqual({ code: "stranded_arc_state" });
  });

  it("rejects a final moment whose required relationship stage was replaced by its prerequisite", () => {
    const world = createWorld();
    const impossibleArc: GameWorldDefinition = {
      ...world,
      moments: [
        {
          ...world.moments[0],
          conditionalOutcomes: [],
          onCompletion: {
            ...world.moments[0].onCompletion,
            unlockMomentIds: ["cafe-chat"]
          }
        },
        {
          ...world.moments[1],
          relationshipStageId: "aki-new",
          availability: {
            requiredCompletedMomentIds: ["station-meet"],
            requiredRelationshipStageIds: []
          },
          completesArc: true
        }
      ]
    };

    expect(validateGameWorld(impossibleArc).errors).toContainEqual({
      code: "unsatisfiable_moment_precondition",
      entityId: "cafe-chat"
    });
    expect(validateGameWorld(impossibleArc).errors).toContainEqual({ code: "unreachable_arc_completion" });
  });

  it("rejects a legal choice that permanently strands the finite arc", () => {
    const world = createWorld();
    const strandedWorld: GameWorldDefinition = {
      ...world,
      moments: [
        {
          ...world.moments[0],
          conditionalOutcomes: [],
          onCompletion: {
            unlockLocationIds: [],
            unlockMomentIds: [],
            relationshipStageUpdates: [{ npcId: "aki", relationshipStageId: "aki-familiar" }]
          }
        },
        {
          ...world.moments[1],
          locationId: "station",
          relationshipStageId: "aki-new",
          availability: { requiredCompletedMomentIds: [], requiredRelationshipStageIds: [] },
          completesArc: true
        }
      ],
      initialState: {
        ...world.initialState,
        unlockedMomentIds: ["station-meet", "cafe-chat"]
      },
      entryMomentIds: ["station-meet", "cafe-chat"]
    };

    expect(validateGameWorld(strandedWorld).errors).toContainEqual({ code: "stranded_arc_state" });
  });

  it("recognizes two compatible outcomes from one completed response", () => {
    const world = createWorld();
    const first = world.moments[0];
    const bothRequired: GameWorldDefinition = {
      ...world,
      moments: [
        {
          ...first,
          conditionalOutcomes: [
            { ...first.conditionalOutcomes[0], unlockMomentIds: ["cafe-chat"] },
            {
              id: "enrich-more",
              responseRequirement: { stepId: "opening-response", minimumContinuationQuality: "enriches_thread" },
              unlockMomentIds: ["richer-chat"]
            }
          ]
        },
        world.moments[1],
        {
          ...world.moments[2],
          availability: {
            requiredCompletedMomentIds: ["station-meet"],
            requiredRelationshipStageIds: ["aki-familiar"]
          }
        }
      ]
    };

    expect(validateGameWorld(bothRequired)).toEqual({ valid: true, errors: [] });
    const result = applyCompletedConversationSession(bothRequired, bothRequired.initialState, "station-meet", makeCompletedSession());
    expect(result.applied).toBe(true);
    expect(result.state.outcomeReferences).toEqual([
      { momentId: "station-meet", outcomeId: "enrich-the-thread" },
      { momentId: "station-meet", outcomeId: "enrich-more" }
    ]);
  });

  it("rejects conditional outcomes that require different response steps", () => {
    const world = createWorld();
    const mixedSteps: GameWorldDefinition = {
      ...world,
      moments: world.moments.map((moment) => moment.id === "station-meet"
        ? {
          ...moment,
          conditionalOutcomes: [
            ...moment.conditionalOutcomes,
            {
              id: "later-step",
              responseRequirement: { stepId: "follow-up-response", minimumContinuationQuality: "opens_thread" },
              unlockMomentIds: ["cafe-chat"]
            }
          ]
        }
        : moment)
    };

    expect(validateGameWorld(mixedSteps).errors).toContainEqual({
      code: "incompatible_outcome_steps",
      entityId: "station-meet"
    });
  });

  it("preserves unrelated NPC and location state while applying one transition", () => {
    const world = createWorld();
    const before = structuredClone(world.initialState);
    const result = applyCompletedConversationSession(world, world.initialState, "station-meet", makeCompletedSession());
    expect(result.state.relationshipStages.ren).toBe(before.relationshipStages.ren);
    expect(result.state.unlockedLocationIds).not.toContain("park");
    expect(world.initialState).toEqual(before);
  });

  it("produces an identical state for repeated application of the same completed session", () => {
    const world = createWorld();
    const first = applyCompletedConversationSession(world, world.initialState, "station-meet", makeCompletedSession());
    const repeated = applyCompletedConversationSession(world, world.initialState, "station-meet", makeCompletedSession());
    expect(repeated).toEqual(first);
  });

  it("does not publish a world transition for incomplete, mismatched, or rejected sessions", () => {
    const world = createWorld();
    const incomplete = { ...makeCompletedSession(), phase: "interaction", summary: null } satisfies ConversationSessionState;
    const validSession = makeCompletedSession();
    const mismatched = { ...validSession, summary: { ...validSession.summary!, scenarioId: "another-scenario" } };
    const curatedSession = validSession;
    const rejectedSummary = {
      ...curatedSession.summary!,
        responses: [{
          stepId: "opening-response",
          responseExampleId: "opening",
          feedback: { ...responseRecord("opening-response", "opening", "enriches_thread").feedback, source: "bounded_ai" }
        }]
      };
    const rejected = { ...curatedSession, summary: rejectedSummary } as unknown as ConversationSessionState;
    expect(applyCompletedConversationSession(world, world.initialState, "station-meet", incomplete).applied).toBe(false);
    expect(applyCompletedConversationSession(world, world.initialState, "station-meet", mismatched).applied).toBe(false);
    expect(applyCompletedConversationSession(world, world.initialState, "station-meet", rejected)).toEqual({
      applied: false,
      state: world.initialState,
      reason: "rejected_session"
    });
    const deadEndWorld = {
      ...world,
      sessionDefinitions: [makeDefinitionWithDeadEndAndOpeningAlternative(), world.sessionDefinitions[1]]
    };
    const deadEnd = makeCompletedSession(shortScenario.id, ["opening", "follow-up"], { opening: "dead_end" });
    const deadEndResult = applyCompletedConversationSession(deadEndWorld, deadEndWorld.initialState, "station-meet", deadEnd);
    expect(deadEndResult.state.unlockedMomentIds).toContain("cafe-chat");
    expect(deadEndResult.state.unlockedMomentIds).not.toContain("richer-chat");
  });

  it("rejects empty, duplicate, and unreachable response traces", () => {
    const world = createWorld();
    const valid = makeCompletedSession();
    const emptyTrace = withResponseRecords(valid, []);
    const opening = responseRecord("opening-response", "opening", "enriches_thread");
    const followup = responseRecord("follow-up-response", "follow-up", "enriches_thread");
    const duplicateTrace = withResponseRecords(valid, [opening, opening]);
    const unreachableTrace = withResponseRecords(valid, [followup, opening]);

    for (const session of [emptyTrace, duplicateTrace, unreachableTrace]) {
      expect(applyCompletedConversationSession(world, world.initialState, "station-meet", session)).toEqual({
        applied: false,
        state: world.initialState,
        reason: "rejected_session"
      });
    }
  });

  it("replays a real completed session through the trusted response-to-branch binding", () => {
    const base = createWorld();
    const finishOnOpening = makeSessionDefinition(shortScenario, {}, { opening: "finish" });
    const world = { ...base, sessionDefinitions: [finishOnOpening, base.sessionDefinitions[1]] };
    const runtime = createConversationSession([finishOnOpening]);
    expect(runtime.select(shortScenario.id)).toBe(true);
    expect(runtime.start()).toBe(true);
    expect(runtime.submitResponse("opening")).not.toBeNull();
    expect(runtime.continue()).toBe(true);
    const completed = runtime.getState();
    expect(completed.phase).toBe("complete");
    expect(applyCompletedConversationSession(world, world.initialState, "station-meet", completed).applied).toBe(true);

    const impossibleFollowup = withResponseRecords(completed, [
      ...completed.summary!.responses,
      responseRecord("follow-up-response", "follow-up", "enriches_thread")
    ]);
    expect(applyCompletedConversationSession(world, world.initialState, "station-meet", impossibleFollowup)).toEqual({
      applied: false,
      state: world.initialState,
      reason: "rejected_session"
    });
  });

  it("does not let supplied feedback raise trusted continuation quality", () => {
    const base = createWorld();
    const definition = makeDefinitionWithDeadEndAndOpeningAlternative();
    const world = { ...base, sessionDefinitions: [definition, base.sessionDefinitions[1]] };
    const completed = makeCompletedSession(shortScenario.id, ["opening", "follow-up"], { opening: "dead_end" });
    const inflated = withResponseRecords(completed, completed.summary!.responses.map((record) =>
      record.stepId === "opening-response"
        ? { ...record, feedback: { ...record.feedback, continuationQuality: "enriches_thread" } }
        : record
    ));

    expect(applyCompletedConversationSession(world, world.initialState, "station-meet", inflated)).toEqual({
      applied: false,
      state: world.initialState,
      reason: "rejected_session"
    });
  });

  it("allows an empty trace when the trusted scenario completes without a learner response", () => {
    const base = createWorld();
    const scenario: ConversationScenario = {
      ...shortScenario,
      id: "partner-only",
      startStepId: "partner-opening",
      steps: [
        { id: "partner-opening", kind: "partner_line", japanese: "こんにちは。", nextStepId: "partner-only-complete" },
        { id: "partner-only-complete", kind: "completion", summary: { textZh: "完成。" } }
      ]
    };
    const definition = makeSessionDefinition(scenario);
    const world = {
      ...base,
      sessionDefinitions: [definition, base.sessionDefinitions[1]],
      moments: base.moments.map((moment) => moment.id === "station-meet"
        ? {
          ...moment,
          scenarioId: scenario.id,
          conditionalOutcomes: [],
          onCompletion: { ...moment.onCompletion, unlockMomentIds: [...moment.onCompletion.unlockMomentIds, "richer-chat"] }
        }
        : moment)
    };
    const runtime = createConversationSession([definition]);
    runtime.select(scenario.id);
    runtime.start();
    expect(runtime.advance()).toBe(true);
    const completed = runtime.getState();
    expect(completed.summary?.responses).toEqual([]);
    expect(validateGameWorld(world)).toEqual({ valid: true, errors: [] });
    expect(applyCompletedConversationSession(world, world.initialState, "station-meet", completed).applied).toBe(true);
  });

  it("localizes authored learner text through the existing localization fallback", () => {
    const text = { textZh: "車站", textI18n: { en: "Station", ja: "駅" } };
    expect(localizeGameWorldText(text, "en")).toBe("Station");
    expect(localizeGameWorldText(text, "th")).toBe("車站");
  });
});
