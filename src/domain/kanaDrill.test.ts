import { describe, expect, it } from "vitest";
import { KANA_TABLE } from "./kana";
import { buildKanaQuestionPool } from "./kanaDrill";

const hira = buildKanaQuestionPool({ script: "hiragana" });
const kata = buildKanaQuestionPool({ script: "katakana" });
const all = [...hira, ...kata];

const romajiBySameScript = (script: string) =>
  new Map(
    KANA_TABLE.filter((k) => k.script === script).map((k) => [k.kana, k.romaji])
  );

describe("buildKanaQuestionPool (#533)", () => {
  it("hiragana pool = 104 read + 104 pick; katakana adds 104 hira-match", () => {
    expect(hira).toHaveLength(208);
    expect(kata).toHaveLength(312);
  });

  it("every question has 4 distinct options containing exactly one expected answer", () => {
    for (const q of all) {
      expect(q.options, q.id).toHaveLength(4);
      expect(new Set(q.options).size, q.id).toBe(4);
      const hits = q.options!.filter((option) => q.expectedAnswers.includes(option));
      expect(hits, q.id).toHaveLength(1);
    }
  });

  it("ids are unique and carry the script prefix used for chapter completion", () => {
    const ids = all.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of hira) expect(q.id).toMatch(/^kana-hiragana-/);
    for (const q of kata) expect(q.id).toMatch(/^kana-katakana-/);
  });

  it("read questions ask kana -> romaji", () => {
    const read = hira.filter((q) => q.id.includes("-read-"));
    expect(read).toHaveLength(104);
    const romaji = romajiBySameScript("hiragana");
    for (const q of read) {
      expect(romaji.has(q.promptText!), q.id).toBe(true); // prompt is a kana glyph
      expect(q.expectedAnswers).toEqual([romaji.get(q.promptText!)]);
    }
  });

  it("pick questions ask romaji -> kana and NEVER offer a same-romaji distractor (じ/ぢ, ず/づ)", () => {
    const romaji = romajiBySameScript("hiragana");
    const pick = hira.filter((q) => q.id.includes("-pick-"));
    expect(pick).toHaveLength(104);
    for (const q of pick) {
      const answerGlyph = q.expectedAnswers[0];
      const target = romaji.get(answerGlyph);
      expect(target, q.id).toBeTruthy();
      // Any distractor sharing the prompt romaji would be a second right
      // answer -- the ji/zu pairs are the trap this guards.
      for (const option of q.options!) {
        if (option === answerGlyph) continue;
        expect(romaji.get(option), `${q.id} offers double-solution ${option}`).not.toBe(target);
      }
    }
  });

  it("match questions (katakana chapter) ask katakana -> its hiragana counterpart", () => {
    const match = kata.filter((q) => q.id.includes("-match-"));
    expect(match).toHaveLength(104);
    const hiraGlyphs = new Set(KANA_TABLE.filter((k) => k.script === "hiragana").map((k) => k.kana));
    for (const q of match) {
      // options are hiragana; the correct one shares the prompt's romaji.
      for (const option of q.options!) expect(hiraGlyphs.has(option), q.id).toBe(true);
    }
    // Spot-check the classic: シ matches し, and ツ is nearby as a confusion foil upstream.
    const shi = match.find((q) => q.promptText === "シ");
    expect(shi?.expectedAnswers).toEqual(["し"]);
  });

  it("prefers documented confusion foils: ツ appears among シ's read distractors as 'tsu'", () => {
    const shiRead = kata.find((q) => q.id.includes("-read-") && q.promptText === "シ");
    expect(shiRead?.options).toContain("tsu");
    const nuRead = hira.find((q) => q.id.includes("-read-") && q.promptText === "ぬ");
    expect(nuRead?.options).toContain("me"); // め is ぬ's classic look-alike
  });

  it("never leaks the answer glyph through the hint or vocab row (pick/match)", () => {
    // Row names are headed by their first kana ("ぎゃ行" contains ぎゃ), so a
    // row-name hint on a "which kana reads X" question hands over the answer
    // for every row-head kana. pick/match hints and the pre-answer vocab
    // meaning must therefore never contain the expected kana glyph.
    const glyphKinds = [...hira, ...kata].filter(
      (q) => q.id.includes("-pick-") || q.id.includes("-match-")
    );
    expect(glyphKinds.length).toBeGreaterThan(0);
    for (const q of glyphKinds) {
      const answer = q.expectedAnswers[0];
      expect(q.hintZh ?? "", q.id).not.toContain(answer);
      expect(q.hintI18n?.ja ?? "", q.id).not.toContain(answer);
      expect(q.hintI18n?.en ?? "", q.id).not.toContain(answer);
      expect(q.vocabulary.meaningZh, q.id).not.toContain(answer);
      // Source-level safety: the vocabulary surface/reading must not carry
      // the answer glyph either -- no downstream renderer (vocab row, aria
      // label, review list...) should be one suppression-heuristic away
      // from displaying it pre-answer.
      expect(q.vocabulary.surface, q.id).not.toContain(answer);
      expect(q.vocabulary.reading, q.id).not.toContain(answer);
    }
  });

  it("is fully deterministic (same input -> identical pool)", () => {
    expect(JSON.stringify(buildKanaQuestionPool({ script: "hiragana" }))).toBe(
      JSON.stringify(hira)
    );
    expect(JSON.stringify(buildKanaQuestionPool({ script: "katakana" }))).toBe(
      JSON.stringify(kata)
    );
  });

  it("stubs vocabulary at N5 with kana tags and uses the reading target form", () => {
    for (const q of all.slice(0, 20)) {
      expect(q.vocabulary.level).toBe("N5");
      expect(q.vocabulary.tags).toContain("kana");
      expect(q.targetForm).toBe("reading");
      expect(q.explanation.length).toBeGreaterThan(0);
      expect(q.instructionZh ?? "").not.toHaveLength(0);
    }
  });

  it("suppresses the redundant pre-answer vocab row and localizes the meaning (review finding)", () => {
    // ExamPrompt renders a permanent surface・reading・meaning row unless the
    // item is exam-style. For kana questions that row is pure duplication of
    // promptText AND its meaning would fall back to raw Chinese in en/ja
    // (language-isolation rule). So: every kana question is tagged
    // exam_style (row suppressed) AND carries a meaningI18n overlay so no
    // remaining meaning render path can leak zh into a launched locale.
    for (const q of all) {
      expect(q.vocabulary.tags, q.id).toContain("exam_style");
      expect(q.vocabulary.meaningI18n?.en, q.id).toBeTruthy();
      expect(q.vocabulary.meaningI18n?.ja, q.id).toBeTruthy();
    }
    // The localized meanings obey the same no-answer-glyph rule as meaningZh.
    for (const q of all.filter((x) => x.id.includes("-pick-") || x.id.includes("-match-"))) {
      const answer = q.expectedAnswers[0];
      expect(q.vocabulary.meaningI18n?.en ?? "", q.id).not.toContain(answer);
      expect(q.vocabulary.meaningI18n?.ja ?? "", q.id).not.toContain(answer);
    }
  });
});
