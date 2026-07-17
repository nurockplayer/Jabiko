import { describe, it, expect } from "vitest";
import {
  kataToHira,
  hasKanji,
  alignToken,
  tokensToSegments,
  applyReadingOverrides,
  isReadingPrompt,
  allowsOptionFurigana,
  splitTextForRuby,
  collectJapaneseRubySources,
  splitQuotedTextForRuby,
  collectQuotedRubySources
} from "./furigana";

describe("isReadingPrompt", () => {
  it("flags the 漢字読み prompt label (a reading question)", () => {
    expect(isReadingPrompt("漢字読み", "ta")).toBe(true);
  });

  it("flags a reading target form (basic/vocab reading drills)", () => {
    expect(isReadingPrompt(undefined, "reading")).toBe(true);
  });

  it("is false for grammar and other item types", () => {
    expect(isReadingPrompt("文法形式選擇", "ta")).toBe(false);
    expect(isReadingPrompt(undefined, "meaning")).toBe(false);
    expect(isReadingPrompt(null, null)).toBe(false);
  });

  it("does NOT suppress a labelled stem even when targetForm defaults to 'reading' (#134 P4)", () => {
    // Every exam item defaults targetForm to "reading", so gating on it would
    // wrongly hide furigana from grammar / vocab stems -- which is exactly
    // where we want it on hard questions.
    expect(isReadingPrompt("文法形式選擇", "reading")).toBe(false);
    expect(isReadingPrompt("詞彙填空", "reading")).toBe(false);
  });

  it("still suppresses 漢字読み regardless of targetForm (answer-leak guard)", () => {
    expect(isReadingPrompt("漢字読み", "reading")).toBe(true);
    expect(isReadingPrompt("漢字読み", "ta")).toBe(true);
  });
});

describe("allowsOptionFurigana (#589)", () => {
  it("blocks 表記 options (distractors are real words with DIFFERENT readings; ruby exposes them)", () => {
    expect(allowsOptionFurigana("表記")).toBe(false);
  });

  it("blocks 語形成 options (a natural reading over an affix candidate hints the real compound)", () => {
    expect(allowsOptionFurigana("語形成")).toBe(false);
  });

  it("allows grammar / vocab / context items (their answers are never about how an option reads)", () => {
    expect(allowsOptionFurigana("文法形式選擇")).toBe(true);
    expect(allowsOptionFurigana("詞彙用法")).toBe(true);
    expect(allowsOptionFurigana("文章脈絡")).toBe(true);
    expect(allowsOptionFurigana("語順組合")).toBe(true);
  });

  it("allows unlabelled basic drills (options are kana forms with no baked entries anyway)", () => {
    expect(allowsOptionFurigana(undefined)).toBe(true);
    expect(allowsOptionFurigana(null)).toBe(true);
  });
});

describe("splitTextForRuby", () => {
  it("marks kana-containing runs outside quotes but leaves zh prose plain", () => {
    expect(splitTextForRuby("這裡用 Vてください 表示請求。")).toEqual([
      { text: "這裡用 ", ruby: false },
      { text: "Vてください", ruby: true },
      { text: " 表示請求。", ruby: false }
    ]);
  });

  it("allows kanji-only tokens inside Japanese quotes", () => {
    expect(splitTextForRuby("正解「学校」在這裡。")).toEqual([
      { text: "正解「", ruby: false },
      { text: "学校", ruby: true },
      { text: "」在這裡。", ruby: false }
    ]);
  });

  it("keeps a Japanese term separate from its Chinese gloss after a full-width slash", () => {
    expect(splitTextForRuby("干擾「あかるい（明るい／明亮）」")).toEqual([
      { text: "干擾「", ruby: false },
      { text: "あかるい", ruby: true },
      { text: "（", ruby: false },
      { text: "明るい", ruby: true },
      { text: "／明亮）」", ruby: false }
    ]);
  });
});

describe("collectJapaneseRubySources", () => {
  it("collects only safe kana-containing runs from mixed explanation text", () => {
    expect(
      collectJapaneseRubySources("正解「学校」：文法「Vてください」と「食べる」を一起記。中文「有生命」不要烤。")
    ).toEqual(["Vてください", "食べる"]);
  });

  it("collects the Japanese term without its Chinese gloss after a full-width slash", () => {
    expect(collectJapaneseRubySources("干擾「あかるい（明るい／明亮）」")).toEqual([
      "あかるい",
      "明るい"
    ]);
  });

  it("ignores a missing explanation source", () => {
    expect(collectJapaneseRubySources(undefined)).toEqual([]);
  });
});

describe("splitQuotedTextForRuby", () => {
  it("only marks matched Japanese quotes in Traditional Chinese teaching prose", () => {
    expect(
      splitQuotedTextForRuby("過去要放在最後的ならなかった；「来る」變成「来ます」。")
    ).toEqual([
      { text: "過去要放在最後的ならなかった；「", ruby: false },
      { text: "来る", ruby: true },
      { text: "」變成「", ruby: false },
      { text: "来ます", ruby: true },
      { text: "」。", ruby: false }
    ]);
  });

  it("keeps unmatched quotes plain", () => {
    expect(splitQuotedTextForRuby("中文「来る 沒有結尾")).toEqual([
      { text: "中文「来る 沒有結尾", ruby: false }
    ]);
  });
});

