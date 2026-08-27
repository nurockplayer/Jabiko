import { describe, expect, it } from "vitest";
import type { PracticeQuestion } from "../../types";
import { n1Items } from "./n1";
import { n2Items } from "./n2";

function findQuestion(items: PracticeQuestion[], id: string): PracticeQuestion {
  const question = items.find((item) => item.id === id);
  if (!question) throw new Error(`Missing exam question: ${id}`);
  return question;
}

describe("issue #783 grammar feedback regressions", () => {
  it("identifies わかってきた as the ta-form used before といったところだ", () => {
    const question = findQuestion(n1Items, "n1-grammar-toittatokoroda-2");

    expect(question.explanation).toMatch(/「わかってきた」是「わかってくる」的た形/);
    expect(question.explanationI18n?.ja).toMatch(/「わかってきた」は「わかってくる」のた形/);
    expect(question.explanationI18n?.en).toMatch(
      /わかってきた.*ta-form of.*わかってくる/i
    );
  });

  it("does not offer に基づいて as a second defensible answer to に照らして", () => {
    const question = findQuestion(n1Items, "n1-grammar-niterashite");

    expect(question.options).not.toContain("に基づいて");
  });

  it("explains the ばかりだ connection mismatch in every launched locale", () => {
    const question = findQuestion(n2Items, "n2-grammar-tsutsuaru");

    expect(question.explanation).toMatch(/辭書形.*上昇するばかりだ/);
    expect(question.explanationI18n?.ja).toMatch(/辞書形.*上昇するばかりだ/);
    expect(question.explanationI18n?.en).toMatch(/dictionary form.*上昇するばかりだ/i);
  });

  it("describes どころか as rejecting A instead of adding B to an accepted A", () => {
    const question = findQuestion(n2Items, "n2-grammar-dokoroka");

    expect(question.vocabulary.meaningZh).toMatch(/並非|不是|非但沒/);
    expect(question.vocabulary.meaningI18n?.ja).toMatch(/ではなく|否定/);
    expect(question.explanation).toMatch(/A.*否定/);
    expect(question.explanationI18n?.ja).toMatch(/A.*否定/);
    expect(question.explanationI18n?.ja).not.toContain("Aはもちろん");
    expect(question.hintZh).toBeTruthy();
    expect(question.hintI18n?.ja).toBeTruthy();
    expect(question.hintI18n?.en).toBeTruthy();
  });
});
