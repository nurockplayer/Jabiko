import { describe, expect, it } from "vitest";
import type { ConversationLearnerText } from "../conversationScenario";
import { resolveConversationNextStep } from "../conversationScenario";
import { validateConversationSessionDefinitions } from "../conversationSession";
import { evaluateCuratedConversationResponse } from "../conversationFeedback";
import { weatherConversationDefinitions } from "./weather";
import { weekendConversationDefinitions } from "./weekend";
import { schoolWorkConversationDefinitions } from "./schoolWork";
import { foodConversationDefinitions } from "./food";
import { commuteConversationDefinitions } from "./commute";
import { hobbiesConversationDefinitions } from "./hobbies";

const families = [
  weatherConversationDefinitions,
  weekendConversationDefinitions,
  schoolWorkConversationDefinitions,
  foodConversationDefinitions,
  commuteConversationDefinitions,
  hobbiesConversationDefinitions
] as const;

function collectStableIds(definitions: typeof hobbiesConversationDefinitions): string[] {
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

function localizedTexts(definition: (typeof hobbiesConversationDefinitions)[number]): ConversationLearnerText[] {
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
      for (const example of step.responseExamples) if (example.explanation) texts.push(example.explanation);
    }
  }
  return texts;
}

describe("hobbies and recent interests conversation content", () => {
  it("provides three valid localized scenarios with unique pack-wide stable IDs", () => {
    expect(hobbiesConversationDefinitions.map(({ scenario }) => scenario.length)).toEqual([
      "short", "medium", "long"
    ]);
    expect(validateConversationSessionDefinitions(hobbiesConversationDefinitions)).toEqual({ valid: true, errors: [] });

    const allIds = families.flatMap(collectStableIds);
    expect(new Set(allIds).size).toBe(allIds.length);
    const allDefinitions = families.flatMap((family) => [...family]);
    expect(allDefinitions).toHaveLength(18);
    expect(validateConversationSessionDefinitions(allDefinitions)).toEqual({ valid: true, errors: [] });

    for (const family of families) {
      expect(family.map(({ scenario }) => scenario.length)).toEqual(["short", "medium", "long"]);
      expect(family[0].scenario.steps.filter((step) => step.kind === "learner_response")).toHaveLength(1);
      expect(family[1].scenario.steps.filter((step) => step.kind === "learner_response").length).toBeGreaterThanOrEqual(2);
      expect(family[2].scenario.steps.filter((step) => step.kind === "learner_response").length).toBeGreaterThanOrEqual(2);
      expect(family[0].scenario.primarySkills.some((skill) => !family[1].scenario.primarySkills.includes(skill))).toBe(true);
      expect(family[2].scenario.primarySkills.some((skill) =>
        ["narrate", "negotiate", "opinion", "transition", "exit", "register_adapt"].includes(skill)
      )).toBe(true);
    }

    for (const definition of allDefinitions) {
      for (const text of localizedTexts(definition)) {
        expect(text.textZh.trim()).not.toBe("");
        expect(text.textI18n?.ja?.trim()).toBeTruthy();
        expect(text.textI18n?.en?.trim()).toBeTruthy();
        expect(text.textZh).not.toBe(text.textI18n?.ja);
      }
    }
    for (const definition of hobbiesConversationDefinitions) {
      for (const text of localizedTexts(definition)) expect(text.textZh).not.toMatch(/[\u3040-\u30ff]/);
    }
  });

  it("uses a short hobby opener with two viable questions and one answer that fits both", () => {
    const short = hobbiesConversationDefinitions.find(({ scenario }) => scenario.length === "short");
    expect(short).toBeDefined();
    expect(short?.scenario.primarySkills).toContain("join");
    const turn = short?.scenario.steps.find((step) => step.kind === "learner_response");
    expect(turn?.kind).toBe("learner_response");
    if (turn?.kind !== "learner_response" || !short) return;
    expect(turn.responseExamples).toHaveLength(2);
    const continuations = turn.responseExamples.map((example) => {
      const binding = short.responses.find(({ responseExampleId }) => responseExampleId === example.id);
      expect(binding?.feedback.responseJapanese).toBe(example.japanese);
      return binding && resolveConversationNextStep(short.scenario, turn.id, binding.branchId);
    });
    expect(continuations.every((step) => step?.kind === "partner_line")).toBe(true);
    expect(new Set(continuations.map((step) => step?.id)).size).toBe(1);
    expect(turn.responseExamples.every(({ japanese }) => /写真/.test(japanese))).toBe(true);
    const sharedReply = continuations[0];
    expect(sharedReply?.kind === "partner_line" && sharedReply.japanese).toMatch(/友人に.*カメラ.*きっかけ/);
  });

  it("builds a reciprocal medium thread about a recent interest across multiple turns", () => {
    const medium = hobbiesConversationDefinitions.find(({ scenario }) => scenario.length === "medium");
    expect(medium).toBeDefined();
    expect(medium?.scenario.primarySkills).toEqual(expect.arrayContaining(["share", "expand"]));
    expect(medium?.scenario.primarySkills).not.toContain("bounce");
    const turns = medium?.scenario.steps.filter((step) => step.kind === "learner_response") ?? [];
    expect(turns).toHaveLength(2);
    for (const turn of turns) {
      if (turn.kind !== "learner_response" || !medium) continue;
      expect(turn.responseExamples).toHaveLength(2);
      const continuations = turn.responseExamples.map((example) => {
        const binding = medium.responses.find(({ stepId, responseExampleId }) => stepId === turn.id && responseExampleId === example.id);
        expect(binding?.feedback.responseJapanese).toBe(example.japanese);
        return binding && resolveConversationNextStep(medium.scenario, turn.id, binding.branchId);
      });
      expect(continuations.every((step) => step?.kind === "partner_line")).toBe(true);
      expect(new Set(continuations.map((step) => step?.id)).size).toBe(1);
      if (turn.id === "hobbies-medium-share-interest-response") {
        expect(turn.responseExamples.every(({ japanese }) => /スープ/.test(japanese))).toBe(true);
      }
      if (turn.id === "hobbies-medium-enjoyment-response") {
        expect(turn.responseExamples.every(({ japanese }) => /スープ|料理|野菜/.test(japanese))).toBe(true);
      }
      expect(turn.responseExamples.every(({ japanese }) => /マフラー/.test(japanese))).toBe(false);
      const turnBindings = medium.responses.filter(({ stepId }) => stepId === turn.id);
      expect(turnBindings.every(({ feedback }) =>
        feedback.feedback.composition.every(({ canonicalSkillId }) => canonicalSkillId !== "bounce")
      )).toBe(true);
      expect(turnBindings.every(({ feedback }) =>
        feedback.feedback.composition.find(({ feature }) => feature === "ask")?.canonicalSkillId === "expand"
      )).toBe(true);
      const sharedReply = continuations[0];
      if (turn.id === "hobbies-medium-share-interest-response") {
        expect(sharedReply?.kind === "partner_line" && sharedReply.japanese).toMatch(/毛糸.*きっかけ/);
        expect(sharedReply?.kind === "partner_line" && sharedReply.japanese).not.toMatch(/マフラー/);
      }
      if (turn.id === "hobbies-medium-enjoyment-response") {
        expect(sharedReply?.kind === "partner_line" && sharedReply.japanese).toMatch(/マフラー.*作ってみたい/);
      }
    }
  });

  it("handles a nuanced long first-meeting exchange with a considerate bridge and close", () => {
    const long = hobbiesConversationDefinitions.find(({ scenario }) => scenario.length === "long");
    expect(long).toBeDefined();
    expect(long?.scenario.steps.filter((step) => step.kind === "learner_response").length).toBeGreaterThanOrEqual(3);
    expect(long?.scenario.primarySkills).toEqual(expect.arrayContaining(["share", "negotiate", "exit"]));
    expect(long?.scenario.primarySkills).not.toContain("register_adapt");
    expect(long?.scenario.difficulty.linguisticComplexity).toBe("advanced");
    expect(long?.scenario.difficulty.relationshipDistance).toBe("neutral");
    const indirectCue = long?.scenario.steps.find((step) => step.id === "hobbies-long-hiking-reply");
    expect(indirectCue?.kind === "partner_line" && indirectCue.japanese).toMatch(/仕事が立て込んでいて.*余裕はあまりなくて.*気分転換/);
    const uncertainSchedule = long?.scenario.steps.find((step) => step.id === "hobbies-long-plan-reply");
    expect(uncertainSchedule?.kind === "partner_line" && uncertainSchedule.japanese).toMatch(/予定はまだ見通しが立たなくて、今は何とも言えない/);
    const turns = long?.scenario.steps.filter((step) => step.kind === "learner_response") ?? [];
    expect(turns).toHaveLength(3);
    for (const turn of turns) {
      if (turn.kind !== "learner_response" || !long) continue;
      expect(turn.responseExamples).toHaveLength(2);
      const continuations = turn.responseExamples.map((example) => {
        const binding = long.responses.find(({ stepId, responseExampleId }) => stepId === turn.id && responseExampleId === example.id);
        expect(binding?.feedback.responseJapanese).toBe(example.japanese);
        return binding && resolveConversationNextStep(long.scenario, turn.id, binding.branchId);
      });
      expect(continuations.every((step) => step?.kind === "partner_line" || step?.kind === "completion")).toBe(true);
      expect(new Set(continuations.map((step) => step?.id)).size).toBe(1);
      const sharedReply = continuations[0];
      if (turn.id === "hobbies-long-share-preference-response") {
        expect(turn.responseExamples.every(({ japanese }) => /どんな|印象に残|心に残/.test(japanese))).toBe(true);
        expect(turn.responseExamples.every(({ japanese }) => !/景色を眺める時間がお好きですか/.test(japanese))).toBe(true);
        expect(sharedReply?.kind === "partner_line" && sharedReply.japanese).toMatch(/湖/);
      }
      if (turn.id === "hobbies-long-gentle-plan-response") {
        expect(turn.responseExamples.every(({ japanese }) => /もし|でしたら|ようでしたら/.test(japanese))).toBe(true);
        expect(sharedReply?.kind === "partner_line" && sharedReply.japanese).toMatch(/予定.*見通し/);
        expect(sharedReply?.kind === "partner_line" && sharedReply.japanese).not.toMatch(/日を決めるのは難しい/);
      }
      if (turn.id === "hobbies-long-close-response") {
        expect(sharedReply?.kind).toBe("completion");
        expect(turn.responseExamples.every(({ japanese }) => /予定が見えて|予定が分からない/.test(japanese))).toBe(true);
        expect(turn.responseExamples.every(({ japanese }) => /無理に決めず|日程を決めず|予定が見えてから/.test(japanese))).toBe(true);
        for (const example of turn.responseExamples) {
          const binding = long.responses.find(({ responseExampleId }) => responseExampleId === example.id);
          expect(binding?.feedback.feedback.continuation).toBe("opens_thread");
          expect(binding && evaluateCuratedConversationResponse(binding.feedback).dimensions.continuation).toBe("met");
        }
      }
    }
  });

  it("keeps familiar-classmate wording natural and aligns the long invitation with the actual reluctance cue", () => {
    const medium = hobbiesConversationDefinitions.find(({ scenario }) => scenario.length === "medium");
    const mediumPartnerLines = medium?.scenario.steps.filter((step) => step.kind === "partner_line") ?? [];
    expect(mediumPartnerLines.map((step) => step.kind === "partner_line" ? step.japanese : "").join(" ")).not.toMatch(/そちらは/);

    const long = hobbiesConversationDefinitions.find(({ scenario }) => scenario.length === "long");
    expect(long).toBeDefined();
    const instruction = long?.scenario.instruction;
    expect(instruction?.textZh).not.toMatch(/沒有直接拒絕散步/);
    expect(instruction?.textI18n?.ja).not.toMatch(/散歩を断っているわけではなく/);
    expect(instruction?.textI18n?.en).not.toMatch(/does not directly reject a walk/);

    const invitationTurn = long?.scenario.steps.find((step) => step.id === "hobbies-long-gentle-plan-response");
    expect(invitationTurn?.kind).toBe("learner_response");
    if (invitationTurn?.kind !== "learner_response" || !long) return;
    expect(invitationTurn.prompt.textZh).toMatch(/婉拒|延後/);
    expect(invitationTurn.prompt.textZh).not.toMatch(/提前結束|提早結束/);
    expect(invitationTurn.prompt.textI18n?.ja).toMatch(/断ったり先に延ばしたり/);
    expect(invitationTurn.prompt.textI18n?.ja).not.toMatch(/途中で切り上げ/);
    expect(invitationTurn.prompt.textI18n?.en).toMatch(/decline or defer/i);
    expect(invitationTurn.prompt.textI18n?.en).not.toMatch(/end early/i);
    const acceptedInvitation = invitationTurn.responseExamples.find(({ id }) => id === "hobbies-long-soft-riverside-option");
    expect(acceptedInvitation?.japanese).toMatch(/長く歩く余裕がないようでしたら/);
    const binding = long.responses.find(({ responseExampleId }) => responseExampleId === "hobbies-long-soft-riverside-option");
    expect(binding?.feedback.responseJapanese).toBe(acceptedInvitation?.japanese);
    expect(binding?.feedback.feedback.authorRationale?.natural).toMatch(/limited energy|busy period|nearby/i);
    expect(acceptedInvitation?.explanation?.textI18n?.ja).toMatch(/余裕がない/);
    expect(acceptedInvitation?.explanation?.textI18n?.en).toMatch(/limited time|energy|busy/i);

    const mediumTurns = medium?.scenario.steps.filter((step) => step.kind === "learner_response") ?? [];
    expect(mediumTurns.flatMap((turn) => turn.kind === "learner_response" ? turn.responseExamples.map(({ id }) => id) : []))
      .toEqual(expect.arrayContaining(["hobbies-medium-soup-interest", "hobbies-medium-soup-bean-vegetable-interest", "hobbies-medium-soup-enjoyment", "hobbies-medium-soup-flavor-enjoyment"]));
  });
});
