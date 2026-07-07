import { describe, expect, it } from "vitest";
import { KANA_TABLE, kataForHira, type KanaEntry } from "./kana";

const byScript = (script: KanaEntry["script"]) => KANA_TABLE.filter((k) => k.script === script);
const of = (script: KanaEntry["script"], group: KanaEntry["group"]) =>
  KANA_TABLE.filter((k) => k.script === script && k.group === group);

describe("KANA_TABLE integrity (#533)", () => {
  it("has the full gojuon inventory per script: 46 seion + 20 dakuon + 5 handakuon + 33 youon", () => {
    for (const script of ["hiragana", "katakana"] as const) {
      expect(of(script, "seion")).toHaveLength(46);
      expect(of(script, "dakuon")).toHaveLength(20);
      expect(of(script, "handakuon")).toHaveLength(5);
      expect(of(script, "youon")).toHaveLength(33);
      expect(byScript(script)).toHaveLength(104);
    }
    expect(KANA_TABLE).toHaveLength(208);
  });

  it("every kana glyph is unique across the table", () => {
    const glyphs = KANA_TABLE.map((k) => k.kana);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it("uses Hepburn romaji for the irregular readings", () => {
    const romajiOf = (kana: string) => KANA_TABLE.find((k) => k.kana === kana)?.romaji;
    // The classic trip-ups -- these MUST be Hepburn, not naive rows.
    expect(romajiOf("し")).toBe("shi");
    expect(romajiOf("ち")).toBe("chi");
    expect(romajiOf("つ")).toBe("tsu");
    expect(romajiOf("ふ")).toBe("fu");
    expect(romajiOf("を")).toBe("wo");
    expect(romajiOf("ん")).toBe("n");
    expect(romajiOf("じ")).toBe("ji");
    expect(romajiOf("ぢ")).toBe("ji");
    expect(romajiOf("づ")).toBe("zu");
    expect(romajiOf("しゃ")).toBe("sha");
    expect(romajiOf("ちょ")).toBe("cho");
    expect(romajiOf("じゃ")).toBe("ja");
    // And the same irregulars on the katakana side.
    expect(romajiOf("シ")).toBe("shi");
    expect(romajiOf("ツ")).toBe("tsu");
    expect(romajiOf("ヲ")).toBe("wo");
    expect(romajiOf("ヂ")).toBe("ji");
    expect(romajiOf("チャ")).toBe("cha");
  });

  it("every hiragana has exactly one katakana counterpart with the same romaji/group/row", () => {
    for (const hira of byScript("hiragana")) {
      const kata = kataForHira(hira.kana);
      expect(kata, `no counterpart for ${hira.kana}`).toBeTruthy();
      expect(kata!.script).toBe("katakana");
      expect(kata!.romaji).toBe(hira.romaji);
      expect(kata!.group).toBe(hira.group);
      expect(kata!.row).toBe(hira.row);
    }
    // Counterparts are distinct (the mapping is a bijection).
    const targets = byScript("hiragana").map((h) => kataForHira(h.kana)!.kana);
    expect(new Set(targets).size).toBe(104);
  });

  it("rows are consistent: every entry has a non-empty row and seion rows follow the gojuon order", () => {
    for (const entry of KANA_TABLE) {
      expect(entry.row, `${entry.kana} has empty row`).toBeTruthy();
      expect(entry.romaji, `${entry.kana} has empty romaji`).toBeTruthy();
    }
    const seionRows = [...new Set(of("hiragana", "seion").map((k) => k.row))];
    expect(seionRows).toEqual([
      "あ行",
      "か行",
      "さ行",
      "た行",
      "な行",
      "は行",
      "ま行",
      "や行",
      "ら行",
      "わ行",
      "ん"
    ]);
  });

  it("youon are all two-glyph small-y combinations", () => {
    for (const entry of KANA_TABLE.filter((k) => k.group === "youon")) {
      expect(entry.kana).toHaveLength(2);
      expect(["ゃ", "ゅ", "ょ", "ャ", "ュ", "ョ"]).toContain(entry.kana[1]);
    }
  });
});
