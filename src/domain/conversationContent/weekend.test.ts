import { describe, expect, it } from "vitest";
import type { ConversationLearnerText } from "../conversationScenario";
import { validateConversationSessionDefinitions } from "../conversationSession";
import { weatherConversationDefinitions } from "./weather";
import { weekendConversationDefinitions } from "./weekend";

function collectStableIds(
  definitions: typeof weekendConversationDefinitions
): string[] {
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

describe("weekend conversation content", () => {
  it("provides three complete, localized scenarios with unique stable identifiers", () => {
    expect(weekendConversationDefinitions.map(({ scenario }) => scenario.length)).toEqual([
      "short", "medium", "long"
    ]);
    expect(validateConversationSessionDefinitions(weekendConversationDefinitions)).toEqual({
      valid: true,
      errors: []
    });

    const stableIds = collectStableIds(weekendConversationDefinitions);
    expect(new Set(stableIds).size).toBe(stableIds.length);
    const allContentIds = [
      ...collectStableIds(weatherConversationDefinitions),
      ...stableIds
    ];
    expect(new Set(allContentIds).size).toBe(allContentIds.length);

    for (const { scenario } of weekendConversationDefinitions) {
      const texts: ConversationLearnerText[] = [
        scenario.situation,
        scenario.relationship.context,
        scenario.objective,
        scenario.instruction
      ];
      for (const step of scenario.steps) {
        if (step.kind === "completion") texts.push(step.summary);
        if (step.kind === "learner_response") {
          texts.push(step.prompt);
          for (const example of step.responseExamples) {
            expect(example.explanation).toBeDefined();
            if (example.explanation) texts.push(example.explanation);
          }
        }
      }
      for (const text of texts) {
        expect(text.textZh.trim()).not.toBe("");
        expect(text.textI18n?.ja?.trim()).toBeTruthy();
        expect(text.textI18n?.en?.trim()).toBeTruthy();
        expect(text.textZh).not.toBe(text.textI18n?.ja);
      }
    }
  });

  it("makes short practice a quick weekend reaction, personal share, or follow-up", () => {
    const short = weekendConversationDefinitions.find(({ scenario }) => scenario.length === "short")!;
    expect(short.scenario.primarySkills).toEqual(expect.arrayContaining(["react", "share", "expand"]));
    const learnerTurns = short.scenario.steps.filter((step) => step.kind === "learner_response");
    expect(learnerTurns).toHaveLength(1);
    expect(learnerTurns[0].kind === "learner_response" && learnerTurns[0].responseExamples.length).toBeGreaterThanOrEqual(3);
    expect(short.responses).toHaveLength(learnerTurns[0].kind === "learner_response" ? learnerTurns[0].responseExamples.length : 0);
    const directFollowup = short.responses.find(({ responseExampleId }) => responseExampleId === "weekend-short-movie-followup");
    expect(directFollowup?.feedback.feedback.continuation).toBe("opens_thread");
  });

  it("sustains one medium days-off thread and gives the partner a believable low-energy turn", () => {
    const medium = weekendConversationDefinitions.find(({ scenario }) => scenario.length === "medium")!;
    const learnerTurns = medium.scenario.steps.filter((step) => step.kind === "learner_response");
    expect(learnerTurns.length).toBeGreaterThanOrEqual(2);
    expect(medium.scenario.primarySkills).toEqual(expect.arrayContaining(["share", "bounce"]));
    expect(medium.scenario.objective.textI18n?.en).toMatch(/thread|conversation/i);
    expect(medium.scenario.objective.textZh).toMatch(/輕柔追問|溫和追問/);
    expect(medium.scenario.objective.textZh).toMatch(/也可以|或/);
    expect(medium.scenario.objective.textI18n?.ja).toMatch(/質問/);
    expect(medium.scenario.objective.textI18n?.ja).toMatch(/ても|または/);
    expect(medium.scenario.objective.textI18n?.ja).toContain("似た考え");
    expect(medium.scenario.objective.textI18n?.en).toMatch(/gentle question/i);
    expect(medium.scenario.objective.textI18n?.en).toMatch(/or/i);
    const mediumSummary = medium.scenario.steps.find((step) => step.kind === "completion");
    expect(mediumSummary?.kind === "completion" && mediumSummary.summary.textI18n?.en).toMatch(/gentle question.*or share a related thought and close with care/);
    if (mediumSummary?.kind === "completion") {
      expect(mediumSummary.summary.textZh).toMatch(/問題.*或|問題.*也可/);
      expect(mediumSummary.summary.textI18n?.ja).toMatch(/質問.*ても|質問.*または/);
      expect(mediumSummary.summary.textI18n?.ja).toContain("似た考え");
    }
    const partnerLines = medium.scenario.steps.filter((step) => step.kind === "partner_line");
    expect(partnerLines.some((step) => /疲れ|休ん|ゆっくり/.test(step.japanese))).toBe(true);
  });

  it("uses a distinct long social objective with relationship-aware negotiation", () => {
    const long = weekendConversationDefinitions.find(({ scenario }) => scenario.length === "long")!;
    expect(long.scenario.primarySkills).toEqual(expect.arrayContaining(["negotiate", "opinion", "register_adapt"]));
    expect(long.scenario.primarySkills).not.toContain("bounce");
    expect(long.scenario.steps.filter((step) => step.kind === "learner_response")).toHaveLength(3);
    expect(long.scenario.difficulty.linguisticComplexity).toMatch(/intermediate|advanced/);
    expect(long.scenario.difficulty.interactionPressure).toBe("normal");
    expect(long.scenario.objective.textI18n?.en).toMatch(/plan|negotiate|compromise/i);
    expect(long.scenario.relationship.context.textI18n?.ja).toMatch(/です・ます|丁寧/);
    expect(long.scenario.situation.textZh).not.toMatch(/不同偏好|偏好不同/);
    expect(long.scenario.situation.textI18n?.ja).not.toContain("好みが違");
    expect(long.scenario.situation.textI18n?.en).not.toContain("different preferences");
  });

  it("annotates the accepted garden proposal as a personal preference", () => {
    const long = weekendConversationDefinitions.find(({ scenario }) => scenario.length === "long")!;
    const step = long.scenario.steps.find((candidate) => candidate.id === "weekend-long-first-proposal");
    expect(step?.kind).toBe("learner_response");
    if (step?.kind !== "learner_response") return;
    const example = step.responseExamples.find(({ id }) => id === "weekend-long-proposal-garden-light");
    expect(example?.japanese).toMatch(/好き|好み/);
    const binding = long.responses.find(({ responseExampleId }) => responseExampleId === "weekend-long-proposal-garden-light");
    expect(binding?.feedback.responseJapanese).toBe(example?.japanese);
    expect(binding?.feedback.feedback.composition).toContainEqual({ feature: "add", canonicalSkillId: "opinion" });
  });

  it("keeps every accepted long response option on the shared garden-and-optional-tea plan", () => {
    const long = weekendConversationDefinitions.find(({ scenario }) => scenario.length === "long")!;
    const learnerTurns = long.scenario.steps.filter((step) => step.kind === "learner_response");
    expect(learnerTurns).toHaveLength(3);
    for (const turn of learnerTurns.slice(0, 2)) {
      if (turn.kind !== "learner_response") continue;
      for (const example of turn.responseExamples) {
        expect(example.japanese).toContain("庭園");
        expect(example.japanese).toMatch(/歩/);
        expect(example.japanese).toContain("お茶");
        expect(example.japanese).toMatch(/余裕があれば|時間があれば|決めませんか/);
      }
    }
    const finalTurn = learnerTurns[2];
    expect(finalTurn.kind).toBe("learner_response");
    if (finalTurn.kind === "learner_response") {
      for (const example of finalTurn.responseExamples) {
        expect(example.japanese).toContain("駅");
        expect(example.japanese).toMatch(/十時|10時/);
      }
    }
  });
});
