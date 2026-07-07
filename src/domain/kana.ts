// The gojuon (五十音) inventory for the absolute-beginner kana module (#533).
//
// One entry per kana per script: 46 seion + 20 dakuon + 5 handakuon + 33 youon
// = 104 per script, 208 total. Romaji is Hepburn (し=shi, ち=chi, つ=tsu,
// ふ=fu, じ/ぢ=ji, ず/づ=zu) -- the romanization learners actually meet.
//
// Authoring strategy: the hiragana table is written out by hand ONCE; the
// katakana table is DERIVED by the uniform U+60 codepoint shift between the
// Hiragana (U+3041..U+3096) and Katakana (U+30A1..U+30F6) blocks, which is
// exact for every kana used here (including the small ゃゅょ in youon). That
// halves the hand-transcription surface; kana.test.ts locks the counts, the
// Hepburn irregulars, and the hira<->kata bijection.
//
// `row` is a display/grouping key (drill distractors prefer same-row kana;
// the chapter renders one line per row). Rows are named by their hiragana
// head for BOTH scripts so the pairing stays trivially aligned.

export type KanaScript = "hiragana" | "katakana";
export type KanaGroup = "seion" | "dakuon" | "handakuon" | "youon";

export type KanaEntry = {
  /** The kana glyph(s): one char, or two for youon (きゃ). */
  kana: string;
  /** Hepburn romaji, lowercase. Not unique (じ/ぢ are both "ji"). */
  romaji: string;
  script: KanaScript;
  group: KanaGroup;
  /** Gojuon row, e.g. "か行"; youon rows are named by their head ("きゃ行"). */
  row: string;
};

// row name -> [kana, romaji] pairs, in gojuon order. Hiragana only -- the
// katakana side is derived below.
type RowSpec = [row: string, group: KanaGroup, pairs: Array<[string, string]>];

const HIRAGANA_ROWS: RowSpec[] = [
  // -- seion (46) --
  ["あ行", "seion", [["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"]]],
  ["か行", "seion", [["か", "ka"], ["き", "ki"], ["く", "ku"], ["け", "ke"], ["こ", "ko"]]],
  ["さ行", "seion", [["さ", "sa"], ["し", "shi"], ["す", "su"], ["せ", "se"], ["そ", "so"]]],
  ["た行", "seion", [["た", "ta"], ["ち", "chi"], ["つ", "tsu"], ["て", "te"], ["と", "to"]]],
  ["な行", "seion", [["な", "na"], ["に", "ni"], ["ぬ", "nu"], ["ね", "ne"], ["の", "no"]]],
  ["は行", "seion", [["は", "ha"], ["ひ", "hi"], ["ふ", "fu"], ["へ", "he"], ["ほ", "ho"]]],
  ["ま行", "seion", [["ま", "ma"], ["み", "mi"], ["む", "mu"], ["め", "me"], ["も", "mo"]]],
  ["や行", "seion", [["や", "ya"], ["ゆ", "yu"], ["よ", "yo"]]],
  ["ら行", "seion", [["ら", "ra"], ["り", "ri"], ["る", "ru"], ["れ", "re"], ["ろ", "ro"]]],
  ["わ行", "seion", [["わ", "wa"], ["を", "wo"]]],
  ["ん", "seion", [["ん", "n"]]],
  // -- dakuon (20) --
  ["が行", "dakuon", [["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"]]],
  ["ざ行", "dakuon", [["ざ", "za"], ["じ", "ji"], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"]]],
  ["だ行", "dakuon", [["だ", "da"], ["ぢ", "ji"], ["づ", "zu"], ["で", "de"], ["ど", "do"]]],
  ["ば行", "dakuon", [["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"]]],
  // -- handakuon (5) --
  ["ぱ行", "handakuon", [["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"]]],
  // -- youon: seion-based (21) --
  ["きゃ行", "youon", [["きゃ", "kya"], ["きゅ", "kyu"], ["きょ", "kyo"]]],
  ["しゃ行", "youon", [["しゃ", "sha"], ["しゅ", "shu"], ["しょ", "sho"]]],
  ["ちゃ行", "youon", [["ちゃ", "cha"], ["ちゅ", "chu"], ["ちょ", "cho"]]],
  ["にゃ行", "youon", [["にゃ", "nya"], ["にゅ", "nyu"], ["にょ", "nyo"]]],
  ["ひゃ行", "youon", [["ひゃ", "hya"], ["ひゅ", "hyu"], ["ひょ", "hyo"]]],
  ["みゃ行", "youon", [["みゃ", "mya"], ["みゅ", "myu"], ["みょ", "myo"]]],
  ["りゃ行", "youon", [["りゃ", "rya"], ["りゅ", "ryu"], ["りょ", "ryo"]]],
  // -- youon: dakuon-based (9) --
  ["ぎゃ行", "youon", [["ぎゃ", "gya"], ["ぎゅ", "gyu"], ["ぎょ", "gyo"]]],
  ["じゃ行", "youon", [["じゃ", "ja"], ["じゅ", "ju"], ["じょ", "jo"]]],
  ["びゃ行", "youon", [["びゃ", "bya"], ["びゅ", "byu"], ["びょ", "byo"]]],
  // -- youon: handakuon-based (3) --
  ["ぴゃ行", "youon", [["ぴゃ", "pya"], ["ぴゅ", "pyu"], ["ぴょ", "pyo"]]]
];

// Hiragana U+3041..U+3096 -> Katakana U+30A1..U+30F6 is a uniform +0x60
// shift for every kana in this table (small ゃゅょ included).
const KATA_SHIFT = 0x60;

function toKatakanaGlyph(hiragana: string): string {
  return [...hiragana]
    .map((ch) => String.fromCodePoint((ch.codePointAt(0) ?? 0) + KATA_SHIFT))
    .join("");
}

function buildTable(): KanaEntry[] {
  const entries: KanaEntry[] = [];
  for (const [row, group, pairs] of HIRAGANA_ROWS) {
    for (const [kana, romaji] of pairs) {
      entries.push({ kana, romaji, script: "hiragana", group, row });
    }
  }
  // Derived katakana side, same order, same row/group/romaji.
  const hiraCount = entries.length;
  for (let i = 0; i < hiraCount; i++) {
    const h = entries[i];
    entries.push({ ...h, kana: toKatakanaGlyph(h.kana), script: "katakana" });
  }
  return entries;
}

export const KANA_TABLE: KanaEntry[] = buildTable();

const HIRA_TO_KATA = new Map<string, KanaEntry>(
  KANA_TABLE.filter((k) => k.script === "hiragana").map((h) => [
    h.kana,
    KANA_TABLE.find((k) => k.script === "katakana" && k.kana === toKatakanaGlyph(h.kana))!
  ])
);

/** The katakana entry paired with a hiragana glyph (あ -> ア), or null. */
export function kataForHira(hiragana: string): KanaEntry | null {
  return HIRA_TO_KATA.get(hiragana) ?? null;
}
