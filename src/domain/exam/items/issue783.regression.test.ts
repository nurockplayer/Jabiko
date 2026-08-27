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
  it("locks the human-reviewed たとえ…だとて concessive correlation", () => {
    const question = findQuestion(n1Items, "n1-grammar-tote-2");

    expect(question.expectedAnswers).toEqual(["だとて"]);
    expect(question.options).toEqual(["だとて", "とあって", "ゆえに", "とばかり"]);
    expect(question.explanation).toContain("句首「たとえ」與「だとて」形成讓步呼應");
    expect(question.explanation).toContain(
      "「とあって」「ゆえに」都能表示原因，但不能與「たとえ」形成這個讓步呼應"
    );
    expect(question.explanation).not.toContain("因果矛盾");
    expect(question.explanationI18n?.ja).toContain(
      "文頭の「たとえ」と「だとて」が譲歩の呼応を作ります"
    );
    expect(question.explanationI18n?.ja).toContain(
      "「とあって」「ゆえに」は原因を表せますが、「たとえ」とこの譲歩の呼応を作りません"
    );
    expect(question.explanationI18n?.ja).not.toContain("因果の矛盾");
    expect(question.explanationI18n?.en).toContain(
      "sentence-initial 「たとえ」 and 「だとて」 form a concessive correlation"
    );
    expect(question.explanationI18n?.en).toContain(
      "「とあって」 and 「ゆえに」 can express a cause, but neither completes that concessive correlation"
    );
    expect(question.explanationI18n?.en).not.toMatch(/contradict/i);
  });

  it("identifies わかってきた as the ta-form used before といったところだ", () => {
    const question = findQuestion(n1Items, "n1-grammar-toittatokoroda-2");

    expect(question.explanation).toMatch(/「わかってきた」是「わかってくる」的た形/);
    expect(question.explanationI18n?.ja).toMatch(/「わかってきた」は「わかってくる」のた形/);
    expect(question.explanationI18n?.en).toMatch(
      /わかってきた.*ta-form of.*わかってくる/i
    );
  });

  it("locks the human-reviewed direct self-assessment choices for といったところだ", () => {
    const question = findQuestion(n1Items, "n1-grammar-toittatokoroda-2");

    expect(question.expectedAnswers).toEqual(["わかってきたといったところだ"]);
    expect(question.options).toEqual([
      "わかってきたといったところだ",
      "わかっているわけがない",
      "わかるどころではない",
      "わかる必要はない"
    ]);
    expect(question.explanation).toContain("說話者直接陳述自己目前的理解程度");
    expect(question.explanation).toContain("「わかっているわけがない」強烈否定理解的可能性");
    expect(question.explanation).toContain(
      "「わかるどころではない」表示根本不是能談理解的狀況"
    );
    expect(question.explanation).toContain("「わかる必要はない」表示沒有理解的必要");
    expect(question.explanation).not.toContain("に違いない");
    expect(question.explanation).not.toContain("ということだ");
    expect(question.explanationI18n?.ja).toContain(
      "話し手本人が現在の理解度を直接述べています"
    );
    expect(question.explanationI18n?.ja).toContain(
      "「わかっているわけがない」は理解している可能性を強く否定"
    );
    expect(question.explanationI18n?.ja).toContain(
      "「わかるどころではない」は理解を問題にできる状況ではない"
    );
    expect(question.explanationI18n?.ja).toContain(
      "「わかる必要はない」は理解の必要性を否定"
    );
    expect(question.explanationI18n?.ja).not.toContain("に違いない");
    expect(question.explanationI18n?.ja).not.toContain("ということだ");
    expect(question.explanationI18n?.en).toContain(
      "the speaker directly states their current level of understanding"
    );
    expect(question.explanationI18n?.en).toContain(
      "「わかっているわけがない」 strongly denies the possibility of understanding"
    );
    expect(question.explanationI18n?.en).toContain(
      "「わかるどころではない」 says the situation is nowhere near one in which understanding can be discussed"
    );
    expect(question.explanationI18n?.en).toContain(
      "「わかる必要はない」 denies any need to understand"
    );
    expect(question.explanationI18n?.en).not.toContain("に違いない");
    expect(question.explanationI18n?.en).not.toContain("ということだ");
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

  it("locks the visible multi-decade trend that excludes the onset reading かけている", () => {
    const question = findQuestion(n2Items, "n2-grammar-tsutsuaru");

    expect(question.promptText).toBe(
      "ここ数十年、地球の平均気温は一貫して上昇し ___ 。"
    );
    expect(question.options).toContain("かけている");
    expect(question.explanation).toContain(
      "「上昇しかけている」表示上升才剛開始或尚未完成"
    );
    expect(question.explanationI18n?.ja).toContain(
      "「上昇しかけている」は上昇が始まった直後、またはまだ完了していない段階"
    );
    expect(question.explanationI18n?.ja).toContain(
      "「ながら」は後ろに文が続く形なので、文末では使えません"
    );
    expect(question.explanationI18n?.en).toContain(
      "「上昇しかけている」 describes a rise at its onset or before completion"
    );
  });

  it("locks the human-reviewed homework contrast in every launched locale", () => {
    const question = findQuestion(n2Items, "n2-grammar-dokoroka");

    expect(question.promptText).toBe("宿題は終わる ___ 、まだ半分もやっていない。");
    expect(question.expectedAnswers).toEqual(["どころか"]);
    expect(question.promptContextZh).toBe("別說寫完了，作業連一半都還沒做。");
    expect(question.promptContextI18n?.ja).toBe(
      "宿題は終わるどころか、まだ半分もやっていません。"
    );
    expect(question.promptContextI18n?.en).toBe(
      "Far from finishing the homework, I haven't even done half of it."
    );
    expect(question.explanation).toContain(
      "本句並非已寫完作業，實際上甚至連一半都沒寫。"
    );
    expect(question.explanationI18n?.ja).toContain(
      "この文では宿題が終わったのではなく、実際には半分さえ終わっていません。"
    );
    expect(question.explanationI18n?.en).toContain(
      "Here the homework is not finished; in fact, not even half is done."
    );
    expect(question.vocabulary.meaningI18n?.ja).not.toContain("Aはもちろん");
    expect(question.explanationI18n?.ja).not.toContain("Aはもちろん");
    expect(question.hintZh).toBeTruthy();
    expect(question.hintI18n?.ja).toBeTruthy();
    expect(question.hintI18n?.en).toBeTruthy();
  });
});
