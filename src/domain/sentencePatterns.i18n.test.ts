import { describe, expect, it } from "vitest";
import { buildSentencePatternPool } from "./sentencePatterns";
import { patternInstructionI18n } from "./sentencePatterns.i18n";

describe("sentence-pattern overlays", () => {
  it("threads the constant instruction overlay onto every question", () => {
    const pool = buildSentencePatternPool();
    expect(pool.length).toBeGreaterThan(0);
    for (const q of pool) {
      expect(q.instructionI18n).toBe(patternInstructionI18n);
      expect((q.instructionI18n?.en ?? "").length).toBeGreaterThan(0);
      expect((q.instructionI18n?.ja ?? "").length).toBeGreaterThan(0);
    }
  });

  // Coverage of NEW items is a warn-level concern for the check:i18n report
  // (#422), deliberately NOT a hard CI gate here -- content batches land
  // zh-first by design. This test only proves the THREADING works, using a
  // known item that has overlays.
  it("carries per-item hint / context / explanation overlays through to the question", () => {
    const q = buildSentencePatternPool().find((x) => x.id === "pattern-te-kudasai-001")!;
    expect(q).toBeDefined();
    for (const lang of ["en", "ja"] as const) {
      expect(q.hintI18n?.[lang]).toBeTruthy();
      expect(q.promptContextI18n?.[lang]).toBeTruthy();
      expect(q.explanationI18n?.[lang]).toBeTruthy();
    }
  });

  it("threads the context overlay onto the baked example meaning (post-answer line)", () => {
    const q = buildSentencePatternPool().find((x) => x.id === "pattern-te-kudasai-001")!;
    expect(q.vocabulary.examples[0]?.meaningI18n?.en).toBe(q.promptContextI18n?.en);
  });

  it("locks neutral pre-answer hints for every human-reviewed locale", () => {
    // Exact content lock: these hints were reviewed as situation-only context.
    // They must not drift without repeating the semantic review of the prompt.
    const reviews = [
      {
        id: "pattern-n5-sonzai-007",
        hintZh: "家人確認貓現在在哪裡。",
        hintEn: "A family member checks the cat's current location.",
        hintJa: "家族が猫の今いる場所を確認する。"
      },
      {
        id: "pattern-n5-riyuu-001",
        hintZh: "老師確認學生昨天缺席時的情況。",
        hintEn: "A teacher checks what happened when a student was absent yesterday.",
        hintJa: "先生が生徒の昨日の欠席について確認する。"
      },
      {
        id: "pattern-n5-riyuu-002",
        hintZh: "老師請學生把兩句日文合成一句。",
        hintEn: "A teacher asks a student to combine two Japanese sentences.",
        hintJa: "先生が生徒に、二つの日本語の文を一文にするよう言う。"
      },
      {
        id: "pattern-n5-riyuu-005",
        hintZh: "朋友確認昨天與今天是否外出。",
        hintEn: "A friend asks about going out yesterday and today.",
        hintJa: "友だちが昨日と今日の外出について聞く。"
      },
      {
        id: "pattern-n5-riyuu-008",
        hintZh: "兩位同學聊學日語的事。",
        hintEn: "Two classmates talk about studying Japanese.",
        hintJa: "クラスメート同士が日本語の勉強について話す。"
      }
    ];

    const pool = buildSentencePatternPool();
    const actual = reviews.map(({ id }) => {
      const q = pool.find((candidate) => candidate.id === id);
      return {
        id,
        hintZh: q?.hintZh,
        hintEn: q?.hintI18n?.en,
        hintJa: q?.hintI18n?.ja
      };
    });

    expect(actual).toEqual(reviews);
  });

  it("locks the complete localized noun + ので attachment review", () => {
    // This exact lock records the human substitution review. The visible
    // Japanese instruction makes the two grammatical から replies out of
    // contract, while the shared continuation leaves the noun attachment as
    // the deciding difference between なので and the learner error ので.
    const q = buildSentencePatternPool().find(
      (candidate) => candidate.id === "pattern-n5-riyuu-002"
    );

    expect({
      promptText: q?.promptText,
      hintZh: q?.hintZh,
      promptContextZh: q?.promptContextZh,
      explanationZh: q?.explanation,
      expectedAnswer: q?.expectedAnswers[0],
      options: q?.options,
      hintEn: q?.hintI18n?.en,
      hintJa: q?.hintI18n?.ja,
      promptContextEn: q?.promptContextI18n?.en,
      promptContextJa: q?.promptContextI18n?.ja,
      explanationEn: q?.explanationI18n?.en,
      explanationJa: q?.explanationI18n?.ja
    }).toEqual({
      promptText:
        "「あしたは やすみです。いえに います。『ので』を つかって、ひとつの ぶんに してください。」「___。」",
      hintZh: "老師請學生把兩句日文合成一句。",
      promptContextZh:
        "「明天放假。我會待在家。請使用『ので』合成一句話。」「因為放假，所以我會待在家。」",
      explanationZh:
        "題目用日文指定要用「ので」合併兩句；名詞「やすみ」接「ので」時必須加「な」，所以是「やすみなので、いえに います」。「やすみので」少了「な」，是常見的接續錯誤；「やすみだから」和較禮貌的「やすみですから」都是成立的理由說法，但都改用了「から」，不符合題目的「ので」指示。四個選項的時間、狀態與後句都相同，不能靠肯否或時間排除，必須判斷名詞接「ので」的形式。",
      expectedAnswer: "やすみなので、いえに います",
      options: [
        "やすみなので、いえに います",
        "やすみので、いえに います",
        "やすみだから、いえに います",
        "やすみですから、いえに います"
      ],
      hintEn: "A teacher asks a student to combine two Japanese sentences.",
      hintJa: "先生が生徒に、二つの日本語の文を一文にするよう言う。",
      promptContextEn:
        '"Tomorrow is a day off. I will stay home. Use 「ので」 to make one sentence." "Since it is a day off, I will stay home."',
      promptContextJa:
        "「あしたは休みです。家にいます。『ので』を使って、一つの文にしてください。」「休みなので、家にいます。」",
      explanationEn:
        "The Japanese prompt explicitly says to combine the two statements with 「ので」. A noun such as 「やすみ」 must take 「な」 before 「ので」, so the answer is 「やすみなので、いえに います」. 「やすみので」 omits the required 「な」, a common attachment error. 「やすみだから」 and the more polite 「やすみですから」 are both grammatical ways to give the same reason, but they use 「から」 and therefore do not follow the visible 「ので」 instruction. Every option keeps the same time, state, and final clause; polarity or time cannot select the answer.",
      explanationJa:
        "問題文は、二つの文を「ので」でつなぐよう日本語で明示している。名詞「やすみ」に「ので」を付けるときは「な」が必要なので、正解は「やすみなので、いえに います」。「やすみので」は必要な「な」が抜けた、よくある接続の誤り。「やすみだから」と、より丁寧な「やすみですから」はどちらも同じ理由を表す文として成立するが、「から」を使っているため、問題文の「ので」という指示に合わない。四つの選択肢は時間・状態・後件がすべて同じで、肯否や時間だけでは選べない。"
    });
  });
});
