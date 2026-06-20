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
    // promptLabel must not start with an "N1 / N2 / N3 " prefix.
    const offenders = examStyleQuestions
      .filter((question) => /^N[1-3]\s/.test(question.promptLabel ?? ""))
      .map((question) => `${question.id} -> ${question.promptLabel}`);
    expect(offenders, `level leak in promptLabel: ${offenders.join("; ")}`).toEqual([]);
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
});

// Per-pattern banlist: phrases that would tip off the answer if they
// appeared in the pre-answer hintZh (a 1-of-N pattern pick becomes a
// 1-of-1 "match the Chinese label"). From the Codex review of PR #31.
const PATTERN_HINT_BANLIST: Record<string, string[]> = {
  "te-kudasai": ["請", "請求", "禁止", "可以", "准許", "允許", "不准", "不要"],
  "nakute-mo-ii": ["不必", "不用", "可不必", "必須", "一定要", "不可", "不該"],
  "te-morau": ["給予", "替我", "為我", "為他", "幫我", "幫他"],
  "to-omou": ["以為", "覺得", "認為", "說"]
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
