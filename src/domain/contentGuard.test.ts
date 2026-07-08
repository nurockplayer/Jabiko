import { describe, expect, it } from "vitest";
import { examStyleQuestions } from "./examBlocks";
import { sentencePatternItems } from "./sentencePatterns";

// Typed content guard for the exam bank + sentence-pattern bank.
//
// This replaces the old regex-parsing script (scripts/check-exam-
// options.mjs): instead of scraping the .ts source as text, it validates
// the actual built question objects. That's more robust (no brittle
// regex, no "unparseable block" class of failure -- malformed entries are
// now tsc errors) and stays correct no matter how the data files are
// organised, which matters because examBlocks.ts is slated to be split by
// section. Run the focused gate with `pnpm check:exam`; it also runs as
// part of the normal `pnpm test`.
//
// Each check collects ALL offenders and asserts on the full list, so a
// failure names every bad entry at once rather than just the first.

// ---- zh-field language lint (#499) -----------------------------------------
// Base zh-facing fields (explanation / hintZh / instructionZh /
// promptContextZh / meaningZh / example meaningZh) must be written in
// Traditional Chinese. Chinese prose legitimately QUOTES Japanese inside
// 「」『』（）() — so strip bracketed spans first; what remains must not be
// Japanese prose. Calibrated against the 2026-07 audit: flags whole-field
// Japanese (the n3-vocab-sukkari class) while allowing zh prose that embeds
// unbracketed Japanese words (style-level, tracked separately in #499).
const KANA_PATTERN = /[ぁ-ゖァ-ヺー]/g;
const JA_PROSE_OPENERS = /^(正解は|正解の|この文|ここでは)/;

function stripQuotedSpans(text: string): string {
  let previous;
  let current = text;
  do {
    previous = current;
    current = current
      .replace(/「[^「」]*」/g, "")
      .replace(/『[^『』]*』/g, "")
      .replace(/（[^（）]*）/g, "")
      .replace(/\([^()]*\)/g, "");
  } while (current !== previous);
  return current;
}

function isJapaneseProse(text: string): boolean {
  if (JA_PROSE_OPENERS.test(text)) return true;
  const stripped = stripQuotedSpans(text);
  const kanaOutsideQuotes = (stripped.match(KANA_PATTERN) ?? []).length;
  if (kanaOutsideQuotes >= 25) return true;
  return kanaOutsideQuotes >= 12 && kanaOutsideQuotes / Math.max(stripped.length, 1) > 0.25;
}

