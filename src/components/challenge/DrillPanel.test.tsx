import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DrillPanel } from "./DrillPanel";
import { FuriganaContext } from "../furiganaContext";
import type { Attempt, PracticeQuestion } from "../../domain/types";
import type { Language } from "../../i18n";
import { buildQuestionPool } from "../../domain/practice";
import { jlptVocabulary } from "../../domain/vocabulary-jlpt";

const question: PracticeQuestion = {
  id: "kaku:te",
  vocabulary: {
    id: "kaku",
    surface: "書く",
    reading: "かく",
    meaningZh: "寫",
    meaningI18n: { en: "to write", ja: "文字や文章をしるすこと" },
    partOfSpeech: "verb",
    group: "godan",
    lesson: null,
    tags: [],
    examples: []
  },
  targetForm: "te",
  expectedAnswers: ["書いて"],
  explanation: "一類動詞的て形會產生音便。"
};

const baseProps = {
  questionIndex: 0,
  sessionTotal: null,
  selectedChoice: null,
  feedback: null,
  attempts: [] as Attempt[],
  practiceMode: "basic" as const,
  currentQuestion: question as PracticeQuestion | null,
  isRecallQuestion: false,
  reviewEmpty: false,
  bookmarksEmpty: false,
  sessionExhausted: false,
  choiceOptions: ["書いて", "書いた", "書かない", "書きます"],
  correctCount: 0,
  accuracy: 0,
  sessionSeed: 0,
  nextButtonRef: { current: null },
  setPracticeMode: vi.fn(),
  setPracticeFilter: vi.fn(),
  handleChoiceSubmit: vi.fn(),
  nextQuestion: vi.fn(),
  resetSession: vi.fn(),
  revealAnswer: vi.fn(),
  handleDrillKeyDown: vi.fn(),
  isQuestionBookmarked: () => false,
  onToggleBookmark: vi.fn(),
  onExit: vi.fn()
};

let speechTestNow = Date.UTC(2100, 0, 1);

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderPanel(language: Language) {
  return render(<DrillPanel {...baseProps} language={language} />);
}

function makeAttempts(total: number, correct: number): Attempt[] {
  return Array.from({ length: total }, (_, i) => ({
    vocabularyId: "kaku",
    targetForm: "te",
    prompt: "書く",
    expectedAnswers: ["書いて"],
    submittedAnswer: "書いて",
    isCorrect: i < correct,
    timestamp: 0,
    responseTimeMs: 0
  }));
}

function renderDone(opts: {
  language?: Language;
  total: number;
  correct: number;
  accuracy: number;
  sessionSeed?: number;
  onOpenFeedback?: () => void;
}) {
  const { language = "zh-Hant", total, correct, accuracy, sessionSeed = 0, onOpenFeedback } = opts;
  return render(
    <DrillPanel
      {...baseProps}
      language={language}
      currentQuestion={null}
      sessionExhausted
      attempts={makeAttempts(total, correct)}
      correctCount={correct}
      accuracy={accuracy}
      sessionSeed={sessionSeed}
      onOpenFeedback={onOpenFeedback}
    />
  );
}

