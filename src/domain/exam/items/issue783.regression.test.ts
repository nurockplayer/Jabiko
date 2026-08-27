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

  it("requires a direct self-assessment instead of continuation-only elimination for といったところだ", () => {
    const question = findQuestion(n1Items, "n1-grammar-toittatokoroda-2");

    expect(question.promptText).toBe(
      "新しい仕事の内容を自分ではどの程度理解できているかと聞かれたが、正直なところ、ようやく半分 ___ 。"
    );
    expect(question.promptContextZh).toBe(
      "被問到自己覺得目前理解新工作內容到什麼程度；老實說，也才好不容易懂了大約一半。"
    );
    expect(question.promptContextI18n?.ja).toBe(
      "新しい仕事の内容を自分ではどの程度理解できているかと聞かれたが、正直なところ、ようやく半分わかってきたといったところだ。"
    );
    expect(question.promptContextI18n?.en).toBe(
      "When asked how much of the new job I felt I currently understood, honestly, I'd only just gotten the hang of about half of it."
    );
    expect(question.expectedAnswers).toEqual(["わかってきたといったところだ"]);
    expect(question.options).toEqual([
      "わかってきたといったところだ",
      "わかってきたことにしている",
      "わかってきたことになっている",
      "わかってきたと上司からは評価されている"
    ]);
    expect(question.options?.every((option) => option.startsWith("わかってきた"))).toBe(true);
    expect(question.explanation).toContain("自分ではどの程度");
    expect(question.explanation).toContain("わかってきたことにしている");
    expect(question.explanation).toContain("わかってきたことになっている");
    expect(question.explanation).toContain("わかってきたと上司からは評価されている");
    expect(question.explanationI18n?.ja).toContain("自分ではどの程度");
    expect(question.explanationI18n?.ja).toContain("わかってきたことにしている");
    expect(question.explanationI18n?.ja).toContain("わかってきたことになっている");
    expect(question.explanationI18n?.ja).toContain("わかってきたと上司からは評価されている");
    expect(question.explanationI18n?.en).toContain("self-assessment");
    expect(question.explanationI18n?.en).toContain("わかってきたことにしている");
    expect(question.explanationI18n?.en).toContain("わかってきたことになっている");
    expect(question.explanationI18n?.en).toContain("わかってきたと上司からは評価されている");
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