describe("exam content guard", () => {
  it("ships a populated bank with options on every item", () => {
    // Guards the guard: if a refactor empties the import or drops options,
    // the checks below would pass vacuously. This fails loudly instead.
    expect(examStyleQuestions.length).toBeGreaterThan(250);
    const optionless = examStyleQuestions
      .filter((question) => !question.options || question.options.length < 2)
      .map((question) => question.id);
    expect(optionless, `exam items without >=2 options: ${optionless.join(", ")}`).toEqual([]);
  });

  it("has unique question ids", () => {
    const counts = new Map<string, number>();
    for (const question of examStyleQuestions) {
      counts.set(question.id, (counts.get(question.id) ?? 0) + 1);
    }
    const duplicates = [...counts].filter(([, n]) => n > 1).map(([id]) => id);
    expect(duplicates, `duplicate exam ids: ${duplicates.join(", ")}`).toEqual([]);
  });

  it("includes every expected answer among the offered options", () => {
    const offenders = examStyleQuestions
      .filter((question) => {
        const options = question.options;
        if (!options) return false;
        return question.expectedAnswers.some((answer) => !options.includes(answer));
      })
      .map((question) => question.id);
    expect(offenders, `expectedAnswer missing from options: ${offenders.join(", ")}`).toEqual([]);
  });

  it("never surfaces the JLPT level in promptLabel", () => {
    // The internal `level` field drives filtering; the user-visible
    // promptLabel must not lead with an "N1".."N5" token. Use a word
    // boundary (\b) -- matching the importer's check -- so "N3文法" (no
    // space, CJK right after) is caught too, not only "N3 文法".
    const offenders = examStyleQuestions
      .filter((question) => /^N[1-5]\b/.test(question.promptLabel ?? ""))
      .map((question) => `${question.id} -> ${question.promptLabel}`);
    expect(offenders, `level leak in promptLabel: ${offenders.join("; ")}`).toEqual([]);
  });

  it("writes every base zh-facing field in Chinese, not Japanese prose (#499)", () => {
    // zh-Hant users must never see a Japanese explanation/hint: the base
    // field IS the zh-Hant rendering (i18n overlays only cover ja/en).
    const offenders: string[] = [];
    for (const question of examStyleQuestions) {
      const fields: Array<[string, string | undefined]> = [
        ["explanation", question.explanation],
        ["hintZh", question.hintZh],
        ["instructionZh", question.instructionZh],
        ["promptContextZh", question.promptContextZh],
        ["meaningZh", question.vocabulary.meaningZh],
        ...question.vocabulary.examples.map(
          (example, index): [string, string | undefined] => [
            `examples[${index}].meaningZh`,
            example.meaningZh
          ]
        )
      ];
      for (const [field, value] of fields) {
        if (value && isJapaneseProse(value)) {
          offenders.push(`${question.id}.${field}`);
        }
      }
    }
    expect(offenders, `zh field written as Japanese prose: ${offenders.join(", ")}`).toEqual([]);
  });

  it("does not leak the answer gloss (meaningZh) in the pre-answer hintZh", () => {
    // hintZh is shown BEFORE answering, so it must not contain the
    // Chinese gloss of the answer. Tokenise meaningZh on CJK/ASCII
    // punctuation + parens (parens often hold the function tag, the worst
    // leak surface) and flag any >=2-char token that appears in hintZh.
    const offenders: string[] = [];
    for (const question of examStyleQuestions) {
      const hint = question.hintZh;
      if (!hint) continue;
      const tokens = question.vocabulary.meaningZh
        .split(/[、，；,;/（）()「」]/)
        .map((token) => token.replace(/\.\.\.|…|\s/g, "").trim())
        .filter((token) => token.length >= 2);
      const leaked = tokens.find((token) => hint.includes(token));
      if (leaked) offenders.push(`${question.id}: "${leaked}"`);
    }
    expect(offenders, `hintZh leaks a meaningZh token: ${offenders.join("; ")}`).toEqual([]);
  });

  it("offers kana-only options on 漢字読み items", () => {
    // 漢字読み tests the READING, so every option must be kana -- a kanji or
    // romaji option would give the answer away by being the odd one out.
    // Confusers should differ by 清濁/長音/促音/近形假名, not by script.
    const isKana = (value: string) => /^[぀-ヿ]+$/.test(value);
    const offenders: string[] = [];
    for (const question of examStyleQuestions) {
      if (question.promptLabel !== "漢字読み") continue;
      const nonKana = (question.options ?? []).filter((option) => !isKana(option));
      if (nonKana.length > 0) {
        offenders.push(`${question.id}: [${nonKana.join(", ")}]`);
      }
    }
    expect(offenders, `漢字読み non-kana options: ${offenders.join("; ")}`).toEqual([]);
  });

  it("marks the target word (not the whole sentence) in 漢字読み prompts", () => {
    // The 「」 quote marks the underlined word to read, e.g. 信頼を「損なう」….
    // Wrapping the ENTIRE sentence in 「」 (「…お金…」) leaves the learner unable
    // to tell which word is being tested. (User feedback: 題目無底線／框住整句.)
    const offenders = examStyleQuestions
      .filter((question) => question.promptLabel === "漢字読み")
      .filter((question) => /^[「『][^「」『』]*[」』]$/.test(question.promptText ?? ""))
      .map((question) => `${question.id}: ${question.promptText}`);
    expect(offenders, `漢字読み prompts quoting the whole sentence: ${offenders.join(" | ")}`).toEqual([]);
  });

  it("has no duplicate options within any item", () => {
    // A repeated option silently turns a 1-of-4 into a 1-of-3 (or worse).
    const offenders = examStyleQuestions
      .filter((question) => {
        const options = question.options;
        return options ? new Set(options).size !== options.length : false;
      })
      .map((question) => question.id);
    expect(offenders, `items with duplicate options: ${offenders.join(", ")}`).toEqual([]);
  });

  it("gives every item a non-empty explanation", () => {
    // The post-answer explanation is the learning payload; an empty one is
    // a quality-floor breach.
    const offenders = examStyleQuestions
      .filter((question) => !question.explanation || question.explanation.trim() === "")
      .map((question) => question.id);
    expect(offenders, `items with empty explanation: ${offenders.join(", ")}`).toEqual([]);
  });

  it("gives every vocabNote a full shape + launched-locale i18n (no zh leak, #453)", () => {
    // vocabNotes render post-answer via pickLocalized, which falls back to the
    // Chinese meaningZh when a locale overlay is missing. To honour the
    // language-isolation rule, every note must carry a non-empty translation
    // for each LAUNCHED non-zh locale (ja, en) so the fallback never fires.
    const launchedNonZh = ["ja", "en"] as const;
    const offenders: string[] = [];
    for (const question of examStyleQuestions) {
      if (!question.vocabNotes) continue;
      question.vocabNotes.forEach((note, i) => {
        const where = `${question.id}#vocabNotes[${i}]`;
        if (!note.surface?.trim() || !note.reading?.trim() || !note.meaningZh?.trim()) {
          offenders.push(`${where}: missing surface/reading/meaningZh`);
        }
        for (const loc of launchedNonZh) {
          const t = note.meaningI18n?.[loc];
          if (typeof t !== "string" || t.trim() === "") offenders.push(`${where}: missing ${loc} overlay`);
        }
      });
    }
    expect(offenders, `malformed vocabNotes: ${offenders.join("; ")}`).toEqual([]);
  });

  it("keeps 語順組合 prompts shuffleable (a ［...］ list of >=2 fragments)", () => {
    // 語順組合 prompts list their fragments in ANSWER order inside ［ ］, and
    // ExamPrompt render-shuffles them (#120) so the prompt doesn't spell out
    // the answer. That shuffle is a no-op unless the prompt parses as a
    // bracketed "/"-separated list of >=2 fragments -- mirror wordOrder.ts's
    // parser so an unshuffleable prompt fails loudly instead of leaking.
    const offenders: string[] = [];
    for (const question of examStyleQuestions) {
      if (question.promptLabel !== "語順組合") continue;
      const text = (question.promptText ?? "").trim();
      if (!text.startsWith("［") || !text.endsWith("］")) {
        offenders.push(`${question.id}: not a ［...］ list`);
        continue;
      }
      const fragments = text
        .slice(1, -1)
        .split("/")
        .map((fragment) => fragment.trim())
        .filter((fragment) => fragment.length > 0);
      if (fragments.length < 2) {
        offenders.push(`${question.id}: <2 fragments`);
      }
    }
    expect(offenders, `unshuffleable 語順組合 prompts: ${offenders.join("; ")}`).toEqual([]);
  });

  it("has no two items sharing an identical promptText", () => {
    // A duplicated sentence-with-blank means two "different" questions are
    // really the same drill -- usually a copy-paste slip when authoring a
    // batch. Skip items without a promptText (plain conjugation drills).
    const counts = new Map<string, number>();
    for (const question of examStyleQuestions) {
      const text = question.promptText?.trim();
      if (!text) continue;
      counts.set(text, (counts.get(text) ?? 0) + 1);
    }
    const duplicates = [...counts].filter(([, n]) => n > 1).map(([text]) => text);
    expect(duplicates, `duplicate promptText: ${duplicates.join(" | ")}`).toEqual([]);
  });

  it("lists 語順組合 fragments in answer order (［a / b / c］ concatenated == the answer)", () => {
    // shuffleOrderFragments (src/domain/wordOrder.ts) assumes the ［...］ list
    // is in the CORRECT answer order and shuffles it for display, using that
    // order as the baseline for its "never leak the answer" guard. If an item
    // lists its fragments out of answer order, the leak-guard compares against
    // the wrong baseline (it can surface the real answer) and the review shows
    // a sequence that doesn't assemble to the answer -- the user-reported
    // "sequence explained is wrong". So the contract is: joined fragments ==
    // expectedAnswer.
    const offenders: string[] = [];
    for (const question of examStyleQuestions) {
      if (question.promptLabel !== "語順組合") continue;
      const text = question.promptText?.trim() ?? "";
      if (!text.startsWith("［") || !text.endsWith("］")) continue;
      const joined = text
        .slice(1, -1)
        .split("/")
        .map((fragment) => fragment.trim())
        .filter(Boolean)
        .join("");
      const answer = question.expectedAnswers[0];
      if (joined !== answer) offenders.push(`${question.id}: "${joined}" != "${answer}"`);
    }
    expect(
      offenders,
      `語順組合 fragments not in answer order: ${offenders.join(" | ")}`
    ).toEqual([]);
  });

  it("shows the target word in ≥2 options on 用法 items (not only the answer)", () => {
    // A vocabulary-usage (詞彙用法 / 語彙用法) item must present the SAME target
    // word in several different sentences so the learner judges by naturalness.
    // If the word appears in only the correct option, the item is trivially
    // guessable by spotting the word (the reported n3-usage-komu 込む flaw).
    // Contract: the target's kanji stem appears in at least 2 of the 4 options.
    // Scope: only surfaces that CONTAIN kanji -- the kanji stem (e.g. 込 in 込む)
    // survives conjugation (込んで/込んだ), so a substring check is reliable.
    // Pure-kana verbs (こじつける → こじつけて) would need conjugation-aware
    // stemming, which is too fragile here; those are left to the LLM sweep.
    const USAGE_LABELS = new Set(["詞彙用法", "語彙用法"]);
    const offenders: string[] = [];
    for (const question of examStyleQuestions) {
      if (!USAGE_LABELS.has(question.promptLabel ?? "")) continue;
      const options = question.options ?? [];
      if (options.length < 2) continue;
      const kanjiRuns = question.vocabulary.surface.match(/[一-鿿]+/g);
      if (!kanjiRuns || kanjiRuns.length === 0) continue; // kana-only surface
      const target = kanjiRuns.reduce((a, b) => (b.length > a.length ? b : a));
      const hits = options.filter((option) => option.includes(target)).length;
      if (hits < 2) {
        offenders.push(`${question.id} (kanji "${target}" in ${hits}/${options.length} options)`);
      }
    }
    expect(
      offenders,
      `用法 items with the target word in <2 options (guessable): ${offenders.join(" | ")}`
    ).toEqual([]);
  });
});

