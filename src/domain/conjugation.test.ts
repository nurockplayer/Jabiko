import { describe, expect, it } from "vitest";
import {
  ADJECTIVE_FORMS,
  conjugate,
  getRuleExplanation,
  normalizeAnswer,
  TARGET_FORM_LABELS,
  TARGET_FORM_LABELS_I18N,
  validateAnswer,
  VERB_FORMS
} from "./conjugation";
import type { TargetForm, VocabularyItem } from "./types";

const word = (
  overrides: Partial<VocabularyItem> & Pick<VocabularyItem, "surface" | "reading" | "meaningZh" | "partOfSpeech">
): VocabularyItem => ({
  id: overrides.surface,
  group: null,
  examples: [],
  tags: [],
  lesson: null,
  ...overrides
});

describe("conjugate", () => {
  it("conjugates every godan te and ta sound-change ending", () => {
    const cases = [
      ["買う", "かう", "買", "買って", "買った"],
      ["待つ", "まつ", "等", "待って", "待った"],
      ["帰る", "かえる", "回去", "帰って", "帰った"],
      ["飲む", "のむ", "喝", "飲んで", "飲んだ"],
      ["遊ぶ", "あそぶ", "玩", "遊んで", "遊んだ"],
      ["死ぬ", "しぬ", "死", "死んで", "死んだ"],
      ["書く", "かく", "寫", "書いて", "書いた"],
      ["泳ぐ", "およぐ", "游泳", "泳いで", "泳いだ"],
      ["話す", "はなす", "說", "話して", "話した"],
      ["行く", "いく", "去", "行って", "行った"]
    ] as const;

    for (const [surface, reading, meaningZh, te, ta] of cases) {
      const item = word({ surface, reading, meaningZh, partOfSpeech: "verb", group: "godan" });

      expect(conjugate(item, "te")).toEqual(expect.objectContaining({ answers: [te] }));
      expect(conjugate(item, "ta")).toEqual(expect.objectContaining({ answers: [ta] }));
      expect(conjugate(item, "plainPastAffirmative")).toEqual(expect.objectContaining({ answers: [ta] }));
    }
  });

  it("conjugates godan verbs across te, ta, nai, masu, and plain forms", () => {
    const kaku = word({ surface: "書く", reading: "かく", meaningZh: "寫", partOfSpeech: "verb", group: "godan" });
    const iku = word({ surface: "行く", reading: "いく", meaningZh: "去", partOfSpeech: "verb", group: "godan" });
    const nomu = word({ surface: "飲む", reading: "のむ", meaningZh: "喝", partOfSpeech: "verb", group: "godan" });
    const hanasu = word({ surface: "話す", reading: "はなす", meaningZh: "說", partOfSpeech: "verb", group: "godan" });
    const kau = word({ surface: "買う", reading: "かう", meaningZh: "買", partOfSpeech: "verb", group: "godan" });

    expect(conjugate(kaku, "te")).toEqual(expect.objectContaining({ answers: ["書いて"] }));
    expect(conjugate(kaku, "ta")).toEqual(expect.objectContaining({ answers: ["書いた"] }));
    expect(conjugate(kaku, "nai")).toEqual(expect.objectContaining({ answers: ["書かない"] }));
    expect(conjugate(kaku, "masu")).toEqual(expect.objectContaining({ answers: ["書きます"] }));
    expect(conjugate(kaku, "plainPastNegative")).toEqual(expect.objectContaining({ answers: ["書かなかった"] }));
    expect(conjugate(kaku, "negativeTe")).toEqual(expect.objectContaining({ answers: ["書かないで"] }));
    expect(conjugate(kaku, "negativeContinuative")).toEqual(expect.objectContaining({ answers: ["書かなくて"] }));
    expect(conjugate(kaku, "obligationPast")).toEqual(expect.objectContaining({ answers: ["書かなければならなかった"] }));

    expect(conjugate(iku, "te")).toEqual(expect.objectContaining({ answers: ["行って"] }));
    expect(conjugate(iku, "ta")).toEqual(expect.objectContaining({ answers: ["行った"] }));
    expect(conjugate(nomu, "te")).toEqual(expect.objectContaining({ answers: ["飲んで"] }));
    expect(conjugate(nomu, "ta")).toEqual(expect.objectContaining({ answers: ["飲んだ"] }));
    expect(conjugate(hanasu, "te")).toEqual(expect.objectContaining({ answers: ["話して"] }));
    expect(conjugate(hanasu, "ta")).toEqual(expect.objectContaining({ answers: ["話した"] }));
    expect(conjugate(kau, "te")).toEqual(expect.objectContaining({ answers: ["買って"] }));
    expect(conjugate(kau, "ta")).toEqual(expect.objectContaining({ answers: ["買った"] }));
    expect(conjugate(kau, "nai")).toEqual(expect.objectContaining({ answers: ["買わない"] }));
  });

  it("conjugates ichidan verbs", () => {
    const taberu = word({
      surface: "食べる",
      reading: "たべる",
      meaningZh: "吃",
      partOfSpeech: "verb",
      group: "ichidan"
    });

    expect(conjugate(taberu, "dictionary")).toEqual(expect.objectContaining({ answers: ["食べる"] }));
    expect(conjugate(taberu, "te")).toEqual(expect.objectContaining({ answers: ["食べて"] }));
    expect(conjugate(taberu, "ta")).toEqual(expect.objectContaining({ answers: ["食べた"] }));
    expect(conjugate(taberu, "nai")).toEqual(expect.objectContaining({ answers: ["食べない"] }));
    expect(conjugate(taberu, "masu")).toEqual(expect.objectContaining({ answers: ["食べます"] }));
    expect(conjugate(taberu, "negativeTe")).toEqual(expect.objectContaining({ answers: ["食べないで"] }));
    expect(conjugate(taberu, "negativeContinuative")).toEqual(expect.objectContaining({ answers: ["食べなくて"] }));
    expect(conjugate(taberu, "obligationPast")).toEqual(expect.objectContaining({ answers: ["食べなければならなかった"] }));
    expect(conjugate(taberu, "potential")).toEqual(expect.objectContaining({ answers: ["食べられる"] }));
    expect(conjugate(taberu, "volitional")).toEqual(expect.objectContaining({ answers: ["食べよう"] }));
  });

  it("conjugates causative and passive forms across verb groups", () => {
    const kaku = word({ surface: "書く", reading: "かく", meaningZh: "寫", partOfSpeech: "verb", group: "godan" });
    const kau = word({ surface: "買う", reading: "かう", meaningZh: "買", partOfSpeech: "verb", group: "godan" });
    const taberu = word({
      surface: "食べる",
      reading: "たべる",
      meaningZh: "吃",
      partOfSpeech: "verb",
      group: "ichidan"
    });
    const suru = word({ surface: "する", reading: "する", meaningZh: "做", partOfSpeech: "verb", group: "irregular" });
    const kuru = word({ surface: "来る", reading: "くる", meaningZh: "來", partOfSpeech: "verb", group: "irregular" });

    expect(conjugate(kaku, "causative")).toEqual(expect.objectContaining({ answers: ["書かせる"] }));
    expect(conjugate(kaku, "passive")).toEqual(expect.objectContaining({ answers: ["書かれる"] }));
    expect(conjugate(kau, "causative")).toEqual(expect.objectContaining({ answers: ["買わせる"] }));
    expect(conjugate(kau, "passive")).toEqual(expect.objectContaining({ answers: ["買われる"] }));
    expect(conjugate(taberu, "causative")).toEqual(expect.objectContaining({ answers: ["食べさせる"] }));
    expect(conjugate(taberu, "passive")).toEqual(expect.objectContaining({ answers: ["食べられる"] }));
    expect(conjugate(suru, "causative")).toEqual(expect.objectContaining({ answers: ["させる"] }));
    expect(conjugate(suru, "passive")).toEqual(expect.objectContaining({ answers: ["される"] }));
    expect(conjugate(kuru, "causative")).toEqual(expect.objectContaining({ answers: ["来させる"] }));
    expect(conjugate(kuru, "passive")).toEqual(expect.objectContaining({ answers: ["来られる"] }));
  });

  it("conjugates potential and volitional forms across verb groups", () => {
    const kaku = word({ surface: "書く", reading: "かく", meaningZh: "寫", partOfSpeech: "verb", group: "godan" });
    const kaeru = word({ surface: "帰る", reading: "かえる", meaningZh: "回去", partOfSpeech: "verb", group: "godan" });
    const matsu = word({ surface: "待つ", reading: "まつ", meaningZh: "等", partOfSpeech: "verb", group: "godan" });
    const kau = word({ surface: "買う", reading: "かう", meaningZh: "買", partOfSpeech: "verb", group: "godan" });

    expect(conjugate(kaku, "potential")).toEqual(expect.objectContaining({ answers: ["書ける"] }));
    expect(conjugate(kaeru, "potential")).toEqual(expect.objectContaining({ answers: ["帰れる"] }));
    expect(conjugate(matsu, "potential")).toEqual(expect.objectContaining({ answers: ["待てる"] }));
    expect(conjugate(kau, "potential")).toEqual(expect.objectContaining({ answers: ["買える"] }));

    expect(conjugate(kaku, "volitional")).toEqual(expect.objectContaining({ answers: ["書こう"] }));
    expect(conjugate(kaeru, "volitional")).toEqual(expect.objectContaining({ answers: ["帰ろう"] }));
    expect(conjugate(matsu, "volitional")).toEqual(expect.objectContaining({ answers: ["待とう"] }));
    expect(conjugate(kau, "volitional")).toEqual(expect.objectContaining({ answers: ["買おう"] }));
  });

  it("conjugates irregular verbs", () => {
    const suru = word({ surface: "する", reading: "する", meaningZh: "做", partOfSpeech: "verb", group: "irregular" });
    const kuru = word({ surface: "来る", reading: "くる", meaningZh: "來", partOfSpeech: "verb", group: "irregular" });
    const benkyo = word({
      surface: "勉強する",
      reading: "べんきょうする",
      meaningZh: "讀書",
      partOfSpeech: "verb",
      group: "irregular"
    });

    expect(conjugate(suru, "te")).toEqual(expect.objectContaining({ answers: ["して"] }));
    expect(conjugate(suru, "ta")).toEqual(expect.objectContaining({ answers: ["した"] }));
    expect(conjugate(suru, "nai")).toEqual(expect.objectContaining({ answers: ["しない"] }));
    expect(conjugate(suru, "masu")).toEqual(expect.objectContaining({ answers: ["します"] }));
    expect(conjugate(suru, "negativeTe")).toEqual(expect.objectContaining({ answers: ["しないで"] }));
    expect(conjugate(suru, "negativeContinuative")).toEqual(expect.objectContaining({ answers: ["しなくて"] }));
    expect(conjugate(suru, "obligationPast")).toEqual(expect.objectContaining({ answers: ["しなければならなかった"] }));

    expect(conjugate(kuru, "te")).toEqual(expect.objectContaining({ answers: ["来て"] }));
    expect(conjugate(kuru, "ta")).toEqual(expect.objectContaining({ answers: ["来た"] }));
    expect(conjugate(kuru, "nai")).toEqual(expect.objectContaining({ answers: ["来ない"] }));
    expect(conjugate(kuru, "masu")).toEqual(expect.objectContaining({ answers: ["来ます"] }));
    expect(conjugate(kuru, "negativeTe")).toEqual(expect.objectContaining({ answers: ["来ないで"] }));
    expect(conjugate(kuru, "negativeContinuative")).toEqual(expect.objectContaining({ answers: ["来なくて"] }));

    expect(conjugate(benkyo, "te")).toEqual(expect.objectContaining({ answers: ["勉強して"] }));
    expect(conjugate(benkyo, "ta")).toEqual(expect.objectContaining({ answers: ["勉強した"] }));
    expect(conjugate(benkyo, "nai")).toEqual(expect.objectContaining({ answers: ["勉強しない"] }));
    expect(conjugate(benkyo, "negativeTe")).toEqual(expect.objectContaining({ answers: ["勉強しないで"] }));

    expect(conjugate(suru, "potential")).toEqual(expect.objectContaining({ answers: ["できる"] }));
    expect(conjugate(suru, "volitional")).toEqual(expect.objectContaining({ answers: ["しよう"] }));
    expect(conjugate(kuru, "potential")).toEqual(expect.objectContaining({ answers: ["来られる"] }));
    expect(conjugate(kuru, "volitional")).toEqual(expect.objectContaining({ answers: ["来よう"] }));
    expect(conjugate(benkyo, "potential")).toEqual(expect.objectContaining({ answers: ["勉強できる"] }));
    expect(conjugate(benkyo, "volitional")).toEqual(expect.objectContaining({ answers: ["勉強しよう"] }));
  });

  it("conjugates i-adjectives, na-adjectives, and noun-like words", () => {
    const takai = word({ surface: "高い", reading: "たかい", meaningZh: "高", partOfSpeech: "i_adjective" });
    const shizuka = word({ surface: "静か", reading: "しずか", meaningZh: "安靜", partOfSpeech: "na_adjective" });
    const gakusei = word({ surface: "学生", reading: "がくせい", meaningZh: "學生", partOfSpeech: "noun" });

    expect(conjugate(takai, "plainPresentAffirmative")).toEqual(expect.objectContaining({ answers: ["高い"] }));
    expect(conjugate(takai, "plainPresentNegative")).toEqual(expect.objectContaining({ answers: ["高くない"] }));
    expect(conjugate(takai, "plainPastAffirmative")).toEqual(expect.objectContaining({ answers: ["高かった"] }));
    expect(conjugate(takai, "plainPastNegative")).toEqual(expect.objectContaining({ answers: ["高くなかった"] }));
    expect(conjugate(takai, "negativeContinuative")).toEqual(expect.objectContaining({ answers: ["高くなくて"] }));
    expect(conjugate(takai, "adverbial")).toEqual(expect.objectContaining({ answers: ["高く"] }));
    expect(conjugate(takai, "obligationPast")).toEqual(expect.objectContaining({ answers: ["高くならなければならなかった"] }));

    expect(conjugate(shizuka, "plainPresentAffirmative")).toEqual(expect.objectContaining({ answers: ["静かだ"] }));
    expect(conjugate(shizuka, "plainPresentNegative")).toEqual(expect.objectContaining({ answers: ["静かではない", "静かじゃない"] }));
    expect(conjugate(shizuka, "plainPastAffirmative")).toEqual(expect.objectContaining({ answers: ["静かだった"] }));
    expect(conjugate(shizuka, "plainPastNegative")).toEqual(expect.objectContaining({ answers: ["静かではなかった", "静かじゃなかった"] }));
    expect(conjugate(shizuka, "negativeContinuative")).toEqual(expect.objectContaining({ answers: ["静かではなくて", "静かじゃなくて"] }));
    expect(conjugate(shizuka, "adverbial")).toEqual(expect.objectContaining({ answers: ["静かに"] }));
    expect(conjugate(shizuka, "obligationPast")).toEqual(
      expect.objectContaining({ answers: ["静かにならなければならなかった"] })
    );

    expect(conjugate(gakusei, "plainPresentAffirmative")).toEqual(expect.objectContaining({ answers: ["学生だ"] }));
    expect(conjugate(gakusei, "plainPresentNegative")).toEqual(expect.objectContaining({ answers: ["学生ではない", "学生じゃない"] }));
    expect(conjugate(gakusei, "plainPastAffirmative")).toEqual(expect.objectContaining({ answers: ["学生だった"] }));
    expect(conjugate(gakusei, "plainPastNegative")).toEqual(expect.objectContaining({ answers: ["学生ではなかった", "学生じゃなかった"] }));
    expect(conjugate(gakusei, "adverbial")).toEqual(expect.objectContaining({ answers: ["学生に"] }));
    expect(conjugate(gakusei, "obligationPast")).toEqual(
      expect.objectContaining({ answers: ["学生にならなければならなかった"] })
    );
  });
});

