import { describe, expect, it } from "vitest";
import { validateConversationSessionDefinitions } from "./conversationSession";
import { createConversationSession } from "./conversationSession";
import { applyCompletedConversationSession, getGameWorldAvailability, validateGameWorld, type GameWorldState } from "./gameWorld";
import { rainyMondayContent, rainyMondayContentRevision } from "./gameWorldContent/rainyMonday";
import { rainyMondayFurigana } from "./gameWorldContent/rainyMondayFurigana";
import { collectJapaneseRubySources, collectQuotedRubySources, hasKanji } from "./furigana";

function collectRubySources(value: unknown, locale: "zh-Hant" | "ja" | "en", into = new Set<string>()) {
  if (value == null || typeof value !== "object") return into;
  if ("textZh" in value && "textI18n" in value) {
    const learnerText = value as { textZh: string; textI18n?: { ja?: string; en?: string } };
    if (locale === "ja") {
      const source = learnerText.textI18n?.ja;
      if (source && hasKanji(source)) into.add(source);
    } else {
      const source = locale === "zh-Hant" ? learnerText.textZh : learnerText.textI18n?.en;
      (locale === "zh-Hant" ? collectQuotedRubySources(source) : collectJapaneseRubySources(source))
        .forEach((entry) => into.add(entry));
    }
    return into;
  }
  if (Array.isArray(value)) value.forEach((item) => collectRubySources(item, locale, into));
  else Object.values(value).forEach((item) => collectRubySources(item, locale, into));
  return into;
}