describe("DrillPanel", () => {
  it("renders, focuses, and submits a semantic recall field instead of choice options", () => {
    const handleChoiceSubmit = vi.fn();
    render(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        isRecallQuestion
        handleChoiceSubmit={handleChoiceSubmit}
      />
    );

    const input = screen.getByRole("textbox", { name: "輸入變化後的日文" });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("lang", "ja");
    expect(screen.getByRole("button", { name: "送出答案" })).toHaveAttribute(
      "type",
      "submit"
    );
    expect(screen.queryByRole("group", { name: "答案選項" })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "書いて" } });
    fireEvent.click(screen.getByRole("button", { name: "送出答案" }));
    expect(handleChoiceSubmit).toHaveBeenCalledWith("書いて");
  });

  it("starts each pass with an empty recall field when the first question is unchanged", () => {
    const { rerender } = render(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        isRecallQuestion
        sessionSeed={3}
      />
    );
    fireEvent.change(screen.getByRole("textbox", { name: "輸入變化後的日文" }), {
      target: { value: "書いて" }
    });

    rerender(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        isRecallQuestion
        sessionSeed={4}
      />
    );

    expect(screen.getByRole("textbox", { name: "輸入變化後的日文" })).toHaveValue("");
  });

  it("prevents IME composition Enter from submitting the recall form", () => {
    const handleChoiceSubmit = vi.fn();
    render(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        isRecallQuestion
        handleChoiceSubmit={handleChoiceSubmit}
      />
    );
    const input = screen.getByRole("textbox", { name: "輸入變化後的日文" });
    fireEvent.change(input, { target: { value: "書い" } });

    const allowed = fireEvent.keyDown(input, { key: "Enter", isComposing: true });

    expect(allowed).toBe(false);
    expect(handleChoiceSubmit).not.toHaveBeenCalled();
  });

  it("sends the canonical kana payload for each reported vocabulary reading", () => {
    vi.useFakeTimers();
    speechTestNow += 1_000;
    vi.setSystemTime(speechTestNow);
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [],
      speak,
      cancel: () => {},
      speaking: false,
      pending: false
    });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        constructor(public text: string) {}
        lang = "";
        rate = 1;
        addEventListener() {}
      }
    );
    const readings = [
      ["n3-履歴書", "りれきしょ"],
      ["n1-把持", "はじ"]
    ] as const;

    for (const [id, expectedReading] of readings) {
      const vocabulary = jlptVocabulary.find((item) => item.id === id)!;
      const readingQuestion = buildQuestionPool([vocabulary], {
        partOfSpeech: "mixed",
        verbGroup: "all",
        targetForms: ["reading"]
      })[0]!;
      const { unmount } = render(
        <DrillPanel {...baseProps} language="zh-Hant" currentQuestion={readingQuestion} />
      );
      fireEvent.click(screen.getByRole("button", { name: "朗讀日文" }));
      unmount();
      vi.advanceTimersByTime(130);
      expect((speak.mock.calls.at(-1)![0] as { text: string }).text).toBe(expectedReading);
    }

    expect(speak).toHaveBeenCalledTimes(readings.length);
  });

  it("sends canonical kana when reviewing the meaning of each reported vocabulary item", () => {
    vi.useFakeTimers();
    speechTestNow += 1_000;
    vi.setSystemTime(speechTestNow);
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [],
      speak,
      cancel: () => {},
      speaking: false,
      pending: false
    });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        constructor(public text: string) {}
        lang = "";
        rate = 1;
        addEventListener() {}
      }
    );
    const readings = [
      ["n3-履歴書", "りれきしょ"],
      ["n1-把持", "はじ"]
    ] as const;

    for (const [id, expectedReading] of readings) {
      const vocabulary = jlptVocabulary.find((item) => item.id === id)!;
      const meaningQuestion = buildQuestionPool([vocabulary], {
        partOfSpeech: "mixed",
        verbGroup: "all",
        targetForms: ["meaning"]
      })[0]!;
      const { unmount } = render(
        <DrillPanel {...baseProps} language="zh-Hant" currentQuestion={meaningQuestion} />
      );
      fireEvent.click(screen.getByRole("button", { name: "朗讀日文" }));
      unmount();
      vi.advanceTimersByTime(130);
      expect((speak.mock.calls.at(-1)![0] as { text: string }).text).toBe(expectedReading);
    }

    expect(speak).toHaveBeenCalledTimes(readings.length);
  });

  it("localizes the pre-answer meaning gloss (#427)", () => {
    renderPanel("en");
    expect(screen.getByText("to write")).toBeInTheDocument();
    expect(screen.queryByText("寫")).not.toBeInTheDocument();
  });

  it("keeps the zh gloss for zh-Hant", () => {
    renderPanel("zh-Hant");
    expect(screen.getByText("寫")).toBeInTheDocument();
  });

  it("keeps localized meaning choices plain even when the same Hanzi has Japanese ruby data", () => {
    const meaningQuestion: PracticeQuestion = {
      ...question,
      targetForm: "meaning",
      expectedAnswers: ["水"],
      vocabulary: { ...question.vocabulary, surface: "水", reading: "みず", meaningZh: "水" }
    };

    render(
      <FuriganaContext.Provider value={{ enabled: true }}>
        <DrillPanel {...baseProps} language="zh-Hant" currentQuestion={meaningQuestion} choiceOptions={["水"]} />
      </FuriganaContext.Provider>
    );

    expect(screen.getByRole("button", { name: /水/ }).querySelector("rt")).toBeNull();
  });

  describe("session-complete card", () => {
    it("shows glanceable stat tiles for the finished session", () => {
      renderDone({ total: 5, correct: 4, accuracy: 80 });
      expect(screen.getByText("已答")).toBeInTheDocument();
      expect(screen.getByText("正解率")).toBeInTheDocument();
      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("moves the share panel onto the completion card", () => {
      renderDone({ total: 5, correct: 4, accuracy: 80 });
      expect(screen.getByRole("button", { name: "Facebook" })).toBeInTheDocument();
    });

    it("celebrates a flawless run with the perfect badge", () => {
      renderDone({ total: 5, correct: 5, accuracy: 100 });
      expect(screen.getByText("全部答對")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("hides the perfect badge when at least one answer was wrong", () => {
      renderDone({ total: 5, correct: 4, accuracy: 80 });
      expect(screen.queryByText("全部答對")).not.toBeInTheDocument();
    });

    it("surfaces a feedback entry that fires the handler when provided", async () => {
      const onOpenFeedback = vi.fn();
      renderDone({ total: 5, correct: 4, accuracy: 80, onOpenFeedback });
      const button = screen.getByRole("button", { name: "意見回饋" });
      const user = userEvent.setup();
      await user.click(button);
      expect(onOpenFeedback).toHaveBeenCalledTimes(1);
    });

    it("omits the feedback entry when no handler is wired", () => {
      renderDone({ total: 5, correct: 4, accuracy: 80 });
      expect(screen.queryByRole("button", { name: "意見回饋" })).not.toBeInTheDocument();
    });
  });

  // #473: after answering, FeedbackPanel must sit immediately AFTER the word
  // block and BEFORE the choice grid (prompt header → word block → feedback
  // → choice grid → action row), so a phone learner can compare the answer
  // and explanation without scrolling back up. The pre-answer DOM is
  // unchanged (no feedback at all), and the same order is used on every
  // viewport -- only CSS may tune spacing.
  describe("post-answer feedback ordering (#473)", () => {
    const questionWithExample: PracticeQuestion = {
      ...question,
      vocabulary: {
        ...question.vocabulary,
        examples: [{ japanese: "毎朝、パンを食べます。", meaningZh: "每天早上吃麵包。" }]
      }
    };

    const answeredCorrect = {
      selectedChoice: "書いて",
      feedback: { status: "correct", question: questionWithExample, submittedAnswer: "書いて" }
    } as const;
    const answeredIncorrect = {
      selectedChoice: "書いた",
      feedback: { status: "incorrect", question: questionWithExample, submittedAnswer: "書いた" }
    } as const;
    const revealed = {
      selectedChoice: null,
      feedback: { status: "revealed", question: questionWithExample, submittedAnswer: null }
    } as const;

    function renderAnswered(overrides: Partial<ComponentProps<typeof DrillPanel>> = {}) {
      return render(<DrillPanel {...baseProps} language="zh-Hant" {...overrides} />);
    }

    // Direct child classes of .drill-panel in document order. FeedbackPanel's
    // root section is `.feedback <status>`, so its first class is "feedback".
    function childBlocks(container: HTMLElement): string[] {
      return Array.from(container.querySelectorAll(".drill-panel > *")).map((el) =>
        (el as HTMLElement).className.split(" ")[0]
      );
    }

    it("keeps word-block directly above choice-grid with no feedback before answering", () => {
      const { container } = renderAnswered();
      expect(container.querySelector(".drill-panel .feedback")).toBeNull();
      const blocks = childBlocks(container);
      expect(blocks.indexOf("choice-grid")).toBe(blocks.indexOf("word-block") + 1);
      // Bookmark / report entries live on the feedback panel only -- nothing
      // post-answer leaks into the pre-answer view.
      expect(screen.queryByRole("button", { name: "收藏此題" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "回報此題" })).not.toBeInTheDocument();
    });

    it.each([
      ["correct", answeredCorrect, "正解"],
      ["incorrect", answeredIncorrect, "再想一下"],
      ["revealed", revealed, "先記這題"]
    ] as const)(
      "orders word-block → feedback → choice-grid → action-row when %s",
      (_label, { selectedChoice, feedback }, title) => {
        const { container } = renderAnswered({ selectedChoice, feedback });
        const blocks = childBlocks(container);
        const word = blocks.indexOf("word-block");
        const fb = blocks.indexOf("feedback");
        const grid = blocks.indexOf("choice-grid");
        const action = blocks.indexOf("action-row");
        expect(word).toBeGreaterThanOrEqual(0);
        expect(fb).toBe(word + 1);
        expect(grid).toBe(fb + 1);
        expect(action).toBe(grid + 1);
        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      }
    );

    it("still shows the answer, reading, example, explanation, bookmark and report entries", () => {
      const { container } = renderAnswered(answeredIncorrect);
      // Learner's pick, correct answer, and explanation all visible.
      expect(container.querySelector(".your-answer")?.textContent).toContain("你選的");
      expect(container.querySelector(".your-answer")?.textContent).toContain("書いた");
      expect(screen.getByText("正解：書いて")).toBeInTheDocument();
      expect(screen.getByText("一類動詞的て形會產生音便。")).toBeInTheDocument();
      // Example sentence + translation.
      expect(screen.getByText("毎朝、パンを食べます。")).toBeInTheDocument();
      expect(screen.getByText("每天早上吃麵包。")).toBeInTheDocument();
      // Bookmark + report entry points (in-app feedback #456 / #470).
      expect(screen.getByRole("button", { name: "收藏此題" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "回報此題" })).toBeInTheDocument();
    });

    it("disables the choices and keeps selected/result data attributes after answering", () => {
      const { container } = renderAnswered(answeredIncorrect);
      const grid = container.querySelector(".choice-grid")!;
      const options = Array.from(grid.querySelectorAll("button"));
      options.forEach((button) => expect(button).toBeDisabled());
      // The picked (wrong) option carries data-selected + data-result="wrong".
      const wrong = grid.querySelectorAll('button[data-result="wrong"]');
      expect(wrong).toHaveLength(1);
      expect(wrong[0].textContent).toBe("書いた");
      expect(wrong[0]).toHaveAttribute("data-selected", "true");
      // The correct answer is flagged as the target.
      const target = grid.querySelectorAll('button[data-result="target"]');
      expect(target).toHaveLength(1);
      expect(target[0].textContent).toBe("書いて");
    });

    it("flags only the correct answer (as target) on a reveal, with no selection", () => {
      const { container } = renderAnswered(revealed);
      const grid = container.querySelector(".choice-grid")!;
      const target = grid.querySelectorAll('button[data-result="target"]');
      expect(target).toHaveLength(1);
      expect(target[0].textContent).toBe("書いて");
      expect(grid.querySelector('button[data-selected="true"]')).toBeNull();
    });

    it("drops the feedback and re-enables the new question's choices on the next question", () => {
      const { container, rerender } = renderAnswered(answeredCorrect);
      expect(container.querySelector(".feedback")).not.toBeNull();
      rerender(
        <DrillPanel
          {...baseProps}
          language="zh-Hant"
          selectedChoice={null}
          feedback={null}
          currentQuestion={{
            ...question,
            id: "kiku:te",
            vocabulary: { ...question.vocabulary, id: "kiku", surface: "聞く", reading: "きく", meaningZh: "聽" }
          }}
          choiceOptions={["聞いて", "聞いた", "聞かない", "聞きます"]}
        />
      );
      expect(container.querySelector(".feedback")).toBeNull();
      const grid = container.querySelector(".choice-grid")!;
      Array.from(grid.querySelectorAll("button")).forEach((button) =>
        expect(button).not.toBeDisabled()
      );
    });

    it("uses the same DOM order at mobile and desktop widths (CSS-only spacing)", () => {
      const original = window.innerWidth;
      try {
        window.innerWidth = 390;
        const mobile = renderAnswered(answeredCorrect);
        const mobileBlocks = childBlocks(mobile.container);
        expect(mobileBlocks).toEqual(["prompt-header", "word-block", "feedback", "choice-grid", "action-row"]);
        mobile.unmount();

        window.innerWidth = 1280;
        const desktop = renderAnswered(answeredCorrect);
        expect(childBlocks(desktop.container)).toEqual(mobileBlocks);
      } finally {
        window.innerWidth = original;
      }
    });

    it("never calls scrollIntoView or HTMLElement.focus when showing feedback", () => {
      const scrollSpy = vi.fn();
      const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
      if (!("scrollIntoView" in proto)) {
        Object.defineProperty(proto, "scrollIntoView", {
          configurable: true,
          writable: true,
          value: scrollSpy
        });
      }
      const focusSpy = vi.spyOn(window.HTMLElement.prototype, "focus");
      try {
        renderAnswered(answeredCorrect);
        expect(scrollSpy).not.toHaveBeenCalled();
        expect(focusSpy).not.toHaveBeenCalled();
      } finally {
        focusSpy.mockRestore();
      }
    });
  });
});
