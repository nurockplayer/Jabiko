// Kana-recognition drill questions for the absolute-beginner module (#533).
//
// Three deterministic question kinds over KANA_TABLE:
//   read  (both chapters)    : see a kana        -> pick its Hepburn romaji
//   pick  (both chapters)    : see a romaji      -> pick the kana that reads so
//   match (katakana chapter) : see a katakana    -> pick its hiragana twin
// The katakana chapter gets `match` because learners meet katakana AFTER
// hiragana, so mapping back to the known script is the natural bridge.
//
// Unique-solution invariants (locked by kanaDrill.test.ts):
//   - options are 4 distinct strings containing exactly one expected answer;
//   - `pick` never offers a distractor whose romaji equals the prompt romaji
//     (じ/ぢ are both "ji", ず/づ both "zu" -- offering the twin would be a
//     second right answer);
//   - `match` also excludes same-romaji foils (a romaji-identical look-alike
//     is a dirty trick at starter level, even when technically unambiguous).
//
// Distractors are pedagogical, not random: documented look-alike confusion
// sets first (ぬ/め, シ/ツ, ソ/ン...), then same-row kana, then the rest of
// the script in table order. Everything is derived from KANA_TABLE order --
// no RNG -- so the pool is stable across sessions and ids are stable forever.
import type { LocalizedText, PracticeQuestion, VocabularyItem } from "./types";
import { KANA_TABLE, kataForHira, type KanaEntry, type KanaScript } from "./kana";

// Well-attested look-alike sets. Every member is a foil candidate for every
// other member of its set. Purely a distractor PREFERENCE -- correctness never
// depends on this table.
const CONFUSION_SETS: string[][] = [
  // hiragana
  ["あ", "お"],
  ["い", "り"],
  ["う", "つ"],
  ["ぬ", "め"],
  ["ね", "れ", "わ"],
  ["る", "ろ"],
  ["は", "ほ"],
  ["き", "さ", "ち"],
  ["ま", "も"],
  // katakana
  ["シ", "ツ"],
  ["ソ", "ン"],
  ["ク", "フ", "ワ"],
  ["コ", "ユ"],
  ["チ", "テ"]
];

const CONFUSION_OF = new Map<string, string[]>();
for (const set of CONFUSION_SETS) {
  for (const kana of set) {
    CONFUSION_OF.set(kana, set.filter((other) => other !== kana));
  }
}

const GROUP_ZH: Record<KanaEntry["group"], string> = {
  seion: "清音",
  dakuon: "濁音",
  handakuon: "半濁音",
  youon: "拗音"
};

// Group names for the en overlay use the romanized pedagogy terms (the ones
// kana courses actually use), not ad-hoc translations.
const GROUP_EN: Record<KanaEntry["group"], string> = {
  seion: "seion",
  dakuon: "dakuon",
  handakuon: "handakuon",
  youon: "yōon"
};

const SCRIPT_ZH: Record<KanaScript, string> = {
  hiragana: "平假名",
  katakana: "片假名"
};

const INSTRUCTION_READ: LocalizedText = {
  ja: "この仮名の読み（ローマ字）を選んでください。",
  en: "Pick the reading (romaji) of this kana."
};
const INSTRUCTION_PICK: LocalizedText = {
  ja: "この読みに合う仮名を選んでください。",
  en: "Pick the kana with this reading."
};
const INSTRUCTION_MATCH: LocalizedText = {
  ja: "対応するひらがなを選んでください。",
  en: "Pick the matching hiragana."
};

// ASCII-stable id suffix: kana glyphs as codepoint hex ("じ" -> "3058").
// Ids must never change -- they key SRS/mistake-pool history (#525).
function hexId(kana: string): string {
  return [...kana].map((ch) => (ch.codePointAt(0) ?? 0).toString(16)).join("");
}

/**
 * Pick 3 deterministic distractor entries for `entry`: confusion look-alikes
 * first, then same-row kana, then the rest of the same-script table starting
 * just after the entry (wrapping). `exclude` guards unique-solution rules;
 * `toOption` maps a candidate to the option string (dedupe happens on that).
 */
