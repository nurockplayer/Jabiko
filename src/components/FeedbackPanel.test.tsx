import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackPanel } from "./FeedbackPanel";
import { FuriganaContext } from "./furiganaContext";
import { buildQuestionPool } from "../domain/practice";
import { jlptVocabulary } from "../domain/vocabulary-jlpt";
import { examStyleQuestions } from "../domain/examBlocks";
import { buildSentencePatternPool } from "../domain/sentencePatterns";
import { lookupWordsByReading } from "../domain/readingLookup";
import { lookupPatternMeaning } from "../domain/patternMeaning";
import { grammarNotes } from "../domain/grammarNotes";
import { copy } from "../i18n";

// Capture the props QuestionReportForm is opened with, so we can assert the
// graded answer FeedbackPanel hands it comes from feedback.submittedAnswer
// (FIX 1, #299) rather than a separate live prop.
const reportFormProps = vi.hoisted(() => ({ current: null as { selectedAnswer: string | null } | null }));
vi.mock("./QuestionReportForm", () => ({
  QuestionReportForm: (props: { selectedAnswer: string | null }) => {
    reportFormProps.current = props;
    return <div data-testid="report-form-stub" data-selected={String(props.selectedAnswer)} />;
  }
}));

// The hoisted capture is shared across every test in this file; clear it before
// each test so a later assertion can't pass on a stale prop value (e.g. if a
// click stops mounting the form).
beforeEach(() => {
  reportFormProps.current = null;
});

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
        feedback={{ status: "incorrect", question, submittedAnswer: null }}
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
        feedback={{ status: "incorrect", question, submittedAnswer: null }}
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
        feedback={{ status: "incorrect", question, submittedAnswer: null }}
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
        feedback={{ status: "incorrect", question, submittedAnswer: null }}
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
        feedback={{ status: "incorrect", question: examItem, submittedAnswer: null }}
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
        feedback={{ status: "incorrect", question: noLevel, submittedAnswer: null }}
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
          feedback={{ status: "incorrect", question: testCase.question, submittedAnswer: null }}
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
        feedback={{ status: "incorrect", question, submittedAnswer: null }}
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
        feedback={{ status: "incorrect", question, submittedAnswer: null }}
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
        feedback={{ status: "incorrect", question, submittedAnswer: null }}
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
        feedback={{ status: "incorrect", question, submittedAnswer: null }}
        language="zh-Hant"
        options={[]}
      />
    );
    expect(container.querySelector(".grammar-note-block")).toBeNull();
  });
});

describe("FeedbackPanel grammar study link (#282)", () => {
  const grammarBase = examStyleQuestions.find((q) => q.promptLabel === "文法形式選擇")!;
  const linkName = copy["zh-Hant"].grammarStudyLink;

  it("links a grammar item to its study page, calling onOpenGrammar with the surface", () => {
    const onOpenGrammar = vi.fn();
    render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question: grammarBase, submittedAnswer: null }}
        language="zh-Hant"
        options={grammarBase.options ?? []}
        onOpenGrammar={onOpenGrammar}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: linkName }));
    expect(onOpenGrammar).toHaveBeenCalledWith(grammarBase.vocabulary.surface);
  });

  it("hides the link when no onOpenGrammar navigator is wired in", () => {
    render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question: grammarBase, submittedAnswer: null }}
        language="zh-Hant"
        options={grammarBase.options ?? []}
      />
    );
    expect(screen.queryByRole("button", { name: linkName })).toBeNull();
  });

  it("hides the link for a non-grammar (reading) item", () => {
    render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question: readingPool[0], submittedAnswer: null }}
        language="zh-Hant"
        options={[]}
        onOpenGrammar={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: linkName })).toBeNull();
  });

  it("hides the link for a grammar surface that has no study page", () => {
    const question = {
      ...grammarBase,
      vocabulary: { ...grammarBase.vocabulary, surface: "そんな文法点はないzzz" }
    };
    render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question, submittedAnswer: null }}
        language="zh-Hant"
        options={[]}
        onOpenGrammar={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: linkName })).toBeNull();
  });
});

