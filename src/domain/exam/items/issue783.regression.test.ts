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

  it("defines といったところだ as an approximate quantity or degree", () => {
    const question = findQuestion(n1Items, "n1-grammar-toittatokoroda-2");

    expect(question.vocabulary.meaningZh).toBe("大致是……的程度");
    expect(question.vocabulary.meaningI18n).toEqual({
      ja: "おおよそ…ぐらいの程度",
      en: "roughly about...; around the level of..."
    });
  });

  it("uses four grammatical scalar claims with one answer at the recorded 48 percent", () => {
    const question = findQuestion(n1Items, "n1-grammar-toittatokoroda-2");

    expect(question.promptText).toBe(
      "作業記録では、全工程の48％が完了している。この作業の進捗は現在、___ 。"
    );
    expect(question.promptContextZh).toBe(
      "作業記錄顯示全工程已完成48％；這項作業目前大致進行到一半。"
    );
    expect(question.promptContextI18n?.ja).toBe(
      "作業記録では、全工程の48％が完了している。この作業の進捗は現在、半分といったところだ。"
    );
    expect(question.promptContextI18n?.en).toBe(
      "The work record shows that 48% of the entire process is complete. The work is currently at roughly the halfway point."
    );
    expect(question.expectedAnswers).toEqual(["半分といったところだ"]);
    expect(question.options).toEqual([
      "半分といったところだ",
      "半分を優に超えている",
      "半分には遠く及ばない",
      "ちょうど半分に達している"
    ]);
    expect(question.hintZh).toBe(
      "記錄中的完成率是48％；請比較各選項所表示的比例方向與幅度。"
    );
    expect(question.hintI18n?.ja).toBe(
      "記録上の完了率は48％です。各選択肢が示す割合の方向と幅を比べましょう。"
    );
    expect(question.hintI18n?.en).toBe(
      "The recorded completion rate is 48%. Compare the direction and magnitude expressed by each option."
    );
    expect(question.explanation).toBe(
      "「N＋といったところだ」把數量或程度概括為「大致是 N 左右」。記錄中的完成率是48％，只比一半少2個百分點，因此「半分といったところだ」能自然地把目前進度概括為大約一半。「半分を優に超えている」表示明顯超過一半；「半分には遠く及ばない」表示離一半還很遠；「ちょうど半分に達している」表示正好達到50％。三者都與記錄中的48％不符。"
    );
    expect(question.explanationI18n?.ja).toBe(
      "「N＋といったところだ」は、数量や程度を「おおよそNぐらい」とまとめて述べる表現です。記録上の完了率は48％で、半分との差は2ポイントしかないため、「半分といったところだ」が現在の進捗をおおよそ半分と自然にまとめています。「半分を優に超えている」は半分を明らかに上回ること、「半分には遠く及ばない」は半分から大きく隔たっていること、「ちょうど半分に達している」は正確に50％に達していることを表します。いずれも記録の48％とは合いません。"
    );
    expect(question.explanationI18n?.en).toBe(
      "「N＋といったところだ」 summarizes a quantity or degree as being roughly around N. The recorded completion rate is 48%, only two percentage points below half, so 「半分といったところだ」 naturally summarizes the current progress as around halfway. 「半分を優に超えている」 means well over half, 「半分には遠く及ばない」 means far short of half, and 「ちょうど半分に達している」 means reaching exactly 50%. Each contradicts the recorded 48%."
    );
    expect(question.promptText).not.toContain("おおまか");
    expect(question.hintZh).not.toMatch(/大致|大約|左右/);
    expect(question.hintI18n?.ja).not.toMatch(/おおよそ|ぐらい|といったところ/);
    expect(question.hintI18n?.en).not.toMatch(/rough|about|approximately/i);
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
    expect(question.vocabulary.meaningZh).toBe(
      "非但不是 A，反而 B；或不只 A，甚至連 B 也……"
    );
    expect(question.vocabulary.meaningI18n?.ja).toBe(
      "AではなくむしろB／Aだけでなく、さらにBまで"
    );
    expect(question.vocabulary.meaningI18n?.en).toBe(
      "far from A, actually B; or not only A, but even B"
    );
    expect(question.explanation).toContain("本句的「AどころかB」否定 A");
    expect(question.explanationI18n?.ja).toContain("この文の「AどころかB」はAを否定し");
    expect(question.explanationI18n?.en).toContain(
      "In this sentence, 「A どころか B」 rejects A"
    );
    expect(question.explanation).toContain("先承認 A 成立，再追加 B");
    expect(question.explanationI18n?.ja).toContain(
      "Aが成立することを保ったままBを加える"
    );
    expect(question.explanationI18n?.en).toContain("preserve A as true and add B");
    expect(question.explanation).not.toContain("「A どころか B」會把 A 明確否定");
    expect(question.explanationI18n?.ja).not.toContain("「AどころかB」はAをはっきり否定");
    expect(question.explanationI18n?.en).not.toContain(
      "「A どころか B」 explicitly rejects A"
    );
    expect(question.hintZh).toBeTruthy();
    expect(question.hintI18n?.ja).toBeTruthy();
    expect(question.hintI18n?.en).toBeTruthy();
  });
});