function pickFoils(
  entry: KanaEntry,
  candidates: KanaEntry[],
  exclude: (candidate: KanaEntry) => boolean,
  toOption: (candidate: KanaEntry) => string
): string[] {
  const startIndex = candidates.findIndex((candidate) => candidate.kana === entry.kana);
  const confusion = (CONFUSION_OF.get(entry.kana) ?? [])
    .map((kana) => candidates.find((candidate) => candidate.kana === kana))
    .filter((candidate): candidate is KanaEntry => Boolean(candidate));
  const sameRow = candidates.filter(
    (candidate) => candidate.row === entry.row && candidate.kana !== entry.kana
  );
  const rest: KanaEntry[] = [];
  for (let step = 1; step < candidates.length; step++) {
    rest.push(candidates[(startIndex + step + candidates.length) % candidates.length]);
  }

  const seen = new Set<string>([toOption(entry)]);
  const foils: string[] = [];
  for (const candidate of [...confusion, ...sameRow, ...rest]) {
    if (foils.length === 3) break;
    if (candidate.kana === entry.kana || exclude(candidate)) continue;
    const option = toOption(candidate);
    if (seen.has(option)) continue;
    seen.add(option);
    foils.push(option);
  }
  return foils;
}

// Options keep a deterministic but non-positional order (the correct answer
// must not always sit first): sort the 4 strings lexicographically.
function arrangeOptions(correct: string, foils: string[]): string[] {
  return [correct, ...foils].sort((a, b) => a.localeCompare(b, "ja"));
}

// `face` fills surface/reading. It must always be PROMPT-side content, never
// the answer: no downstream renderer (vocab row, aria label, review list...)
// should be one suppression-heuristic away from displaying the answer
// pre-answer. read/match show the prompt kana; pick shows the prompt romaji.
function baseVocabulary(
  entry: KanaEntry,
  id: string,
  meaningZh: string,
  meaningI18n: LocalizedText,
  face: string = entry.kana
): VocabularyItem {
  return {
    id,
    surface: face,
    reading: face,
    // Caller-supplied and NEVER the romaji (the read kind's answer). For the
    // glyph-answer kinds (pick/match) it must also avoid ROW NAMES: a row is
    // headed by its first kana ("ぎゃ行" contains ぎゃ), which would hand the
    // answer to every row-head question through the pre-answer vocab row.
    meaningZh,
    // Always overlaid (language-isolation rule): any render path that reads
    // the meaning must resolve to the UI language, never fall back to zh.
    meaningI18n,
    partOfSpeech: "noun",
    group: null,
    lesson: null,
    // "exam_style" suppresses ExamPrompt's permanent pre-answer vocab row --
    // for kana questions that row only duplicates promptText, and the
    // row/group info already reaches the learner via the localized hint.
    tags: ["kana", entry.script, entry.group, "exam_style"],
    examples: [],
    level: "N5"
  };
}

function readQuestion(entry: KanaEntry, sameScript: KanaEntry[]): PracticeQuestion {
  const id = `kana-${entry.script}-read-${hexId(entry.kana)}`;
  const foils = pickFoils(
    entry,
    sameScript,
    (candidate) => candidate.romaji === entry.romaji,
    (candidate) => candidate.romaji
  );
  const where = `${entry.row}・${GROUP_ZH[entry.group]}`;
  return {
    id,
    // Row+group is safe here: the prompt IS the kana, so naming its row adds
    // no information about the romaji answer.
    vocabulary: baseVocabulary(entry, id, where, {
      ja: where,
      en: `${entry.row} · ${GROUP_EN[entry.group]}`
    }),
    targetForm: "reading",
    expectedAnswers: [entry.romaji],
    explanation: `「${entry.kana}」讀作 ${entry.romaji}（${where}）。`,
    explanationI18n: {
      ja: `「${entry.kana}」は「${entry.romaji}」と読みます（${entry.row}・${GROUP_ZH[entry.group]}）。`,
      en: `${entry.kana} is read "${entry.romaji}" (${entry.row}, ${GROUP_EN[entry.group]}).`
    },
    promptLabel: `五十音・${SCRIPT_ZH[entry.script]}`,
    promptText: entry.kana,
    hintZh: where,
    hintI18n: { ja: where, en: `${entry.row} · ${GROUP_EN[entry.group]}` },
    instructionZh: "選出這個假名的讀音（羅馬拼音）。",
    instructionI18n: INSTRUCTION_READ,
    options: arrangeOptions(entry.romaji, foils)
  };
}