describe("answer validation", () => {
  it("normalizes surrounding spaces, full-width spaces, and a final Japanese period", () => {
    expect(normalizeAnswer("　書いて。 ")).toBe("書いて");
  });

  it("accepts listed answers and rejects wrong kana", () => {
    expect(validateAnswer(" 静かじゃない。", ["静かではない", "静かじゃない"])).toBe(true);
    expect(validateAnswer("書て", ["書いて"])).toBe(false);
  });
});

describe("rule explanations", () => {
  it("returns learner-friendly Traditional Chinese explanations", () => {
    const kaku = word({ surface: "書く", reading: "かく", meaningZh: "寫", partOfSpeech: "verb", group: "godan" });

    expect(getRuleExplanation(kaku, "te")).toContain("一類動詞");
    expect(getRuleExplanation(kaku, "negativeTe")).toContain("ないで");
    expect(getRuleExplanation(kaku, "negativeContinuative")).toContain("なくて");
  });

  it("explains godan plain affirmative past as the ta-form sound-change family", () => {
    const kaku = word({ surface: "書く", reading: "かく", meaningZh: "寫", partOfSpeech: "verb", group: "godan" });

    expect(getRuleExplanation(kaku, "plainPastAffirmative")).toContain("た形");
    expect(getRuleExplanation(kaku, "plainPastAffirmative")).toContain("音便");
    expect(getRuleExplanation(kaku, "plainPastAffirmative")).not.toContain("ます形");
  });
});