describe("FeedbackPanel report-this-question entry (#299)", () => {
  it("shows a compact 'report this question' entry in the post-answer panel", () => {
    const question = readingPool[0];
    render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question, submittedAnswer: question.expectedAnswers[0] }}
        language="zh-Hant"
        options={question.expectedAnswers}
      />
    );
    expect(screen.getByRole("button", { name: "回報此題" })).toBeInTheDocument();
    // The report form is not mounted until the entry is clicked.
    expect(screen.queryByTestId("report-form-stub")).toBeNull();
  });

  it("opens the report form when the entry is clicked", () => {
    const question = readingPool[0];
    render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question, submittedAnswer: question.expectedAnswers[0] }}
        language="zh-Hant"
        options={question.expectedAnswers}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "回報此題" }));
    expect(screen.getByTestId("report-form-stub")).toBeInTheDocument();
  });

  it("hands the report the exact graded answer from feedback.submittedAnswer", () => {
    const question = readingPool[0];
    const graded = question.expectedAnswers[0];
    render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question, submittedAnswer: graded }}
        language="zh-Hant"
        options={question.expectedAnswers}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "回報此題" }));
    // Sourced from feedback.submittedAnswer, NOT a separate live prop.
    expect(reportFormProps.current?.selectedAnswer).toBe(graded);
  });

  it("hands the report null for a revealed/skipped question (no choice)", () => {
    const question = readingPool[0];
    render(
      <FeedbackPanel
        feedback={{ status: "revealed", question, submittedAnswer: null }}
        language="zh-Hant"
        options={question.expectedAnswers}
      />
    );
    expect(screen.getByRole("button", { name: "回報此題" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "回報此題" }));
    expect(reportFormProps.current?.selectedAnswer).toBeNull();
  });
});

describe("FeedbackPanel bookmark toggle (#470)", () => {
  const zh = copy["zh-Hant"];

  it("hides the star when no toggle handler is wired", () => {
    const question = readingPool[0];
    render(
      <FeedbackPanel
        feedback={{ status: "correct", question, submittedAnswer: question.expectedAnswers[0] }}
        language="zh-Hant"
        options={question.expectedAnswers}
      />
    );
    expect(screen.queryByRole("button", { name: zh.bookmarkAdd })).toBeNull();
    expect(screen.queryByRole("button", { name: zh.bookmarkRemove })).toBeNull();
  });

  it("shows the add label + calls the handler when not yet bookmarked", () => {
    const question = readingPool[0];
    const onToggleBookmark = vi.fn();
    render(
      <FeedbackPanel
        feedback={{ status: "correct", question, submittedAnswer: question.expectedAnswers[0] }}
        language="zh-Hant"
        options={question.expectedAnswers}
        bookmarked={false}
        onToggleBookmark={onToggleBookmark}
      />
    );
    const star = screen.getByRole("button", { name: zh.bookmarkAdd });
    expect(star).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(star);
    expect(onToggleBookmark).toHaveBeenCalledTimes(1);
  });

  it("shows the bookmarked (pressed) state when already starred", () => {
    const question = readingPool[0];
    render(
      <FeedbackPanel
        feedback={{ status: "correct", question, submittedAnswer: question.expectedAnswers[0] }}
        language="zh-Hant"
        options={question.expectedAnswers}
        bookmarked
        onToggleBookmark={() => {}}
      />
    );
    const star = screen.getByRole("button", { name: zh.bookmarkRemove });
    expect(star).toHaveAttribute("aria-pressed", "true");
  });
});

describe("FeedbackPanel localized explanation (#378)", () => {
  const base = {
    ...readingPool[0],
    explanation: "這題在問動詞的て形。",
    explanationI18n: { en: "This asks about the verb te-form." }
  };

  it("shows the zh-Hant explanation by default (source locale)", () => {
    render(
      <FeedbackPanel
        feedback={{ status: "correct", question: base, submittedAnswer: null }}
        language="zh-Hant"
        options={[]}
      />
    );
    expect(screen.getByText("這題在問動詞的て形。")).toBeInTheDocument();
  });

  it("shows the localized explanation when the language has an overlay entry", () => {
    render(
      <FeedbackPanel
        feedback={{ status: "correct", question: base, submittedAnswer: null }}
        language="en"
        options={[]}
      />
    );
    expect(screen.getByText("This asks about the verb te-form.")).toBeInTheDocument();
    expect(screen.queryByText("這題在問動詞的て形。")).toBeNull();
  });

  it("falls back to the zh source when the language has no overlay entry", () => {
    render(
      <FeedbackPanel
        feedback={{ status: "correct", question: base, submittedAnswer: null }}
        language="ja"
        options={[]}
      />
    );
    expect(screen.getByText("這題在問動詞的て形。")).toBeInTheDocument();
  });
});

