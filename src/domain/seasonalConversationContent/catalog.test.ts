import { describe, expect, it } from "vitest";
import { createConversationSession, validateConversationSessionDefinitions } from "../conversationSession";
import {
  localizeConversationLearnerText,
  type ConversationLearnerText
} from "../conversationScenario";
import { conversationCatalogDefinitions } from "../conversationContent/catalog";
import { selectRelevantSeasonalEvents } from "../seasonalEvents";
import {
  seasonalConversationDefinitions,
  seasonalConversationEvents,
  seasonalConversationFamilies
} from "./catalog";

const expectedAnchors = [
  ["new-year", 1, 1],
  ["foundation-day", 2, 11],
  ["hinamatsuri", 3, 3],
  ["school-year-start", 4, 1],
  ["childrens-day", 5, 5],
  ["time-day", 6, 10],
  ["tanabata", 7, 7],
  ["mountain-day", 8, 11],
  ["disaster-prevention-day", 9, 1],
  ["coffee-day", 10, 1],
  ["culture-day", 11, 3],
  ["labour-thanksgiving-day", 11, 23],
  ["new-years-eve", 12, 31]
] as const;

function allLearnerTexts(
  definitions: typeof seasonalConversationDefinitions
): ConversationLearnerText[] {
  return definitions.flatMap(({ scenario }) => [
    scenario.situation,
    scenario.relationship.context,
    scenario.objective,
    scenario.instruction,
    ...scenario.steps.flatMap((step) => step.kind === "learner_response"
      ? [step.prompt, ...step.responseExamples.flatMap((example) => example.explanation ? [example.explanation] : [])]
      : step.kind === "completion" ? [step.summary] : [])
  ]);
}

function definitionById(id: string) {
  const definition = seasonalConversationDefinitions.find(({ scenario }) => scenario.id === id);
  if (!definition) throw new Error(`Missing seasonal definition: ${id}`);
  return definition;
}

function learnerResponseSteps(definition: ReturnType<typeof definitionById>) {
  return definition.scenario.steps.filter((step) => step.kind === "learner_response");
}

