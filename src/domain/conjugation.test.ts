import { describe, expect, it } from "vitest";
import {
  conjugate,
  getRuleExplanation,
  normalizeAnswer,
  validateAnswer
} from "./conjugation";
import type { VocabularyItem } from "./types";

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
    expect(conjugate(benkyo, "nai")).toEqual(expect.objectContaining({ answers: ["勉強しない"] }));
    expect(conjugate(benkyo, "negativeTe")).toEqual(expect.objectContaining({ answers: ["勉強しないで"] }));
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
});