describe("collectQuotedRubySources", () => {
  it("collects only kana-and-kanji quoted Japanese sources", () => {
    expect(collectQuotedRubySources("中文「来る」和「ます」；外面ならない不處理")).toEqual([
      "来る"
    ]);
  });
});

describe("kataToHira", () => {
  it("converts katakana to hiragana", () => {
    expect(kataToHira("タベル")).toBe("たべる");
    expect(kataToHira("トショカン")).toBe("としょかん");
  });
  it("leaves hiragana and the long-vowel mark untouched", () => {
    expect(kataToHira("たべる")).toBe("たべる");
    expect(kataToHira("コーヒー")).toBe("こーひー");
  });
});

describe("hasKanji", () => {
  it("detects CJK ideographs and the 々 iteration mark", () => {
    expect(hasKanji("食べる")).toBe(true);
    expect(hasKanji("時々")).toBe(true);
  });
  it("is false for pure kana / punctuation / latin", () => {
    expect(hasKanji("ごはん")).toBe(false);
    expect(hasKanji("。")).toBe(false);
    expect(hasKanji("ABC")).toBe(false);
  });
});

describe("alignToken", () => {
  it("returns a single plain segment when there is no kanji", () => {
    expect(alignToken("ごはん", "ごはん")).toEqual([{ t: "ごはん" }]);
  });
  it("puts furigana over the whole run for an all-kanji word", () => {
    expect(alignToken("図書館", "としょかん")).toEqual([{ t: "図書館", r: "としょかん" }]);
  });
  it("splits trailing okurigana off the kanji", () => {
    expect(alignToken("食べる", "たべる")).toEqual([{ t: "食", r: "た" }, { t: "べる" }]);
    expect(alignToken("新しい", "あたらしい")).toEqual([{ t: "新", r: "あたら" }, { t: "しい" }]);
  });
  it("handles okurigana between two kanji runs", () => {
    expect(alignToken("取り消す", "とりけす")).toEqual([
      { t: "取", r: "と" },
      { t: "り" },
      { t: "消", r: "け" },
      { t: "す" }
    ]);
  });
  it("handles a leading kana prefix", () => {
    expect(alignToken("お茶", "おちゃ")).toEqual([{ t: "お" }, { t: "茶", r: "ちゃ" }]);
  });
  it("falls back to a single ruby span when reading cannot be aligned", () => {
    // reading has no 'べ'/'る' to anchor the okurigana -> whole-run ruby
    expect(alignToken("食べる", "しょく")).toEqual([{ t: "食べる", r: "しょく" }]);
  });
});

describe("tokensToSegments", () => {
  const tok = (surface_form: string, reading: string) => ({ surface_form, reading });

  it("aligns a sentence and merges adjacent plain runs", () => {
    const tokens = [
      tok("朝", "アサ"),
      tok("ごはん", "ゴハン"),
      tok("を", "ヲ"),
      tok("食べる", "タベル"),
      tok("。", "。")
    ];
    expect(tokensToSegments(tokens)).toEqual([
      { t: "朝", r: "あさ" },
      { t: "ごはんを" },
      { t: "食", r: "た" },
      { t: "べる。" }
    ]);
  });

  it("treats tokens with no reading (unknown / symbols) as plain text", () => {
    const tokens = [tok("本", "ホン"), tok("＃", "*"), tok("を", "ヲ")];
    expect(tokensToSegments(tokens)).toEqual([{ t: "本", r: "ほん" }, { t: "＃を" }]);
  });
});

describe("applyReadingOverrides", () => {
  const tok = (surface_form: string, reading: string) => ({ surface_form, reading });
  const overrides = { 一人: "ひとり" };

  it("merges the tokens of a misread word into one corrected token", () => {
    const tokens = [tok("一", "イチ"), tok("人", "ニン"), tok("で", "デ")];
    expect(applyReadingOverrides(tokens, overrides)).toEqual([
      { surface_form: "一人", reading: "ひとり" },
      { surface_form: "で", reading: "デ" }
    ]);
  });

  it("leaves tokens untouched when nothing matches", () => {
    const tokens = [tok("本", "ホン"), tok("を", "ヲ")];
    expect(applyReadingOverrides(tokens, overrides)).toEqual(tokens);
  });

  it("feeds straight into tokensToSegments to fix the furigana", () => {
    const tokens = [tok("一", "イチ"), tok("人", "ニン"), tok("だ", "ダ")];
    expect(tokensToSegments(applyReadingOverrides(tokens, overrides))).toEqual([
      { t: "一人", r: "ひとり" },
      { t: "だ" }
    ]);
  });
});