describe("seasonal conversation catalog", () => {
  it("contains thirteen fixed, sourced anchors and all three phases", () => {
    expect(seasonalConversationFamilies).toHaveLength(13);
    expect(seasonalConversationEvents).toHaveLength(13);
    expect(seasonalConversationDefinitions).toHaveLength(39);
    expect(seasonalConversationEvents.map(({ id, dateRule }) => [
      id,
      dateRule.kind === "annual" ? dateRule.start.month : null,
      dateRule.kind === "annual" ? dateRule.start.day : null
    ])).toEqual(expectedAnchors);
    expect(new Set(seasonalConversationEvents.map(({ id }) => id)).size).toBe(13);

    for (const family of seasonalConversationFamilies) {
      expect(family.event.provenance?.source).toMatch(/^https:\/\//);
      expect(family.event.provenance?.accessedOn).toBe("2026-09-26");
      expect(family.event.timeZone).toBe("Asia/Tokyo");
      expect(family.event.dateRule.kind).toBe("annual");
      expect(family.event.associations.before).toHaveLength(1);
      expect(family.event.associations.active).toHaveLength(1);
      expect(family.event.associations.after).toHaveLength(1);
      expect(family.definitions).toHaveLength(3);
      expect(family.definitions.map(({ scenario }) => scenario.seasonalAssociation?.eventId))
        .toEqual([family.event.id, family.event.id, family.event.id]);
      for (const definition of family.definitions) {
        expect(definition.scenario.sources).toEqual([
          expect.objectContaining({ url: family.event.provenance?.source, accessedOn: "2026-09-26" })
        ]);
      }
    }
  });

  it("keeps every selector result closed over its authored phase and scenario", () => {
    const eventsById = new Map(seasonalConversationEvents.map((event) => [event.id, event]));
    const definitionsById = new Map(seasonalConversationDefinitions.map((definition) => [
      definition.scenario.id,
      definition
    ]));

    for (let year = 2026; year <= 2028; year += 1) {
      const daysInYear = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
      for (let day = 0; day < daysInYear; day += 1) {
        const date = new Date(Date.UTC(year, 0, day + 1)).toISOString().slice(0, 10);
        const selected = selectRelevantSeasonalEvents(
          seasonalConversationEvents,
          new Date(`${date}T12:00:00+09:00`)
        );
        expect(selected.length, `no seasonal content on ${date}`).toBeGreaterThan(0);
        for (const relevance of selected) {
          const event = eventsById.get(relevance.eventId);
          expect(event, relevance.eventId).toBeDefined();
          const association = relevance.phase === "active"
            ? event?.associations.active
            : relevance.phase === "recent"
              ? event?.associations.after
              : event?.associations.before;
          expect(relevance.contentIds).toEqual(association);
          for (const contentId of relevance.contentIds) {
            expect(definitionsById.get(contentId)?.scenario.seasonalAssociation?.eventId)
              .toBe(relevance.eventId);
          }
        }
      }
    }

    const yearBoundary = selectRelevantSeasonalEvents(
      seasonalConversationEvents,
      new Date("2026-12-31T15:00:00Z")
    );
    expect(yearBoundary.map(({ eventId }) => eventId)).toContain("new-year");
    expect(yearBoundary.map(({ eventId }) => eventId)).toContain("new-years-eve");
  });

  it("selects the correct authored association at every annual phase boundary", () => {
    for (const event of seasonalConversationEvents) {
      if (event.dateRule.kind !== "annual") throw new Error(`${event.id} must be annual`);
      const { month, day } = event.dateRule.start;
      const occurrence = new Date(Date.UTC(2028, month - 1, day, 3));
      const instantAtOffset = (offset: number) => new Date(occurrence.getTime() + offset * 86_400_000);
      const expected = [
        [-8, "upcoming", event.associations.before],
        [-1, "imminent", event.associations.before],
        [0, "active", event.associations.active],
        [14, "recent", event.associations.after]
      ] as const;
      for (const [offset, phase, contentIds] of expected) {
        const result = selectRelevantSeasonalEvents(
          [event],
          instantAtOffset(offset)
        )[0];
        expect(result, `${event.id} ${offset} days`).toMatchObject({ phase, contentIds });
      }
    }

    const newYear = seasonalConversationEvents.find(({ id }) => id === "new-year");
    if (!newYear) throw new Error("new-year event is missing");
    for (const day of [2, 15]) {
      const selected = selectRelevantSeasonalEvents(
        [newYear],
        new Date(`2027-01-${String(day).padStart(2, "0")}T12:00:00+09:00`)
      )[0];
      expect(selected?.phase).toBe("recent");
      expect(selected?.contentIds).toEqual(newYear.associations.after);
    }
    const newYearAfter = seasonalConversationDefinitions.find(({ scenario }) =>
      scenario.id === "seasonal-new-year-after"
    );
    if (!newYearAfter) throw new Error("new-year recent scenario is missing");
    expect(newYearAfter?.scenario.situation.textZh).toContain("元日");
    expect(newYearAfter?.scenario.situation.textI18n?.ja).toContain("元日");
    expect(newYearAfter?.scenario.situation.textI18n?.en).toContain("New Year");
    for (const step of newYearAfter.scenario.steps) {
      if (step.kind === "partner_line") expect(step.japanese).not.toMatch(/昨日|明日/);
      if (step.kind === "learner_response") {
        for (const example of step.responseExamples) expect(example.japanese).not.toMatch(/昨日|明日/);
      }
    }
    const yearEndAfter = seasonalConversationDefinitions.find(({ scenario }) =>
      scenario.id === "seasonal-new-years-eve-after"
    );
    if (!yearEndAfter) throw new Error("new-years-eve recent scenario is missing");
    const yearEndResponses = yearEndAfter.scenario.steps.flatMap((step) =>
      step.kind === "learner_response" ? step.responseExamples.map(({ japanese }) => japanese) : []
    );
    expect(yearEndResponses.some((line) => line.includes("去年"))).toBe(true);
    expect(yearEndResponses.some((line) => line.includes("今年撮った写真"))).toBe(false);
  });

  it("uses distinct authored medium and deeper long learning arcs", () => {
    const medium = seasonalConversationDefinitions.filter(({ scenario }) => scenario.length === "medium");
    const long = seasonalConversationDefinitions.filter(({ scenario }) => scenario.length === "long");
    expect(medium.length).toBeGreaterThanOrEqual(3);
    expect(long.length).toBeGreaterThanOrEqual(3);
    const deeperLong = long.filter(({ scenario }) =>
      scenario.difficulty.linguisticComplexity === "advanced" &&
      scenario.difficulty.topicDepth !== "concrete"
    );
    expect(deeperLong.length).toBeGreaterThanOrEqual(3);
    for (const { scenario } of long) {
      const responseSteps = scenario.steps.filter((step) => step.kind === "learner_response");
      expect(responseSteps.length, scenario.id).toBeGreaterThanOrEqual(3);
      expect(scenario.primarySkills).toEqual(expect.arrayContaining(["narrate"]));
      if (scenario.difficulty.linguisticComplexity === "advanced") {
        expect(responseSteps.map((step) => step.prompt.textZh).join(" ")).toMatch(/理由|原因|経験|考え|目標|選択|忙碌|多種看法/);
      }
    }
  });

  it("keeps advertised conversational jobs true on every selectable response path", () => {
    const mismatches: string[] = [];
    for (const definition of seasonalConversationDefinitions) {
      const responseSteps = learnerResponseSteps(definition);
      const guaranteedQuestion = responseSteps.some((step) =>
        step.responseExamples.every(({ japanese }) => /[?？]/.test(japanese))
      );
      const phaseCopy = [
        definition.scenario.objective,
        definition.scenario.instruction,
        definition.scenario.steps.find((step) => step.kind === "completion")?.summary
      ].filter((value): value is ConversationLearnerText => value !== undefined);
      const promptCopy = responseSteps.map(({ prompt }) => ({ prompt, step: responseSteps.find((item) => item.prompt === prompt) }));
      for (const text of phaseCopy) {
        const english = text.textI18n?.en ?? "";
        const promisesQuestion = /\b(?:ask|invite)\b|return the (?:turn|question)/i.test(english);
        const explicitlyOptional = /\b(?:optionally|may ask|if appropriate|can ask|if it feels natural|if they wish)\b/i.test(english);
        if (promisesQuestion && !explicitlyOptional) {
          if (!guaranteedQuestion) mismatches.push(`${definition.scenario.id}: ${english}`);
        }
      }
      for (const { prompt, step } of promptCopy) {
        const english = prompt.textI18n?.en ?? "";
        const promisesQuestion = /\b(?:ask|invite)\b|return the (?:turn|question)/i.test(english);
        const explicitlyOptional = /\b(?:optionally|may ask|if appropriate|can ask|if it feels natural|if they wish)\b/i.test(english);
        if (promisesQuestion && !explicitlyOptional &&
          !step?.responseExamples.every(({ japanese }) => /[?？]/.test(japanese))) {
          mismatches.push(`${definition.scenario.id}: ${english}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("keeps localized completion claims and response credit truthful on every branch", () => {
    const completion = (id: string) => {
      const step = definitionById(id).scenario.steps.find((candidate) => candidate.kind === "completion");
      if (!step || step.kind !== "completion") throw new Error(`Missing completion: ${id}`);
      return step.summary;
    };
    const hinaCompletion = completion("seasonal-hinamatsuri-active");
    expect(hinaCompletion.textZh).not.toMatch(/詢問|邀請|聽了對方/);
    expect(hinaCompletion.textI18n?.ja).not.toMatch(/尋ね|聞け|招き/);

    const yearEndCompletion = completion("seasonal-new-years-eve-after");
    expect(yearEndCompletion.textZh).not.toMatch(/邀請|聽取|聽了對方/);
    expect(yearEndCompletion.textI18n?.ja).not.toMatch(/聞け|尋ね|招き/);

    const cultureAfter = definitionById("seasonal-culture-day-after");
    const cultureLastStep = learnerResponseSteps(cultureAfter).at(-1);
    if (!cultureLastStep) throw new Error("Culture Day final response is missing");
    for (const example of cultureLastStep.responseExamples) {
      const binding = cultureAfter.responses.find(({ responseExampleId }) => responseExampleId === example.id);
      if (!binding) throw new Error(`Missing response binding: ${example.id}`);
      expect(binding.feedback.feedback.composition.map(({ canonicalSkillId }) => canonicalSkillId), example.japanese)
        .not.toContain("narrate");
    }
    expect(completion("seasonal-culture-day-after").textZh).not.toMatch(/敘述了|敘述/);
    expect(completion("seasonal-culture-day-after").textI18n?.ja).not.toMatch(/語りました|話しました/);
    expect(completion("seasonal-culture-day-after").textI18n?.en).not.toMatch(/narrated/i);

    const coffeeAfter = definitionById("seasonal-coffee-day-after");
    expect(coffeeAfter.scenario.objective.textZh).not.toMatch(/敘述/);
    expect(coffeeAfter.scenario.objective.textI18n?.ja).not.toMatch(/経験を話し/);
    expect(coffeeAfter.scenario.objective.textI18n?.en).not.toMatch(/narrate/i);
    const coffeeCompletion = completion("seasonal-coffee-day-after");
    expect(coffeeCompletion.textZh).not.toMatch(/敘述/);
    expect(coffeeCompletion.textI18n?.ja).not.toMatch(/飲み物を選んだ経験を話し/);
    expect(coffeeCompletion.textI18n?.en).not.toMatch(/narrated/i);

    expect(definitionById("seasonal-tanabata-active").scenario.difficulty)
      .toMatchObject({ relationshipDistance: "neutral", topicDepth: "concrete" });
    expect(definitionById("seasonal-disaster-prevention-day-active").scenario.difficulty)
      .toMatchObject({ relationshipDistance: "neutral", topicDepth: "concrete" });
  });

  it("keeps remaining launched prompts, instructions, and bounded contexts aligned with choices", () => {
    const responsePrompts = (id: string) => learnerResponseSteps(definitionById(id))
      .map((step) => step.prompt);
    const newYearEveBeforePrompts = responsePrompts("seasonal-new-years-eve-before");
    expect(newYearEveBeforePrompts[1]?.textZh).toMatch(/[\u4e00-\u9fff]/);
    expect(newYearEveBeforePrompts[1]?.textZh).not.toMatch(/[\u3040-\u30ff]/);

    expect(responsePrompts("seasonal-new-year-after")[0]?.textI18n?.ja)
      .toMatch(/経験を話し/);
    expect(responsePrompts("seasonal-new-year-after")[0]?.textI18n?.ja)
      .not.toMatch(/経験を聞き/);

    for (const prompt of responsePrompts("seasonal-hinamatsuri-active")) {
      expect(prompt.textZh).not.toMatch(/邀請對方|詢問對方/);
    }
    for (const id of ["seasonal-mountain-day-before", "seasonal-labour-thanksgiving-day-before"]) {
      for (const prompt of responsePrompts(id)) {
        expect(prompt.textZh).not.toMatch(/詢問對方。|問問對方。|把問題交回對方|把話題交回去/);
        expect(prompt.textI18n?.ja).not.toMatch(/相手にも尋ねましょう|相手に聞き返しましょう|相手にも尋ね返しましょう/);
      }
    }

    const coffeeAfter = definitionById("seasonal-coffee-day-after");
    expect(coffeeAfter.scenario.objective.textZh).not.toMatch(/選擇的經驗|敘述.*選擇/);
    for (const prompt of responsePrompts("seasonal-coffee-day-after")) {
      expect(prompt.textZh).not.toMatch(/詢問.*是否適合|確認.*對方/);
      expect(prompt.textI18n?.ja).not.toMatch(/合うか尋ね|相手に合うか聞/);
      expect(prompt.textI18n?.en).not.toMatch(/check whether.*suits/i);
    }
    const cultureAfter = definitionById("seasonal-culture-day-after");
    expect(cultureAfter.scenario.instruction.textZh).not.toMatch(/印象改變/);
    expect(cultureAfter.scenario.instruction.textI18n?.ja).not.toMatch(/印象が変わった理由/);

    expect(definitionById("seasonal-disaster-prevention-day-before").scenario.situation.textZh)
      .not.toMatch(/下週公布/);
  });

  it("keeps shared continuations and learning jobs compatible with every selected response", () => {
    const firstPartnerLine = (id: string) => definitionById(id).scenario.steps
      .find((step) => step.kind === "partner_line")?.japanese ?? "";
    const foundationActive = firstPartnerLine("seasonal-foundation-day-active");
    expect(foundationActive).toMatch(/この後/);
    expect(foundationActive).toMatch(/家で過ごす/);

    const foundationAfter = definitionById("seasonal-foundation-day-after").scenario.objective;
    expect(foundationAfter.textZh).toMatch(/散步.*具體細節/);
    expect(foundationAfter.textI18n?.ja).toMatch(/散歩.*具体的なこと/);
    expect(foundationAfter.textI18n?.en).toMatch(/walk.*concrete follow-up/i);

    const newYearAfter = definitionById("seasonal-new-year-after");
    const newYearFirstAnswer = learnerResponseSteps(newYearAfter)[0]?.responseExamples[0]?.japanese ?? "";
    expect(newYearFirstAnswer).toMatch(/外に出なかった|外には出ず/);

    const childrenAfter = definitionById("seasonal-childrens-day-after");
    const childrenSteps = learnerResponseSteps(childrenAfter);
    const childrenSharedContinuation = childrenAfter.scenario.steps
      .find((step) => step.id === "seasonal-childrens-day-after-partner-2");
    if (!childrenSharedContinuation || childrenSharedContinuation.kind !== "partner_line") {
      throw new Error("Children's Day shared continuation is missing");
    }
    expect(childrenSharedContinuation.japanese).toMatch(/風/);
    expect(childrenSharedContinuation.japanese).toMatch(/こいのぼり/);
    const childrenFirst = childrenSteps[0];
    const childrenQuestion = childrenFirst?.responseExamples[0];
    if (!childrenFirst || !childrenQuestion) throw new Error("Children's Day first response is missing");
    const childrenQuestionBinding = childrenAfter.responses.find(({ responseExampleId }) => responseExampleId === childrenQuestion.id);
    expect(childrenQuestionBinding?.feedback.feedback.composition).toContainEqual({ feature: "ask", canonicalSkillId: "expand" });
    const childrenFinal = childrenSteps.at(-1);
    if (!childrenFinal) throw new Error("Children's Day final response is missing");
    for (const example of childrenFinal.responseExamples) {
      expect(example.japanese).toContain("公園");
      expect(example.japanese).toContain("川沿い");
    }

    const disasterBefore = definitionById("seasonal-disaster-prevention-day-before");
    expect(disasterBefore.scenario.objective.textZh).toMatch(/時間.*地點|地點.*時間/);
    expect(disasterBefore.scenario.objective.textI18n?.ja).toMatch(/時刻.*場所|場所.*時刻/);
    expect(disasterBefore.scenario.objective.textI18n?.en).toMatch(/time or meeting place/i);
    const disasterActive = definitionById("seasonal-disaster-prevention-day-active");
    expect(disasterActive.scenario.situation.textZh).toMatch(/集合地點/);
    expect(disasterActive.scenario.situation.textI18n?.ja).toMatch(/集合場所/);

    expect(definitionById("seasonal-tanabata-after").scenario.difficulty.relationshipDistance).toBe("familiar");

    const cultureActive = definitionById("seasonal-culture-day-active");
    expect(cultureActive.scenario.primarySkills).not.toContain("bounce");
    for (const [field, label] of [
      [cultureActive.scenario.objective, "objective"],
      [cultureActive.scenario.instruction, "instruction"]
    ] as const) {
      expect(field.textZh, label).toMatch(/可選|任意|由自己決定/);
      expect(field.textI18n?.ja, label).toMatch(/任意|必要なら/);
      expect(field.textI18n?.en, label).toMatch(/optional|may/i);
    }

    const cultureAfter = definitionById("seasonal-culture-day-after");
    const cultureSteps = learnerResponseSteps(cultureAfter);
    const cultureFirstQuestion = cultureSteps[0]?.responseExamples[0];
    if (!cultureFirstQuestion) throw new Error("Culture Day first response is missing");
    const cultureFirstBinding = cultureAfter.responses.find(({ responseExampleId }) => responseExampleId === cultureFirstQuestion.id);
    expect(cultureFirstBinding?.feedback.feedback.composition).toContainEqual({ feature: "ask", canonicalSkillId: "expand" });
    const cultureSharedContinuation = cultureAfter.scenario.steps
      .find((step) => step.id === "seasonal-culture-day-after-partner-3");
    if (!cultureSharedContinuation || cultureSharedContinuation.kind !== "partner_line") {
      throw new Error("Culture Day shared continuation is missing");
    }
    expect(cultureSharedContinuation.japanese).toMatch(/形/);
    expect(cultureSharedContinuation.japanese).toMatch(/余白/);
    expect(cultureSharedContinuation.japanese).toMatch(/友人/);

    const yearEndAfter = definitionById("seasonal-new-years-eve-after");
    const yearEndFirst = learnerResponseSteps(yearEndAfter)[0]?.responseExamples[0]?.japanese ?? "";
    expect(yearEndFirst).toContain("去年");
    expect(yearEndFirst).not.toContain("前年");
    const coffeeLines = learnerResponseSteps(definitionById("seasonal-coffee-day-after"))
      .flatMap((step) => step.responseExamples.map(({ japanese }) => japanese));
    expect(coffeeLines.some((line) => line.includes("両方が選びやすいメニュー"))).toBe(false);
    const labourLines = learnerResponseSteps(definitionById("seasonal-labour-thanksgiving-day-after"))
      .flatMap((step) => step.responseExamples.map(({ japanese }) => japanese));
    expect(labourLines.some((line) => line.includes("短くても休むと変わりますね"))).toBe(false);

    const coffeeBeforeContinuation = definitionById("seasonal-coffee-day-before").scenario.steps
      .find((step) => step.id === "seasonal-coffee-day-before-partner-2");
    if (!coffeeBeforeContinuation || coffeeBeforeContinuation.kind !== "partner_line") {
      throw new Error("Coffee Day shared continuation is missing");
    }
    expect(coffeeBeforeContinuation.japanese).toMatch(/温かい/);
  });

  it("credits explicit fit checks while keeping question-shaped proposals as negotiation", () => {
    const compositionFor = (scenarioId: string, japanese: string) => {
      const definition = definitionById(scenarioId);
      const example = learnerResponseSteps(definition)
        .flatMap((step) => step.responseExamples)
        .find((candidate) => candidate.japanese === japanese);
      if (!example) throw new Error(`Missing authored response in ${scenarioId}: ${japanese}`);
      const binding = definition.responses.find(({ responseExampleId }) => responseExampleId === example.id);
      if (!binding) throw new Error(`Missing authored response binding: ${example.id}`);
      return binding.feedback.feedback.composition;
    };

    for (const [scenarioId, japanese] of [
      ["seasonal-tanabata-after", "以前は毎日読む目標にしましたが、忙しい日にできないと、続けること自体をあきらめそうになりました。そこで時間のある日に数ページ読む形に変えました。毎日の記録より、読む時間を楽しめるほうを大切にしました。決まった曜日だけにする方法は合いそうですか？"],
      ["seasonal-tanabata-after", "予定どおりにできないと目標が負担になるので、忙しい日は休み、余裕のある日に戻る形にしました。回数は減っても、長く続けられるほうが自分には現実的でした。短い時間だけ続ける方法は合いそうですか？"],
      ["seasonal-coffee-day-after", "飲み物の種類が多いと、好みが違っても選べるので重視したいです。お茶も選びやすいですか？"]
    ] as const) {
      expect(compositionFor(scenarioId, japanese)).toContainEqual({ feature: "ask", canonicalSkillId: "expand" });
    }

    for (const [scenarioId, japanese] of [
      ["seasonal-coffee-day-before", "私はミルクを入れたコーヒーが好きですが、今日はお茶もよさそうです。コーヒー以外のメニューも見てみませんか？"],
      ["seasonal-tanabata-after", "できる日に短く、という形が合いそうですね。最初に一章だけと決めると、忙しい日に量を調整しやすいかもしれません。試してみませんか？"],
      ["seasonal-tanabata-after", "いいですね。始めた日に、読んだところを一行だけメモするのはどうですか？"],
      ["seasonal-new-years-eve-before", "その過ごし方もよさそうですね。もし別の日に会いたくなったら、空いている時間に短く話すのはどうですか？"]
    ] as const) {
      const composition = compositionFor(scenarioId, japanese);
      expect(composition).toContainEqual({ feature: "add", canonicalSkillId: "negotiate" });
      expect(composition.some(({ feature }) => feature === "ask")).toBe(false);
    }
  });

  it("keeps late-stage shared lines and year-window copy compatible with every branch", () => {
    const cultureAfter = definitionById("seasonal-culture-day-after");
    const cultureContinuation = cultureAfter.scenario.steps.find(
      (step) => step.id === "seasonal-culture-day-after-partner-3"
    );
    if (!cultureContinuation || cultureContinuation.kind !== "partner_line") {
      throw new Error("Culture Day partner continuation is missing");
    }
    expect(cultureContinuation.japanese).toMatch(/作品の端.*形が特に印象/);
    expect(cultureContinuation.japanese).toMatch(/余白との位置関係/);
    expect(cultureContinuation.japanese).not.toMatch(/余白に目を向けたのも面白い/);

    const childrenAfter = definitionById("seasonal-childrens-day-after");
    for (const [field, label] of [
      [childrenAfter.scenario.objective, "objective"],
      [learnerResponseSteps(childrenAfter)[0]?.prompt, "turn-one prompt"]
    ] as const) {
      if (!field) throw new Error(`Children's Day ${label} is missing`);
      expect(field.textZh, label).toMatch(/比較|回應.*觀察/);
      expect(field.textI18n?.ja, label).toMatch(/比べ|応じ/);
      expect(field.textI18n?.en, label).toMatch(/compare|respond/i);
      expect(field.textZh, label).not.toMatch(/回憶自己的觀察/);
      expect(field.textI18n?.ja, label).not.toMatch(/自分の観察を振り返り/);
      expect(field.textI18n?.en, label).not.toMatch(/recall your observation/i);
    }
    const childrenFirstA = learnerResponseSteps(childrenAfter)[0]?.responseExamples[0];
    if (!childrenFirstA) throw new Error("Children's Day first option is missing");
    const childrenFirstBinding = childrenAfter.responses.find(({ responseExampleId }) => responseExampleId === childrenFirstA.id);
    expect(childrenFirstBinding?.feedback.feedback.composition).toContainEqual({ feature: "add", canonicalSkillId: "share" });
    expect(childrenFirstBinding?.feedback.feedback.composition).toContainEqual({ feature: "ask", canonicalSkillId: "expand" });

    const newYearAfter = definitionById("seasonal-new-year-after");
    expect(newYearAfter.scenario.situation.textZh).toMatch(/在家休息|短暫散步/);
    expect(newYearAfter.scenario.situation.textI18n?.ja).toMatch(/家で休|短い散歩/);
    expect(newYearAfter.scenario.situation.textI18n?.en).toMatch(/stay home|short walk/i);
    expect(newYearAfter.scenario.situation.textZh).not.toMatch(/一人在家.*另一人/);
    expect(newYearAfter.scenario.situation.textI18n?.ja).not.toMatch(/一人は家.*もう一人/);
    expect(newYearAfter.scenario.situation.textI18n?.en).not.toMatch(/one stayed home while the other/i);

    const yearEndEvent = seasonalConversationEvents.find(({ id }) => id === "new-years-eve");
    if (!yearEndEvent) throw new Error("New Year's Eve event is missing");
    const jan10 = selectRelevantSeasonalEvents(
      [yearEndEvent],
      new Date("2027-01-10T12:00:00+09:00")
    )[0];
    expect(jan10?.phase).toBe("recent");
    const yearEndAfter = definitionById("seasonal-new-years-eve-after");
    const yearEndResponses = learnerResponseSteps(yearEndAfter).flatMap((step) => step.responseExamples.map(({ japanese }) => japanese));
    expect(yearEndResponses.some((line) => line.includes("去年撮った写真"))).toBe(true);
    expect(yearEndResponses.some((line) => line.includes("今年撮った写真"))).toBe(false);
  });

  it("preserves the reviewed medium reciprocity and honest response credit", () => {
    const childrenAfter = definitionById("seasonal-childrens-day-after");
    const childrenSteps = learnerResponseSteps(childrenAfter);
    expect(childrenSteps).toHaveLength(2);
    expect(childrenSteps[1]?.prompt.textI18n?.en).toMatch(/compare/i);
    expect(childrenSteps[1]?.responseExamples.map(({ japanese }) => japanese).join(" "))
      .toMatch(/公園|川沿い/);

    const newYearAfter = definitionById("seasonal-new-year-after");
    const finalLearnerStep = learnerResponseSteps(newYearAfter).at(-1);
    if (!finalLearnerStep) throw new Error("New Year recent response is missing");
    for (const example of finalLearnerStep.responseExamples) {
      const binding = newYearAfter.responses.find(({ responseExampleId }) => responseExampleId === example.id);
      if (!binding) throw new Error(`Missing response binding: ${example.id}`);
      const skills = binding.feedback.feedback.composition.map(({ canonicalSkillId }) => canonicalSkillId);
      expect(skills, example.japanese).not.toContain("narrate");
    }

    const coffeeAfter = definitionById("seasonal-coffee-day-after");
    const coffeeResponses = learnerResponseSteps(coffeeAfter);
    expect(coffeeResponses[1]?.prompt.textI18n?.en).toMatch(/ordering alike|same order/i);
    expect(coffeeResponses[1]?.prompt.textI18n?.ja).toMatch(/同じ飲み物|同じもの/);
    expect(coffeeResponses[1]?.prompt.textZh).toMatch(/相同飲品|相同|一樣/);

    const yearEndBefore = definitionById("seasonal-new-years-eve-before");
    const yearEndOptions = learnerResponseSteps(yearEndBefore).flatMap(({ responseExamples }) =>
      responseExamples.map(({ japanese }) => japanese)
    );
    expect(yearEndOptions.join(" ")).toMatch(/30分|短い時間/);
    expect(yearEndOptions.join(" ")).toMatch(/カフェ/);
    expect(yearEndBefore.scenario.objective.textI18n?.en).toMatch(/negotiate/i);
  });

  it("keeps all seasonal and evergreen IDs, response bindings, and graph references valid together", () => {
    const allDefinitions = [...conversationCatalogDefinitions, ...seasonalConversationDefinitions];
    const allIds = allDefinitions.flatMap(({ scenario, responses }) => [
      scenario.id,
      ...scenario.steps.flatMap((step) => [
        step.id,
        ...(step.kind === "learner_response"
          ? [...step.responseExamples.map(({ id }) => id), ...step.branches.map(({ id }) => id)]
          : [])
      ]),
      ...responses.map(({ feedback }) => feedback.id)
    ]);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(validateConversationSessionDefinitions(allDefinitions)).toEqual({ valid: true, errors: [] });

    for (const definition of seasonalConversationDefinitions) {
      const authoredSkills = new Set(definition.responses.flatMap(({ feedback }) =>
        feedback.feedback.composition.map(({ canonicalSkillId }) => canonicalSkillId)
      ));
      expect(definition.scenario.primarySkills.every((skill) => authoredSkills.has(skill)), definition.scenario.id)
        .toBe(true);
      for (const binding of definition.responses) {
        const session = createConversationSession([definition]);
        expect(session.select(definition.scenario.id)).toBe(true);
        expect(session.start()).toBe(true);
        let guard = 0;
        while (session.getState().phase !== "complete" && guard < 40) {
          guard += 1;
          const state = session.getState();
          if (state.step?.kind === "partner_line") {
            expect(session.advance()).toBe(true);
          } else if (state.step?.kind === "learner_response") {
            const choice = state.step.responseExamples.find(({ id }) =>
              state.step?.kind === "learner_response" && state.step.id === binding.stepId && id === binding.responseExampleId
            ) ?? state.step.responseExamples[0];
            expect(session.submitResponse(choice.id)).not.toBeNull();
            expect(session.continue()).toBe(true);
          } else {
            break;
          }
        }
        expect(session.getState().phase, `${definition.scenario.id} ${binding.responseExampleId}`)
          .toBe("complete");
      }
    }
  });

  it("provides complete launched-locale overlays and only established relationship roles", () => {
    const expectedRoles = new Set(["coworker", "classmate", "participant"]);
    const actualRoles = new Set(seasonalConversationDefinitions.flatMap(({ scenario }) => [
      scenario.relationship.learnerRole,
      scenario.relationship.partnerRole
    ]));
    expect(actualRoles).toEqual(expectedRoles);

    for (const text of allLearnerTexts(seasonalConversationDefinitions)) {
      expect(text.textZh.trim()).not.toBe("");
      expect(text.textI18n?.ja?.trim()).toBeTruthy();
      expect(text.textI18n?.en?.trim()).toBeTruthy();
      for (const locale of ["zh-Hant", "ja", "en"] as const) {
        expect(localizeConversationLearnerText(text, locale).trim()).not.toBe("");
      }
    }
    for (const family of seasonalConversationFamilies) {
      for (const text of [family.title, family.note]) {
        expect(text.textI18n?.ja?.trim()).toBeTruthy();
        expect(text.textI18n?.en?.trim()).toBeTruthy();
      }
    }
  });

  it("does not attach exact-day language to the broad before/after windows", () => {
    const exactTiming = /明日|昨日|今週末|来週|tomorrow|yesterday|this weekend|next week/i;
    for (const family of seasonalConversationFamilies) {
      const beforeAndAfter = [family.definitions[0], family.definitions[2]];
      for (const text of allLearnerTexts(beforeAndAfter)) {
        expect(text.textZh, family.event.id).not.toMatch(exactTiming);
        expect(text.textI18n?.ja, family.event.id).not.toMatch(exactTiming);
        expect(text.textI18n?.en, family.event.id).not.toMatch(exactTiming);
      }
      for (const definition of beforeAndAfter) {
        for (const step of definition.scenario.steps) {
          if (step.kind === "partner_line") expect(step.japanese).not.toMatch(exactTiming);
          if (step.kind === "learner_response") {
            for (const example of step.responseExamples) expect(example.japanese).not.toMatch(exactTiming);
          }
        }
      }
    }
  });

});