// Per-pattern banlist: phrases that would tip off the answer if they
// appeared in the pre-answer hintZh (a 1-of-N pattern pick becomes a
// 1-of-1 "match the Chinese label"). From the Codex review of PR #31.
const PATTERN_HINT_BANLIST: Record<string, string[]> = {
  "te-kudasai": ["請", "請求", "禁止", "可以", "准許", "允許", "不准", "不要"],
  "nakute-mo-ii": ["不必", "不用", "可不必", "必須", "一定要", "不可", "不該"],
  "te-morau": ["給予", "替我", "為我", "為他", "幫我", "幫他"],
  "to-omou": ["以為", "覺得", "認為", "說"],
  "mae-ato": ["之前", "之後", "做完", "結束", "接著", "然後", "首先", "前後"],
  "nagara-tari": ["一邊", "同時", "一面", "列舉", "並列"],
  "te-aux": ["試試", "看看", "事先", "預先", "不小心", "已經", "正在", "結果", "補助"],
  "n5-joshi2": ["方向", "舉例", "工具", "手段", "合計", "總共"],
  "n5-joshi3": ["也", "只有", "只", "或", "從", "代替"],
  "n5-hikaku": ["比", "哪個", "哪一個"],
  "n5-suki-dekiru": ["擅長", "也", "喜歡", "討厭"],
  "n5-sasoi": ["邀請", "邀約", "要不要", "我來"],
  "n5-onegai": ["最好", "不必", "請勿", "別"],
  "n5-riyuu": ["因為", "所以", "但是", "可是", "理由", "為什麼"],
  "n5-toki": ["時候", "已經", "還沒", "大概", "可能"],
  "n5-teido": ["不太", "完全", "常常", "有時", "偶爾", "大概", "左右"]
};

describe("sentence-pattern content guard", () => {
  it("ships a populated bank", () => {
    expect(sentencePatternItems.length).toBeGreaterThan(0);
  });

  it("has unique item ids", () => {
    const counts = new Map<string, number>();
    for (const item of sentencePatternItems) {
      counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
    }
    const duplicates = [...counts].filter(([, n]) => n > 1).map(([id]) => id);
    expect(duplicates, `duplicate pattern ids: ${duplicates.join(", ")}`).toEqual([]);
  });

  it("keeps hintZh free of the per-pattern banlist phrases", () => {
    const offenders: string[] = [];
    for (const item of sentencePatternItems) {
      const banned = PATTERN_HINT_BANLIST[item.patternId] ?? [];
      for (const phrase of banned) {
        if (item.hintZh.includes(phrase)) {
          offenders.push(`${item.id}: "${phrase}"`);
        }
      }
    }
    expect(offenders, `hintZh contains a banned phrase: ${offenders.join("; ")}`).toEqual([]);
  });
});