describe("FeedbackPanel localized example translation (#400 follow-up)", () => {
  const base = readingPool[0];
  const question = {
    ...base,
    vocabulary: {
      ...base.vocabulary,
      examples: [
        {
          japanese: "毎朝、パンを食べます。",
          meaningZh: "每天早上吃麵包。",
          meaningI18n: { en: "I eat bread every morning." }
        }
      ]
    }
  };

  it("renders the post-answer example meaning in the active language via the overlay", () => {
    render(
      <FeedbackPanel
        feedback={{ status: "correct", question, submittedAnswer: null }}
        language="en"
        options={[]}
      />
    );
    expect(screen.getByText("I eat bread every morning.")).toBeInTheDocument();
    expect(screen.queryByText("每天早上吃麵包。")).toBeNull();
  });

  it("falls back to the zh example meaning when the locale has no overlay", () => {
    render(
      <FeedbackPanel
        feedback={{ status: "correct", question, submittedAnswer: null }}
        language="th"
        options={[]}
      />
    );
    expect(screen.getByText("每天早上吃麵包。")).toBeInTheDocument();
  });

  it("threads promptContextI18n onto every exam item's baked example (factory)", () => {
    // The factory bakes examples[0].meaningZh from promptContextZh when the item
    // has no custom exampleMeaningZh; the localized variant must ride along, or
    // en/ja users see Chinese on every post-answer example line.
    const q = examStyleQuestions.find(
      (x) =>
        x.promptContextZh &&
        x.vocabulary.examples[0]?.meaningZh === x.promptContextZh &&
        x.promptContextI18n?.en
    )!;
    expect(q).toBeDefined();
    expect(q.vocabulary.examples[0].meaningI18n?.en).toBe(q.promptContextI18n!.en);
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
          feedback={{ status: "correct", question, submittedAnswer: null }}
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
        feedback={{ status: "correct", question, submittedAnswer: null }}
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
          feedback={{ status: "correct", question: readingItem, submittedAnswer: null }}
          language="zh-Hant"
          options={[]}
        />
      </FuriganaContext.Provider>
    );
    const readings = Array.from(container.querySelectorAll(".example rt")).map((n) => n.textContent);
    expect(readings).toContain("がっこう");
  });
});

describe("FeedbackPanel vocab notes (#453)", () => {
  const base = readingPool[0];
  const withNotes = {
    ...base,
    vocabNotes: [
      {
        surface: "取引先",
        reading: "とりひきさき",
        meaningZh: "交易客戶、生意往來對象",
        meaningI18n: { ja: "取引先（ビジネスの相手）", en: "business client / trading partner" }
      }
    ]
  };

  it("renders each note's surface, reading, and zh meaning for zh-Hant", () => {
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "correct", question: withNotes, submittedAnswer: null }}
        language="zh-Hant"
        options={[]}
      />
    );
    const block = container.querySelector(".vocab-notes");
    expect(block).not.toBeNull();
    const text = block?.textContent ?? "";
    expect(text).toContain("取引先");
    expect(text).toContain("とりひきさき");
    expect(text).toContain("交易客戶、生意往來對象");
  });

  it("shows the localized meaning (never the zh source) for a non-zh language", () => {
    render(
      <FeedbackPanel
        feedback={{ status: "correct", question: withNotes, submittedAnswer: null }}
        language="en"
        options={[]}
      />
    );
    expect(screen.getByText(/business client \/ trading partner/)).toBeInTheDocument();
    // Language isolation: the Chinese gloss must not leak to an en learner.
    expect(screen.queryByText(/交易客戶/)).toBeNull();
  });

  it("renders nothing when the question has no vocab notes", () => {
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "correct", question: base, submittedAnswer: null }}
        language="zh-Hant"
        options={[]}
      />
    );
    expect(container.querySelector(".vocab-notes")).toBeNull();
  });
});

describe("FeedbackPanel your-answer line (#456)", () => {
  const q = readingPool[0];

  it("shows the learner's own submitted answer when incorrect", () => {
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "incorrect", question: q, submittedAnswer: "ふうして" }}
        language="zh-Hant"
        options={[]}
      />
    );
    const line = container.querySelector(".your-answer");
    expect(line).not.toBeNull();
    expect(line?.textContent).toContain("你選的");
    expect(line?.textContent).toContain("ふうして");
  });

  it("hides the your-answer line when the pick was correct", () => {
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "correct", question: q, submittedAnswer: "ふうじて" }}
        language="zh-Hant"
        options={[]}
      />
    );
    expect(container.querySelector(".your-answer")).toBeNull();
  });

  it("hides the your-answer line when revealed/skipped (no submitted answer)", () => {
    const { container } = render(
      <FeedbackPanel
        feedback={{ status: "revealed", question: q, submittedAnswer: null }}
        language="zh-Hant"
        options={[]}
      />
    );
    expect(container.querySelector(".your-answer")).toBeNull();
  });
});
