import { describe, expect, it } from "vitest";
import type { ConversationLearnerText } from "../conversationScenario";
import { validateConversationSessionDefinitions } from "../conversationSession";
import { weatherConversationDefinitions } from "./weather";
import { weekendConversationDefinitions } from "./weekend";
import { schoolWorkConversationDefinitions } from "./schoolWork";

function collectStableIds(definitions: typeof schoolWorkConversationDefinitions): string[] {
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

function responseBindingsForLength(length: "short" | "medium" | "long") {
  const definition = schoolWorkConversationDefinitions.find(({ scenario }) => scenario.length === length);
  return definition?.responses ?? [];
}

describe("school and work busyness conversation content", () => {
  it("provides three valid, localized scenarios with IDs unique across existing families", () => {
    expect(schoolWorkConversationDefinitions.map(({ scenario }) => scenario.length)).toEqual([
      "short", "medium", "long"
    ]);
    expect(validateConversationSessionDefinitions(schoolWorkConversationDefinitions)).toEqual({
      valid: true,
      errors: []
    });
    const schoolWorkIds = collectStableIds(schoolWorkConversationDefinitions);
    const allIds = [
      ...collectStableIds(weatherConversationDefinitions),
      ...collectStableIds(weekendConversationDefinitions),
      ...schoolWorkIds
    ];
    expect(new Set(allIds).size).toBe(allIds.length);

    for (const { scenario } of schoolWorkConversationDefinitions) {
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

  it("models a short considerate reaction without unsolicited advice", () => {
    const short = schoolWorkConversationDefinitions.find(({ scenario }) => scenario.length === "short");
    expect(short).toBeDefined();
    if (short == null) return;
    expect(short.scenario.primarySkills).toContain("react");
    expect(short.scenario.objective.textI18n?.en).toContain("without suggesting what they should do");
    expect(short.scenario.relationship.context.textZh).toMatch(/年齡相仿/);
    const learnerStep = short.scenario.steps.find((step) => step.kind === "learner_response");
    expect(learnerStep?.kind).toBe("learner_response");
    if (learnerStep?.kind !== "learner_response") return;
    expect(learnerStep.responseExamples.length).toBeGreaterThanOrEqual(2);
    expect(learnerStep.responseExamples.some(({ japanese }) => /大変ですね|大変でしたね|忙しいですね/.test(japanese))).toBe(true);
    for (const example of learnerStep.responseExamples) {
      expect(example.japanese).not.toMatch(/したほうが|した方が|おすすめ|べきです/);
    }
    const bindings = responseBindingsForLength("short");
    expect(bindings).toHaveLength(3);
    for (const binding of bindings) {
      expect(binding.feedback.feedback.continuation).toBe("dead_end");
      expect(binding.feedback.feedback.authorRationale?.continuation).toMatch(/caring|care|kind|close/i);
    }
  });

  it("sustains a medium school/work thread through multiple learner turns and returns the ball", () => {
    const medium = schoolWorkConversationDefinitions.find(({ scenario }) => scenario.length === "medium");
    expect(medium).toBeDefined();
    if (medium == null) return;
    const learnerSteps = medium.scenario.steps.filter((step) => step.kind === "learner_response");
    expect(learnerSteps.length).toBeGreaterThanOrEqual(2);
    expect(medium.scenario.primarySkills).toEqual(expect.arrayContaining(["share", "bounce"]));
    expect(medium.scenario.objective.textI18n?.en).toMatch(/return the ball|ask back|reciproc/i);
    const questionCount = learnerSteps.flatMap((step) => step.kind === "learner_response" ? step.responseExamples : [])
      .filter(({ japanese }) => /[？?]/.test(japanese)).length;
    expect(questionCount).toBeGreaterThanOrEqual(2);
    expect(medium.scenario.steps.filter((step) => step.kind === "partner_line").length).toBeGreaterThanOrEqual(2);
    const firstTurn = medium.scenario.steps.find((step) => step.id === "schoolwork-medium-report-response");
    expect(firstTurn?.kind).toBe("learner_response");
    if (firstTurn?.kind === "learner_response") {
      for (const example of firstTurn.responseExamples) {
        expect(example.japanese).toMatch(/レポートは.*進(み|んで)/);
      }
    }
    const reportBindings = responseBindingsForLength("medium").filter(({ stepId }) => stepId === "schoolwork-medium-report-response");
    expect(reportBindings.map(({ feedback }) => feedback.responseJapanese)).toEqual(
      firstTurn?.kind === "learner_response" ? firstTurn.responseExamples.map(({ japanese }) => japanese) : []
    );
    const currentStatusLine = medium.scenario.steps.find((step) => step.id === "schoolwork-medium-report-progress");
    expect(currentStatusLine?.kind).toBe("partner_line");
    if (currentStatusLine?.kind === "partner_line") {
      expect(currentStatusLine.japanese).toBe("まだ資料を集めているところです。週末に少し進めようと思います。");
      expect(currentStatusLine.japanese).not.toMatch(/図書館|はい、/);
    }
    const secondPrompt = medium.scenario.steps.find((step) => step.id === "schoolwork-medium-weekend-response");
    expect(secondPrompt?.kind).toBe("learner_response");
    if (secondPrompt?.kind === "learner_response") {
      expect(secondPrompt.prompt.textI18n?.en).toMatch(/still gathering sources.*plans to continue working.*weekend/i);
      expect(secondPrompt.responseExamples[0]?.japanese).toMatch(/図書館/);
      expect(secondPrompt.responseExamples[1]?.japanese).toMatch(/休めそう/);
    }
    const laterPlanLine = medium.scenario.steps.find((step) => step.id === "schoolwork-medium-weekend-plan");
    expect(laterPlanLine?.kind).toBe("partner_line");
    if (laterPlanLine?.kind === "partner_line") {
      expect(laterPlanLine.japanese).toBe("土曜は図書館で少し進めて、日曜は気分転換に近所を歩こうと思います。");
    }
    const weekendBindings = responseBindingsForLength("medium").filter(({ stepId }) => stepId === "schoolwork-medium-weekend-response");
    expect(weekendBindings).toHaveLength(2);
    for (const binding of weekendBindings) {
      expect(binding.feedback.context.situation).toMatch(/still gathering sources/);
      expect(binding.feedback.context.situation).not.toMatch(/library|walk/i);
    }
  });

  it("makes long practice a relationship-aware work narrative that transitions and closes", () => {
    const long = schoolWorkConversationDefinitions.find(({ scenario }) => scenario.length === "long");
    expect(long).toBeDefined();
    if (long == null) return;
    expect(long.scenario.primarySkills).toEqual(expect.arrayContaining(["narrate", "transition", "exit", "register_adapt"]));
    expect(long.scenario.steps.filter((step) => step.kind === "learner_response")).toHaveLength(3);
    expect(long.scenario.relationship.context.textI18n?.ja).toMatch(/先輩/);
    const firstLearnerStep = long.scenario.steps.find((step) => step.kind === "learner_response");
    expect(firstLearnerStep?.kind).toBe("learner_response");
    if (firstLearnerStep?.kind === "learner_response") {
      expect(firstLearnerStep.prompt.textZh).not.toMatch(/[\u3040-\u30ff]/);
      for (const example of firstLearnerStep.responseExamples) {
        expect(example.japanese).toMatch(/最初|初日/);
        expect(example.japanese).toMatch(/前日|締め切り前日/);
        expect(example.japanese).toMatch(/当日|発表/);
      }
      expect(firstLearnerStep.responseExamples[1]?.japanese).toContain("早めに先輩に見てもらい");
    }
    const finalLearnerStep = long.scenario.steps.filter((step) => step.kind === "learner_response").at(-1);
    expect(finalLearnerStep?.kind).toBe("learner_response");
    if (finalLearnerStep?.kind === "learner_response") {
      expect(finalLearnerStep.responseExamples.some(({ japanese }) => /ありがとうございました|聞けてよかったです/.test(japanese))).toBe(true);
      expect(finalLearnerStep.prompt.textI18n?.ja).toMatch(/場合|よければ/);
      expect(finalLearnerStep.prompt.textI18n?.en).toMatch(/if you would like|if you want/i);
    }
  });
});
