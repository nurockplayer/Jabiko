import { describe, it, expect } from "vitest";
import {
  kataToHira,
  hasKanji,
  alignToken,
  tokensToSegments,
  applyReadingOverrides,
  isReadingPrompt
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
