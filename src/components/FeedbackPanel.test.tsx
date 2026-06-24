import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedbackPanel } from "./FeedbackPanel";
import { FuriganaContext } from "./Ruby";
import { buildQuestionPool } from "../domain/practice";
import { jlptVocabulary } from "../domain/vocabulary-jlpt";
import { examStyleQuestions } from "../domain/examBlocks";
import { buildSentencePatternPool } from "../domain/sentencePatterns";
import { lookupWordsByReading } from "../domain/readingLookup";
import { lookupPatternMeaning } from "../domain/patternMeaning";
import { grammarNotes } from "../domain/grammarNotes";

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

  it("renders each reading distractor on its own line (multiline, answer excluded)", () => {
    const question = readingPool[0];
    const answer = question.expectedAnswers[0];
    const distractors = Array.from(
      new Set(readingPool.map((q) => q.expectedAnswers[0]).filter((reading) => reading !== answer))
    ).slice(0, 2);

    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question }}
        language="zh-Hant"
        options={[answer, ...distractors]}
      />
    );

    // One <li> per distractor (each option on its own line), answer excluded.
    const items = container.querySelectorAll(".distractor-gloss-list li");
    expect(items).toHaveLength(distractors.length);
    items.forEach((li) => expect(li.textContent).not.toContain(`${answer}（`));
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

  it("tags the post-answer panel with the question's JLPT level, and hides it when absent", () => {
    const examItem = examStyleQuestions.find((q) => q.vocabulary.level === "N1")!;
    const { container, unmount } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question: examItem }}
        language="zh-Hant"
        options={examItem.options ?? []}
      />
    );
    expect(container.querySelector(".feedback-level")?.textContent).toBe("N1");
    unmount();

    // Basic/cloze items have no level -> no tag.
    const noLevel = {
      ...readingPool[0],
      vocabulary: { ...readingPool[0].vocabulary, level: undefined }
    };
    const { container: c2 } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question: noLevel }}
        language="zh-Hant"
        options={[]}
      />
    );
    expect(c2.querySelector(".feedback-level")).toBeNull();
  });

  it("shows a distractor gloss only for reading + grammar item types (gating matrix)", () => {
    const sample = (label: string) => examStyleQuestions.find((q) => q.promptLabel === label)!;
    const textGrammar = sample("文章脈絡");
    // Another grammar item's answer -> a distractor the bank can gloss.
    const grammarAnswer = examStyleQuestions.find(
      (q) => q.promptLabel === "文法形式選擇" && q.expectedAnswers[0] !== textGrammar.expectedAnswers[0]
    )!.expectedAnswers[0];
    const kanjiReading = sample("漢字読み");

    const cases = [
      // reading drills -> gloss shown (even a no-word reading is marked).
      { question: kanjiReading, options: [kanjiReading.expectedAnswers[0], "なにかのよみ"], gloss: true },
      // grammar form / text grammar -> gloss shown (distractor has a meaning).
      { question: textGrammar, options: [textGrammar.expectedAnswers[0], grammarAnswer], gloss: true },
      // these item types -> never a gloss (and never 無對應詞).
      { question: sample("語順組合"), options: ["a", "b"], gloss: false },
      { question: sample("詞彙填空"), options: ["a", "b"], gloss: false },
      { question: buildSentencePatternPool()[0], options: ["a", "b"], gloss: false }
    ];

    for (const testCase of cases) {
      const { container, unmount } = render(
        <FeedbackPanel
          feedback={{ status: "incorrect", question: testCase.question }}
          language="zh-Hant"
          options={testCase.options}
        />
      );
      const hasGloss = container.querySelector(".distractor-gloss") !== null;
      expect(hasGloss, `promptLabel=${testCase.question.promptLabel ?? "(none)"}`).toBe(testCase.gloss);
      unmount();
    }
  });
});

