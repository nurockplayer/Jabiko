import { describe, expect, it } from "vitest";
import type { PracticeQuestion } from "../../types";
import { n1Items } from "./n1";

function findQuestion(items: PracticeQuestion[], id: string): PracticeQuestion {
  const question = items.find((item) => item.id === id);
  if (!question) throw new Error(`Missing exam question: ${id}`);
  return question;
}

describe("issue #784 vocabulary feedback regressions", () => {
  it("keeps the person without cash distinct from the person advancing payment", () => {
    const question = findQuestion(n1Items, "n1-usage-tatekaeru");
    const answer =
      "田中さんは今、手持ちがないそうなので、飲み会の代金はとりあえず私が立て替えておく。";

    expect(question.expectedAnswers).toEqual([answer]);
    expect(question.options).toContain(answer);
    expect(question.explanation).toContain("代墊者與缺錢者是不同的人");
    expect(question.explanationI18n?.ja).toContain(
      "手持ちがない人と立て替える人は別です"
    );
    expect(question.explanationI18n?.en).toContain(
      "the person without money and the person advancing it are different people"
    );
    expect(question.vocabulary.examples[0]?.japanese).toBe(answer);
  });
});