describe("Rainy Monday content pack", () => {
  it("assembles the fixed office-day arc from four existing leaves and two new bridges", () => {
    const { profile, world } = rainyMondayContent;
    expect(profile).toBe("jabiko-game-content/v1");
    expect(rainyMondayContentRevision).toBe(1);
    expect(Object.keys(rainyMondayContent).sort()).toEqual(["profile", "world"]);
    expect(world.id).toBe("rainy-monday");
    expect(world.locations).toHaveLength(3);
    expect(world.npcs).toHaveLength(2);
    expect(world.moments).toHaveLength(6);
    expect(world.sessionDefinitions.map(({ scenario }) => scenario.id)).toEqual([
      "rainy-monday-entry",
      "weekend-short-movie-plans",
      "food-short-daily-special-clarification",
      "commute-medium-train-and-bicycle",
      "schoolwork-long-first-project-story",
      "rainy-monday-covered-route"
    ]);
    expect(world.sessionDefinitions.map(({ scenario }) => scenario.length).sort()).toEqual([
      "long", "medium", "medium", "short", "short", "short"
    ]);
    expect(validateConversationSessionDefinitions(world.sessionDefinitions)).toEqual({ valid: true, errors: [] });
    expect(validateGameWorld(world)).toEqual({ valid: true, errors: [] });
    expect(getGameWorldAvailability(world, world.initialState)).toMatchObject({
      status: "ready",
      availableMomentIds: ["rain-entry"]
    });
  });

  it("keeps the rainy entry as a fixed authored context and the optional beat reachable without gating the core arc", () => {
    const { world } = rainyMondayContent;
    const entry = world.sessionDefinitions.find(({ scenario }) => scenario.id === "rainy-monday-entry")!.scenario;
    expect(entry.situation.textI18n?.ja).toContain("雨");
    expect(entry.situation.textI18n?.ja).toMatch(/月曜日/);
    expect(entry.seasonalAssociation).toBeUndefined();
    const optional = world.moments.find(({ id }) => id === "covered-route-optional")!;
    expect(optional.completesArc).toBeUndefined();
    expect(optional.conditionalOutcomes).toEqual([]);
    expect(world.moments.find(({ id }) => id === "rain-entry")?.conditionalOutcomes).toHaveLength(1);
  });

  it("gives the optional medium beat two linked response turns and keeps Chinese support text localized", () => {
    const { world } = rainyMondayContent;
    const scenario = world.sessionDefinitions.find(({ scenario }) => scenario.id === "rainy-monday-covered-route")!.scenario;
    expect(scenario.steps.filter(({ kind }) => kind === "learner_response")).toHaveLength(2);
    expect(scenario.primarySkills).toEqual(["share", "bounce"]);
    expect(scenario.situation.textI18n?.ja).not.toContain("明日");
    const learnerTexts: { textZh: string }[] = [
      scenario.situation, scenario.relationship.context, scenario.objective, scenario.instruction,
      ...scenario.steps.flatMap((step) => step.kind === "learner_response"
        ? [step.prompt, ...step.responseExamples.flatMap((example) => example.explanation ? [example.explanation] : [])]
        : step.kind === "completion" ? [step.summary] : []),
      ...world.npcs.flatMap((npc) => [npc.presentation, npc.defaultRelationshipContext]),
      ...world.relationshipStages.map((stage) => stage.context),
      ...world.locations.map((location) => location.description)
    ];
    for (const text of learnerTexts) {
      expect(text.textZh).not.toMatch(/[ぁ-んァ-ヺ]/);
    };
  });

  it("keeps the bridge Japanese in Japanese fields and records the actual response moves", () => {
    const { world } = rainyMondayContent;
    const entry = world.sessionDefinitions.find(({ scenario }) => scenario.id === "rainy-monday-entry")!;
    expect(entry.scenario.instruction.textI18n?.ja).toMatch(/[ぁ-ん]/);
    expect(entry.scenario.objective.textI18n?.ja).not.toContain("雨の朝");
    const responseFor = (definition: typeof entry, id: string) => definition.responses.find(({ responseExampleId }) => responseExampleId === id)!.feedback.feedback.composition;
    expect(responseFor(entry, "rainy-entry-short")).toContainEqual({ feature: "add", canonicalSkillId: "share" });
    expect(responseFor(entry, "rainy-entry-rich")).toContainEqual({ feature: "ask", canonicalSkillId: "expand" });
    expect(responseFor(entry, "rainy-entry-rich")).toContainEqual({ feature: "add", canonicalSkillId: "share" });
    const optional = world.sessionDefinitions.find(({ scenario }) => scenario.id === "rainy-monday-covered-route")!;
    expect(optional.responses.find(({ responseExampleId }) => responseExampleId === "covered-route-followup-rich")!.feedback.responseJapanese)
      .toContain("帰りも同じ道");
    expect(optional.responses.find(({ responseExampleId }) => responseExampleId === "covered-route-followup-rich")!.feedback.feedback.composition)
      .toContainEqual({ feature: "add", canonicalSkillId: "share" });
  });

  it("keeps the generated lazy ruby map complete for the rendered world copy", () => {
    const sources = new Set<string>();
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      collectRubySources(rainyMondayContent.world, locale, sources);
      for (const definition of rainyMondayContent.world.sessionDefinitions) {
        for (const step of definition.scenario.steps) {
          if (step.kind === "partner_line" && hasKanji(step.japanese)) sources.add(step.japanese);
          if (step.kind === "learner_response") {
            for (const response of step.responseExamples) if (hasKanji(response.japanese)) sources.add(response.japanese);
          }
        }
      }
    }
    const missing = [...sources].filter((source) => !Object.hasOwn(rainyMondayFurigana, source));
    expect(missing).toEqual([]);
    expect(rainyMondayFurigana["青葉駅"]).toEqual([
      { t: "青葉", r: "あおば" }, { t: "駅", r: "えき" }
    ]);
    expect(rainyMondayFurigana["佐藤さん"]).toEqual([
      { t: "佐藤", r: "さとう" }, { t: "さん" }
    ]);
    const segmentsWithReading = (surface: string, reading: string) =>
      Object.values(rainyMondayFurigana).flat().some((segment) => segment.t === surface && segment.r === reading);
    expect(segmentsWithReading("一人", "ひとり")).toBe(true);
    expect(segmentsWithReading("一駅分", "ひとえきぶん")).toBe(true);
    expect(segmentsWithReading("一本", "いっぽん")).toBe(true);
    expect(rainyMondayFurigana["私は電車が多いです。乗っている間に本が読めるので。自転車通勤のどんなところが気に入っていますか？"])
      .toContainEqual({ t: "間", r: "あいだ" });
  });

  it("reaches a valid ready-empty terminal state after the five required moments", () => {
    const { world } = rainyMondayContent;
    let state: GameWorldState = world.initialState;
    const requiredMomentIds = ["rain-entry", "movie-plans", "daily-special", "commute-chat", "project-story"];
    for (const momentId of requiredMomentIds) {
      const availability = getGameWorldAvailability(world, state);
      expect(availability.status).toBe("ready");
      if (availability.status !== "ready" || !availability.availableMomentIds.includes(momentId)) {
        throw new Error(`Expected required moment ${momentId} to be available.`);
      }
      const moment = world.moments.find(({ id }) => id === momentId)!;
      const definition = world.sessionDefinitions.find(({ scenario }) => scenario.id === moment.scenarioId)!;
      const session = createConversationSession([definition]);
      session.select(definition.scenario.id);
      session.start();
      while (session.getState().phase !== "complete") {
        const step = session.getState().step;
        if (session.getState().phase === "feedback") {
          if (!session.continue()) throw new Error(`Could not continue required moment ${momentId}.`);
        } else if (step?.kind === "partner_line") {
          if (!session.advance()) throw new Error(`Could not advance required moment ${momentId}.`);
        } else if (step?.kind === "learner_response") {
          const response = step.responseExamples[0];
          if (!response || session.submitResponse(response.id) == null) {
            throw new Error(`Could not answer required moment ${momentId}.`);
          }
        } else {
          throw new Error(`Unexpected step while completing required moment ${momentId}.`);
        }
      }
      const transition = applyCompletedConversationSession(world, state, momentId, session.getState());
      expect(transition.applied).toBe(true);
      state = transition.state;
    }
    expect(state.completedMomentIds).toEqual(expect.arrayContaining(requiredMomentIds));
    expect(getGameWorldAvailability(world, state)).toEqual({ status: "ready", availableMomentIds: [] });
  });
});