describe("explanation localization (#427)", () => {
  it("localizes reading explanations, preferring meaningI18n and falling back to meaningZh", () => {
    const suitou = word({
      surface: "出納",
      reading: "すいとう",
      meaningZh: "出納",
      partOfSpeech: "noun",
      meaningI18n: { en: "cash receipts and payments", ja: "金銭の出し入れ" }
    });

    const result = conjugate(suitou, "reading");
    expect(result.explanation).toBe("「出納」的念法是「すいとう」。意思：出納。");
    expect(result.explanationI18n?.en).toBe("「出納」 is read 「すいとう」. Meaning: cash receipts and payments.");
    expect(result.explanationI18n?.ja).toBe("「出納」の読み方は「すいとう」です。意味：金銭の出し入れ。");

    const bare = word({ surface: "出納", reading: "すいとう", meaningZh: "出納", partOfSpeech: "noun" });
    expect(conjugate(bare, "reading").explanationI18n?.en).toBe("「出納」 is read 「すいとう」. Meaning: 出納.");
  });

  it("localizes meaning explanations", () => {
    const kaku = word({
      surface: "書く",
      reading: "かく",
      meaningZh: "寫",
      partOfSpeech: "verb",
      group: "godan",
      meaningI18n: { en: "to write", ja: "書く" }
    });

    const result = conjugate(kaku, "meaning");
    expect(result.explanation).toBe("「書く」（かく）的意思是「寫」。");
    expect(result.explanationI18n?.en).toBe('「書く」 (かく) means "to write".');
    expect(result.explanationI18n?.ja).toBe("「書く」（かく）の意味は「書く」です。");
  });

  it("provides non-empty en/ja rule explanations for every generatable form", () => {
    const samples = [
      word({ surface: "書く", reading: "かく", meaningZh: "寫", partOfSpeech: "verb", group: "godan" }),
      word({ surface: "食べる", reading: "たべる", meaningZh: "吃", partOfSpeech: "verb", group: "ichidan" }),
      word({ surface: "する", reading: "する", meaningZh: "做", partOfSpeech: "verb", group: "irregular" }),
      word({ surface: "高い", reading: "たかい", meaningZh: "高", partOfSpeech: "i_adjective" }),
      word({ surface: "静か", reading: "しずか", meaningZh: "安靜", partOfSpeech: "na_adjective" }),
      word({ surface: "学生", reading: "がくせい", meaningZh: "學生", partOfSpeech: "noun" })
    ];

    for (const item of samples) {
      const forms = item.partOfSpeech === "verb" ? VERB_FORMS : ADJECTIVE_FORMS;
      for (const form of forms) {
        const result = conjugate(item, form);
        expect(result.explanationI18n?.en, `${item.surface}:${form}:en`).toBeTruthy();
        expect(result.explanationI18n?.ja, `${item.surface}:${form}:ja`).toBeTruthy();
        expect(result.explanationI18n?.en, `${item.surface}:${form}:en differs from zh`).not.toBe(result.explanation);
      }
    }
  });

  it("localizes the interpolated target-form label in the ichidan generic rule", () => {
    const taberu = word({ surface: "食べる", reading: "たべる", meaningZh: "吃", partOfSpeech: "verb", group: "ichidan" });

    const result = conjugate(taberu, "potential");
    expect(result.explanation).toContain("可能形");
    expect(result.explanationI18n?.en).toContain("potential form");
    expect(result.explanationI18n?.ja).toContain("可能形");
  });

  it("exposes en/ja labels for every target form", () => {
    for (const form of Object.keys(TARGET_FORM_LABELS) as TargetForm[]) {
      expect(TARGET_FORM_LABELS_I18N[form]?.en, form).toBeTruthy();
      expect(TARGET_FORM_LABELS_I18N[form]?.ja, form).toBeTruthy();
    }
  });
});

