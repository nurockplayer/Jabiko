import { describe, expect, it } from "vitest";
import type { ConversationLearnerText } from "../conversationScenario";
import { validateConversationSessionDefinitions } from "../conversationSession";
import { weatherConversationDefinitions } from "./weather";

describe("weather conversation content", () => {
  it("provides a playable short reaction scenario with complete response bindings", () => {
    expect(weatherConversationDefinitions).toHaveLength(3);
    expect(validateConversationSessionDefinitions(weatherConversationDefinitions)).toEqual({
      valid: true,
      errors: []
    });
    const { scenario, responses } = weatherConversationDefinitions.find(({ scenario }) => scenario.length === "short")!;
    expect(scenario.id).toBe("weather-short-morning-heat");
    expect(scenario.length).toBe("short");
    expect(scenario.primarySkills).toEqual(["react", "expand"]);
    expect(responses).toHaveLength(3);
    expect(scenario.steps.filter((step) => step.kind === "learner_response")).toHaveLength(1);
  });

  it("localizes every learner explanation for all launched languages", () => {
    expect(weatherConversationDefinitions).toHaveLength(3);
    for (const { scenario } of weatherConversationDefinitions) {
      const texts: ConversationLearnerText[] = [
        scenario.situation, scenario.relationship.context, scenario.objective, scenario.instruction
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

  it("distinguishes continuation choices without marking natural brief Japanese as incorrect", () => {
    expect(weatherConversationDefinitions).toHaveLength(3);
    const shortDefinition = weatherConversationDefinitions.find(({ scenario }) => scenario.length === "short")!;
    const feedback = shortDefinition.responses.map((binding) => binding.feedback.feedback);
    expect(feedback.map((item) => item.languageQuality)).toEqual(["natural", "natural", "natural"]);
    expect(feedback.map((item) => item.registerContextFit)).toEqual(["fits", "fits", "fits"]);
    expect(new Set(feedback.map((item) => item.continuation))).toEqual(
      new Set(["dead_end", "opens_thread", "enriches_thread"])
    );
  });

  it("provides distinct medium and long learning jobs with complete scenario bindings", () => {
    expect(weatherConversationDefinitions.map(({ scenario }) => scenario.length)).toEqual([
      "short", "medium", "long"
    ]);
    expect(new Set(weatherConversationDefinitions.map(({ scenario }) => scenario.id)).size).toBe(3);
    expect(weatherConversationDefinitions.map(({ scenario }) => scenario.id)).toEqual([
      "weather-short-morning-heat",
      "weather-medium-summer-nights",
      "weather-long-summer-routines"
    ]);
    expect(validateConversationSessionDefinitions(weatherConversationDefinitions)).toEqual({ valid: true, errors: [] });

    const medium = weatherConversationDefinitions[1].scenario;
    const long = weatherConversationDefinitions[2].scenario;
    expect(medium.steps.filter((step) => step.kind === "learner_response")).toHaveLength(2);
    expect(medium.primarySkills).toEqual(expect.arrayContaining(["share", "bounce"]));
    expect(medium.objective.textI18n?.en).toMatch(/sustain/i);
    expect(long.steps.filter((step) => step.kind === "learner_response")).toHaveLength(3);
    expect(long.primarySkills).toEqual(expect.arrayContaining(["narrate", "opinion", "transition"]));
    expect(long.objective.textI18n?.en).toContain("transition");
    expect(long.difficulty.topicDepth).toBe("personal");
    expect(long.relationship.context.textZh).toContain("社區課程");
    const longPartnerLines = long.steps.filter((step) => step.kind === "partner_line").map((step) => step.japanese);
    expect(longPartnerLines.some((line) => line.includes("電気代"))).toBe(true);
    expect(longPartnerLines.some((line) => line.includes("住む場所"))).toBe(true);
  });

  it("keeps scenario, step, example, branch, and feedback identifiers unique", () => {
    const stableIds = weatherConversationDefinitions.flatMap(({ scenario, responses }) => [
      scenario.id,
      ...scenario.steps.flatMap((step) => [
        step.id,
        ...(step.kind === "learner_response"
          ? [...step.responseExamples.map(({ id }) => id), ...step.branches.map(({ id }) => id)]
          : [])
      ]),
      ...responses.map(({ feedback }) => feedback.id)
    ]);
    expect(new Set(stableIds).size).toBe(stableIds.length);
  });

  it("makes the long narrative concrete and permits agreement on climate preferences", () => {
    const long = weatherConversationDefinitions.find(({ scenario }) => scenario.length === "long")!;
    const opening = long.scenario.steps.find(({ id }) => id === "weather-long-summer-routine");
    expect(opening?.kind).toBe("learner_response");
    if (opening?.kind !== "learner_response") return;
    expect(opening.responseExamples.find(({ id }) => id === "weather-long-routine-evening")?.japanese)
      .toMatch(/先週|この前|昨日/);

    const transition = long.scenario.steps.find(({ id }) => id === "weather-long-climate");
    expect(transition?.kind).toBe("partner_line");
    if (transition?.kind === "partner_line") expect(transition.japanese).not.toContain("ほんと、人によって違いますね");

    const final = long.scenario.steps.find(({ id }) => id === "weather-long-place-preference");
    expect(final?.kind).toBe("learner_response");
    if (final?.kind !== "learner_response") return;
    expect(final.prompt.textZh).not.toContain("不同的偏好");
    expect(long.scenario.instruction.textZh).not.toContain("不同的偏好");
    expect(final.responseExamples.map(({ id }) => id)).toContain("weather-long-preference-agree");
    expect(long.responses.some(({ responseExampleId }) => responseExampleId === "weather-long-preference-agree")).toBe(true);
  });
});