describe("FeedbackPanel grammar note (#137)", () => {
  const grammarBase = examStyleQuestions.find((q) => q.promptLabel === "文法形式選擇")!;
  // Override the surface so the lookup hit is independent of which exact
  // grammar items happen to be in the bank.
  const grammarWithSurface = (surface: string) => ({
    ...grammarBase,
    vocabulary: { ...grammarBase.vocabulary, surface }
  });

  it("shows a collapsed 看文法說明 entry for a grammar item whose point has a note", () => {
    const question = grammarWithSurface("ばかりに");
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question }}
        language="zh-Hant"
        options={question.options ?? []}
      />
    );
    const toggle = container.querySelector(".grammar-note-toggle");
    expect(toggle).not.toBeNull();
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    // Collapsed by default -> the note card is not rendered yet.
    expect(container.querySelector(".grammar-note")).toBeNull();
  });

  it("expands the note on click, showing the point's meaning", () => {
    const question = grammarWithSurface("ばかりに");
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question }}
        language="zh-Hant"
        options={question.options ?? []}
      />
    );
    fireEvent.click(container.querySelector(".grammar-note-toggle")!);
    const note = container.querySelector(".grammar-note");
    expect(note).not.toBeNull();
    expect(container.querySelector(".grammar-note-toggle")?.getAttribute("aria-expanded")).toBe("true");
    expect(note?.textContent).toContain(grammarNotes["ばかりに"].meaningZh);
  });

  it("hides the entry for a grammar point with no note yet (no error)", () => {
    const question = grammarWithSurface("そんな文法点はない");
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question }}
        language="zh-Hant"
        options={question.options ?? []}
      />
    );
    expect(container.querySelector(".grammar-note-block")).toBeNull();
  });

  it("does not show the entry for non-grammar items even if the surface collides", () => {
    // A reading drill (no grammar promptLabel) whose surface happens to be a
    // noted point must NOT surface the grammar-note entry.
    const question = {
      ...readingPool[0],
      vocabulary: { ...readingPool[0].vocabulary, surface: "ばかりに" }
    };
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question }}
        language="zh-Hant"
        options={[]}
      />
    );
    expect(container.querySelector(".grammar-note-block")).toBeNull();
  });
});

describe("FeedbackPanel furigana (#134)", () => {
  // Override the example with a pre-baked sentence (学校 -> がっこう) so the
  // ruby path has data. The feedback example is POST-answer, so it shows
  // furigana even for a reading item -- it reinforces the reading, it can't
  // leak the answer the learner already gave.
  const SENTENCE = "ここは学校だ。";
  const question = {
    ...readingPool[0],
    vocabulary: {
      ...readingPool[0].vocabulary,
      examples: [{ japanese: SENTENCE, meaningZh: "這裡是學校。" }]
    }
  };

  it("renders ruby on the example sentence when furigana is on", () => {
    const { container } = render(
      <FuriganaContext.Provider value={{ enabled: true }}>
        <FeedbackPanel
          feedback={{ status: "correct", question }}
          language="zh-Hant"
          options={[]}
        />
      </FuriganaContext.Provider>
    );
    const readings = Array.from(container.querySelectorAll(".example rt")).map((n) => n.textContent);
    expect(readings).toContain("がっこう");
  });

  it("renders a plain example sentence when furigana is off (default)", () => {
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "correct", question }}
        language="zh-Hant"
        options={[]}
      />
    );
    expect(container.querySelector(".example rt")).toBeNull();
    expect(container.querySelector(".example")?.textContent).toContain(SENTENCE);
  });

  it("shows ruby on the POST-answer example even for a 漢字読み reading item (intentional: no leak after answering)", () => {
    // The reading-item guard suppresses furigana on the PROMPT (ExamPrompt),
    // never here: the feedback example is shown after the learner has already
    // answered, so reinforcing the reading can't leak anything.
    const readingItem = {
      ...question,
      promptLabel: "漢字読み",
      targetForm: "reading" as const
    };
    const { container } = render(
      <FuriganaContext.Provider value={{ enabled: true }}>
        <FeedbackPanel
          feedback={{ status: "correct", question: readingItem }}
          language="zh-Hant"
          options={[]}
        />
      </FuriganaContext.Provider>
    );
    const readings = Array.from(container.querySelectorAll(".example rt")).map((n) => n.textContent);
    expect(readings).toContain("がっこう");
  });
});