function pickQuestion(entry: KanaEntry, sameScript: KanaEntry[]): PracticeQuestion {
  const id = `kana-${entry.script}-pick-${hexId(entry.kana)}`;
  const foils = pickFoils(
    entry,
    sameScript,
    // Same-romaji twins (じ/ぢ, ず/づ) would be a second correct answer.
    (candidate) => candidate.romaji === entry.romaji,
    (candidate) => candidate.kana
  );
  return {
    id,
    // GROUP ONLY -- the answer is a glyph, and row names contain their head
    // glyph ("あ行" would leak あ). Same rule for the hint below. The face is
    // the ROMAJI (the prompt), never the answer kana (codex review, #533).
    vocabulary: baseVocabulary(
      entry,
      id,
      GROUP_ZH[entry.group],
      { ja: GROUP_ZH[entry.group], en: GROUP_EN[entry.group] },
      entry.romaji
    ),
    targetForm: "reading",
    expectedAnswers: [entry.kana],
    explanation: `${entry.romaji} 是「${entry.kana}」（${entry.row}・${GROUP_ZH[entry.group]}）。`,
    explanationI18n: {
      ja: `「${entry.romaji}」は「${entry.kana}」です（${entry.row}・${GROUP_ZH[entry.group]}）。`,
      en: `"${entry.romaji}" is ${entry.kana} (${entry.row}, ${GROUP_EN[entry.group]}).`
    },
    promptLabel: `五十音・${SCRIPT_ZH[entry.script]}`,
    promptText: entry.romaji,
    hintZh: GROUP_ZH[entry.group],
    hintI18n: {
      ja: GROUP_ZH[entry.group],
      en: GROUP_EN[entry.group]
    },
    instructionZh: `選出讀作「${entry.romaji}」的假名。`,
    instructionI18n: INSTRUCTION_PICK,
    options: arrangeOptions(entry.kana, foils)
  };
}

function matchQuestion(
  entry: KanaEntry,
  hiraEntries: KanaEntry[],
  counterpartByKata: Map<string, KanaEntry>
): PracticeQuestion {
  const counterpart = counterpartByKata.get(entry.kana)!;
  const id = `kana-${entry.script}-match-${hexId(entry.kana)}`;
  // Foils come from the HIRAGANA side (options are hiragana): the correct
  // twin's look-alikes first, then its row, then the rest.
  const foils = pickFoils(
    counterpart,
    hiraEntries,
    (candidate) => candidate.romaji === entry.romaji,
    (candidate) => candidate.kana
  );
  return {
    id,
    // GROUP ONLY -- the answer is the hiragana twin, and its row name would
    // spell it out for every row-head kana (「ぎゃ行」 contains ぎゃ).
    vocabulary: baseVocabulary(entry, id, GROUP_ZH[entry.group], {
      ja: GROUP_ZH[entry.group],
      en: GROUP_EN[entry.group]
    }),
    targetForm: "reading",
    expectedAnswers: [counterpart.kana],
    explanation: `片假名「${entry.kana}」對應平假名「${counterpart.kana}」（讀作 ${entry.romaji}）。`,
    explanationI18n: {
      ja: `カタカナ「${entry.kana}」はひらがな「${counterpart.kana}」に対応します（読み：${entry.romaji}）。`,
      en: `Katakana ${entry.kana} corresponds to hiragana ${counterpart.kana} (read "${entry.romaji}").`
    },
    promptLabel: `五十音・${SCRIPT_ZH[entry.script]}`,
    promptText: entry.kana,
    hintZh: GROUP_ZH[entry.group],
    hintI18n: {
      ja: GROUP_ZH[entry.group],
      en: GROUP_EN[entry.group]
    },
    instructionZh: "選出對應的平假名。",
    instructionI18n: INSTRUCTION_MATCH,
    options: arrangeOptions(counterpart.kana, foils)
  };
}

export type KanaPoolOptions = {
  script: KanaScript;
};

export function buildKanaQuestionPool({ script }: KanaPoolOptions): PracticeQuestion[] {
  const sameScript = KANA_TABLE.filter((entry) => entry.script === script);
  const questions: PracticeQuestion[] = [
    ...sameScript.map((entry) => readQuestion(entry, sameScript)),
    ...sameScript.map((entry) => pickQuestion(entry, sameScript))
  ];
  if (script === "katakana") {
    const hiraEntries = KANA_TABLE.filter((entry) => entry.script === "hiragana");
    const counterpartByKata = new Map<string, KanaEntry>(
      hiraEntries.map((hira) => [kataForHira(hira.kana)!.kana, hira])
    );
    questions.push(
      ...sameScript.map((entry) => matchQuestion(entry, hiraEntries, counterpartByKata))
    );
  }
  return questions;
}
