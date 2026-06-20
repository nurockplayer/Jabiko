import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedbackPanel } from "./FeedbackPanel";
import { buildQuestionPool } from "../domain/practice";
import { jlptVocabulary } from "../domain/vocabulary-jlpt";
import { examStyleQuestions } from "../domain/examBlocks";
import { lookupWordsByReading } from "../domain/readingLookup";
import { lookupPatternMeaning } from "../domain/patternMeaning";

const readingPool = buildQuestionPool(jlptVocabulary, {
  partOfSpeech: "mixed",
  verbGroup: "all",
  targetForms: ["reading"]
});

describe("FeedbackPanel distractor gloss", () => {
  it("lists each reading distractor with the word it reads, and marks non-existent readings", () => {
    const question = readingPool[0];
    const answer = question.expectedAnswers[0];
    const realDistractor = readingPool
      .map((q) => q.expectedAnswers[0])
      .find((reading) => reading !== answer)!;
    const fakeDistractor = "ぜったいにそんざいしないよみ";
    const realWords = lookupWordsByReading(realDistractor);

    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question }}
        language="zh-Hant"
        options={[answer, realDistractor, fakeDistractor]}
      />
    );

    const gloss = container.querySelector(".distractor-gloss");
    expect(gloss).not.toBeNull();
    const text = gloss?.textContent ?? "";
    expect(text).toContain("其他選項");
    // Real distractor reading shows the word it reads...
    expect(realWords.length).toBeGreaterThan(0);
    expect(text).toContain(`${realDistractor}（${realWords[0]}`);
    // ...the made-up reading is marked as having no word...
    expect(text).toContain("無對應詞");
    // ...and the correct answer is not listed among the distractors.
    expect(text).not.toContain(`${answer}（`);
  });

  it("glosses grammar distractors with each pattern's meaning (not 無對應詞)", () => {
    // Grammar items default targetForm to "reading", so this also guards
    // against the reading-gloss path firing for them.
    const grammarItems = examStyleQuestions.filter((q) => q.promptLabel === "文法形式選擇");
    const question = grammarItems[0];
    const answer = question.expectedAnswers[0];
    // Another grammar item's answer is a distractor the bank can gloss.
    const other = grammarItems.find((g) => g.expectedAnswers[0] !== answer)!;
    const distractor = other.expectedAnswers[0];
    const meaning = lookupPatternMeaning(distractor);

    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question }}
        language="zh-Hant"
        options={[answer, distractor]}
      />
    );

    const gloss = container.querySelector(".distractor-gloss");
    expect(gloss).not.toBeNull();
    const text = gloss?.textContent ?? "";
    expect(meaning).not.toBeNull();
    expect(text).toContain(`${distractor}（${meaning}`);
    // Grammar patterns are real, so they must never be marked 無對應詞.
    expect(text).not.toContain("無對應詞");
  });

  it("renders no distractor gloss for non-reading questions", () => {
    const question = { ...readingPool[0], targetForm: "te" as const };
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question }}
        language="zh-Hant"
        options={["a", "b", "c"]}
      />
    );
    expect(container.querySelector(".distractor-gloss")).toBeNull();
  });
});