describe("conditional ば form", () => {
  it("conjugates the conditional across every godan ending", () => {
    const cases = [
      ["書く", "かく", "寫", "書けば"],
      ["泳ぐ", "およぐ", "游泳", "泳げば"],
      ["話す", "はなす", "說", "話せば"],
      ["待つ", "まつ", "等", "待てば"],
      ["死ぬ", "しぬ", "死", "死ねば"],
      ["遊ぶ", "あそぶ", "玩", "遊べば"],
      ["飲む", "のむ", "喝", "飲めば"],
      ["帰る", "かえる", "回去", "帰れば"],
      ["買う", "かう", "買", "買えば"]
    ] as const;

    for (const [surface, reading, meaningZh, conditional] of cases) {
      const item = word({ surface, reading, meaningZh, partOfSpeech: "verb", group: "godan" });
      expect(conjugate(item, "conditional")).toEqual(expect.objectContaining({ answers: [conditional] }));
    }
  });

  it("conjugates ichidan and irregular conditionals", () => {
    const taberu = word({ surface: "食べる", reading: "たべる", meaningZh: "吃", partOfSpeech: "verb", group: "ichidan" });
    const miru = word({ surface: "見る", reading: "みる", meaningZh: "看", partOfSpeech: "verb", group: "ichidan" });
    const suru = word({ surface: "する", reading: "する", meaningZh: "做", partOfSpeech: "verb", group: "irregular" });
    const kuru = word({ surface: "来る", reading: "くる", meaningZh: "來", partOfSpeech: "verb", group: "irregular" });
    const benkyou = word({ surface: "勉強する", reading: "べんきょうする", meaningZh: "學習", partOfSpeech: "verb", group: "irregular" });

    expect(conjugate(taberu, "conditional")).toEqual(expect.objectContaining({ answers: ["食べれば"] }));
    expect(conjugate(miru, "conditional")).toEqual(expect.objectContaining({ answers: ["見れば"] }));
    expect(conjugate(suru, "conditional")).toEqual(expect.objectContaining({ answers: ["すれば"] }));
    expect(conjugate(kuru, "conditional")).toEqual(expect.objectContaining({ answers: ["来れば"] }));
    expect(conjugate(benkyou, "conditional")).toEqual(expect.objectContaining({ answers: ["勉強すれば"] }));
  });

  it("uses ければ for i-adjectives and なら for na-adjectives and nouns", () => {
    const takai = word({ surface: "高い", reading: "たかい", meaningZh: "貴", partOfSpeech: "i_adjective" });
    const shizuka = word({ surface: "静か", reading: "しずか", meaningZh: "安靜", partOfSpeech: "na_adjective" });
    const gakusei = word({ surface: "学生", reading: "がくせい", meaningZh: "學生", partOfSpeech: "noun" });

    expect(conjugate(takai, "conditional")).toEqual(expect.objectContaining({ answers: ["高ければ"] }));
    // The classic mistake this feature guards against: な形容詞/名詞 never take
    // なければ directly -- their affirmative conditional is なら. (Their
    // negative conditional goes ではない -> でなければ, taught in the prose.)
    expect(conjugate(shizuka, "conditional")).toEqual(expect.objectContaining({ answers: ["静かなら"] }));
    expect(conjugate(gakusei, "conditional")).toEqual(expect.objectContaining({ answers: ["学生なら"] }));
  });

  it("conjugates いい-type adjectives on the よ stem (よければ, never いければ)", () => {
    const ii = word({ surface: "いい", reading: "いい", meaningZh: "好", partOfSpeech: "i_adjective" });
    const kakkoii = word({ surface: "かっこいい", reading: "かっこいい", meaningZh: "帥", partOfSpeech: "i_adjective" });
    const yoi = word({ surface: "よい", reading: "よい", meaningZh: "好", partOfSpeech: "i_adjective" });

    expect(conjugate(ii, "conditional")).toEqual(expect.objectContaining({ answers: ["よければ"] }));
    expect(conjugate(kakkoii, "conditional")).toEqual(expect.objectContaining({ answers: ["かっこよければ"] }));
    expect(conjugate(yoi, "conditional")).toEqual(expect.objectContaining({ answers: ["よければ"] }));
  });

  it("does NOT treat every いい-sounding ending as 良い: かわいい stays かわいければ", () => {
    const kawaii = word({ surface: "かわいい", reading: "かわいい", meaningZh: "可愛", partOfSpeech: "i_adjective" });
    const osoi = word({ surface: "遅い", reading: "おそい", meaningZh: "慢", partOfSpeech: "i_adjective" });
    // Kanji 良い needs NO whitelist: the regular stem 良 already gives 良ければ.
    const kanjiYoi = word({ surface: "良い", reading: "よい", meaningZh: "好", partOfSpeech: "i_adjective" });

    expect(conjugate(kawaii, "conditional")).toEqual(expect.objectContaining({ answers: ["かわいければ"] }));
    expect(conjugate(osoi, "conditional")).toEqual(expect.objectContaining({ answers: ["遅ければ"] }));
    expect(conjugate(kanjiYoi, "conditional")).toEqual(expect.objectContaining({ answers: ["良ければ"] }));
  });

  it("is drillable: conditional sits in the verb and adjective form lists", () => {
    expect(VERB_FORMS).toContain("conditional");
    expect(ADJECTIVE_FORMS).toContain("conditional");
    expect(TARGET_FORM_LABELS.conditional).toContain("ば");
  });
});
