import { describe, expect, it } from "vitest";
import { examQuestion } from "./helpers";
import type { ExamQuestionInput } from "./types";

const base: ExamQuestionInput = {
  id: "test-item",
  level: "N1",
  surface: "テスト",
  reading: "てすと",
  meaningZh: "測試",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空。",
  promptText: "",
  promptContextZh: "",
  expectedAnswer: "",
  options: [],
  explanation: "説明"
};

describe("examQuestion example baking", () => {
  it("fills a single blank with the answer", () => {
    const q = examQuestion({ ...base, promptText: "彼は駅 ___ 行く。", expectedAnswer: "へ" });
    expect(q.vocabulary.examples[0].japanese).toBe("彼は駅 へ 行く。");
  });

  it("splits a paired 'A / B' answer across two blanks (no leftover ___, no slash)", () => {
    const q = examQuestion({
      ...base,
      promptText: "忙しい ___ 疲れた ___ と文句を言う。",
      expectedAnswer: "だの / だの",
      options: ["だの / だの", "なり / なり", "といい / といい", "につけ / につけ"]
    });
    const baked = q.vocabulary.examples[0].japanese;
    expect(baked).toBe("忙しい だの 疲れた だの と文句を言う。");
    expect(baked).not.toContain("___");
    expect(baked).not.toContain(" / ");
  });

  it("still honors an explicit exampleJapanese override", () => {
    const q = examQuestion({
      ...base,
      promptText: "a ___ b ___ c",
      expectedAnswer: "や / や",
      exampleJapanese: "手動の例文"
    });
    expect(q.vocabulary.examples[0].japanese).toBe("手動の例文");
  });
});
