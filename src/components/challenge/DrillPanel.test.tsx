import type { ComponentProps, KeyboardEvent as ReactKeyboardEvent } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DrillPanel } from "./DrillPanel";
import { usePracticeSession } from "../../hooks/usePracticeSession";
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

beforeEach(() => {
  window.localStorage.clear();
});

function renderPanel(language: Language) {
  return render(<DrillPanel {...baseProps} language={language} />);
}

function makeAttempts(total: number, correct: number): Attempt[] {
  return Array.from({ length: total }, (_, i) => ({
    questionId: question.id,
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
  function renderLiveDrillPanel(mode: "basic" | "daily" = "basic") {
    let session: ReturnType<typeof usePracticeSession> | undefined;

    function Harness() {
      session = usePracticeSession({
        language: "zh-Hant",
        init:
          mode === "basic"
            ? { mode, partOfSpeech: "verb", verbGroup: "godan", targetForm: "te" }
            : { mode },
        progressAttempts: [],
        recordAttempt: vi.fn()
      });
      return <DrillPanel {...session} language="zh-Hant" onExit={vi.fn()} />;
    }

    const view = render(<Harness />);
    return {
      ...view,
      getSession() {
        if (!session) throw new Error("Practice session has not mounted");
        return session;
      }
    };
  }

  function answerCurrentQuestion(container: HTMLElement) {
    fireEvent.click(container.querySelector(".choice-option")!);
  }

  function skipCurrentQuestion(container: HTMLElement) {
    fireEvent.click(container.querySelector(".next-button")!);
  }

  function expectProgress(container: HTMLElement, answered: number, ordinal: number) {
    expect(container.querySelector(".session-meter")).toHaveAttribute("data-answered", String(answered));
    expect(container.querySelector(".prompt-header > span")).toHaveTextContent(`第 ${ordinal} /`);
  }

  it.each(["basic", "daily"] as const)("excludes a skipped %s-mode question from answered progress", (mode) => {
    const { container, getSession } = renderLiveDrillPanel(mode);

    skipCurrentQuestion(container);
    expect(getSession().attempts).toHaveLength(0);
    expectProgress(container, 0, 2);
    answerCurrentQuestion(container);

    expect(getSession().attempts).toHaveLength(1);
    expectProgress(container, 1, 2);
  });

  it("counts answers around a skipped question while keeping the question ordinal", () => {
    const { container, getSession } = renderLiveDrillPanel();

    answerCurrentQuestion(container);
    expectProgress(container, 1, 1);
    skipCurrentQuestion(container);
    expectProgress(container, 1, 2);
    skipCurrentQuestion(container);
    expect(getSession().attempts).toHaveLength(1);
    expectProgress(container, 1, 3);
    answerCurrentQuestion(container);

    expect(getSession().attempts).toHaveLength(2);
    expectProgress(container, 2, 3);
  });

  it("counts a revealed answer once and clears progress when a new pass starts", () => {
    const { container, getSession } = renderLiveDrillPanel();

    fireEvent.click(container.querySelector(".ghost-button")!);
    expect(getSession().attempts).toHaveLength(1);
    expectProgress(container, 1, 1);
    act(() => getSession().revealAnswer());
    act(() => getSession().revealAnswer());
    expect(getSession().attempts).toHaveLength(1);
    expectProgress(container, 1, 1);
    skipCurrentQuestion(container);
    expectProgress(container, 1, 2);

    act(() => getSession().resetSession());

    expect(getSession().attempts).toHaveLength(0);
    expectProgress(container, 0, 1);
  });

  it("offers a direct Today exit before an active endless question without resetting session data", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    const resetSession = vi.fn();
    const { container } = render(
      <DrillPanel {...baseProps} language="zh-Hant" onExit={onExit} resetSession={resetSession} />
    );

    expect(screen.getByRole("button", { name: "首頁" })).toBeInTheDocument();
    expect(container.querySelector(".drill-panel")).toHaveAttribute("data-question-id", question.id);
    await user.click(screen.getByRole("button", { name: "首頁" }));

    expect(onExit).toHaveBeenCalledOnce();
    expect(resetSession).not.toHaveBeenCalled();
    expect(container.querySelector(".drill-panel")).toHaveAttribute("data-question-id", question.id);
  });

  it("keeps a direct Today exit available when the current filters match no questions", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        currentQuestion={null}
        onExit={onExit}
      />
    );

    expect(screen.getByText("目前設定沒有可練習的題目。")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "首頁" }));
    expect(onExit).toHaveBeenCalledOnce();
  });

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

    const nextPassInput = screen.getByRole("textbox", { name: "輸入變化後的日文" });
    expect(nextPassInput).toHaveValue("");
    expect(nextPassInput).toHaveFocus();
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

  // D-07 (#850, replaces #473): answering must not move the options or Next.
  // The verdict is drawn on the options themselves (D-03 marks) and the
  // feedback block appears BELOW the action row (prompt header → word block
  // → choice grid → action row → feedback), so nothing above it shifts. The
  // pre-answer keyboard hint also sits below the action row, so its removal
  // after answering cannot pull Next upward. Same order on every viewport.
  describe("post-answer feedback ordering (D-07)", () => {
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

    it("keeps word-block → choice-grid → action-row → hint with no feedback before answering", () => {
      const { container } = renderAnswered();
      expect(container.querySelector(".drill-panel .feedback")).toBeNull();
      expect(childBlocks(container)).toEqual([
        "session-bar",
        "word-block",
        "choice-grid",
        "action-row",
        "kbd-hint"
      ]);
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
      "orders word-block → choice-grid → action-row → feedback when %s",
      (_label, { selectedChoice, feedback }, title) => {
        const { container } = renderAnswered({ selectedChoice, feedback });
        expect(childBlocks(container)).toEqual([
          "session-bar",
          "word-block",
          "choice-grid",
          "action-row",
          "feedback"
        ]);
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

    it("lets Enter activate Today exit after feedback without advancing the question", async () => {
      const user = userEvent.setup();
      const onExit = vi.fn();
      const nextQuestion = vi.fn();
      const handleDrillKeyDown = vi.fn((event: ReactKeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          nextQuestion();
        }
      });
      renderAnswered({ ...answeredCorrect, onExit, nextQuestion, handleDrillKeyDown });
      const exit = screen.getByRole("button", { name: "首頁" });
      exit.focus();

      await user.keyboard("{Enter}");

      expect(onExit).toHaveBeenCalledOnce();
      expect(nextQuestion).not.toHaveBeenCalled();
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
        expect(mobileBlocks).toEqual(["session-bar", "word-block", "choice-grid", "action-row", "feedback"]);
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

  // #861 learning loop: the verdict is drawn ON the judged options (D-03),
  // progress is truthful, and a new question / the completion card is brought
  // into view. Motion itself is CSS (learning-loop.css); these tests pin the
  // markup and behavior it hangs on, which must be identical under reduced
  // motion.
  describe("learning loop (#861)", () => {
    const correct = {
      selectedChoice: "書いて",
      feedback: { status: "correct", question, submittedAnswer: "書いて" }
    } as const;
    const incorrect = {
      selectedChoice: "書いた",
      feedback: { status: "incorrect", question, submittedAnswer: "書いた" }
    } as const;
    const revealed = {
      selectedChoice: null,
      feedback: { status: "revealed", question, submittedAnswer: null }
    } as const;

    function renderLoop(overrides: Partial<ComponentProps<typeof DrillPanel>> = {}) {
      return render(<DrillPanel {...baseProps} language="zh-Hant" {...overrides} />);
    }

    function marks(container: HTMLElement): Array<[string, string | null]> {
      return Array.from(container.querySelectorAll(".choice-grid button")).flatMap((button) => {
        const mark = button.querySelector(".verdict-mark");
        return mark ? [[button.textContent ?? "", mark.getAttribute("data-mark")] as [string, string | null]] : [];
      });
    }

    it("draws no verdict mark before answering", () => {
      const { container } = renderLoop();
      expect(container.querySelectorAll(".verdict-mark")).toHaveLength(0);
    });

    it.each([
      ["correct", correct, [["書いて", "correct"]]],
      ["incorrect", incorrect, [["書いて", "correct"], ["書いた", "miss"]]],
      ["revealed", revealed, [["書いて", "revealed"]]]
    ] as const)("marks the judged options when %s", (_label, state, expected) => {
      const { container } = renderLoop(state);
      expect(marks(container)).toEqual(expected);
    });

    it("keeps marks out of the option's text and accessible name", () => {
      const { container } = renderLoop(incorrect);
      const mark = container.querySelector(".verdict-mark")!;
      expect(mark).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("button", { name: "書いた" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "書いて" })).toBeDisabled();
    });

    it("fills a truthful session meter: answered / total, advancing on the answer", () => {
      const { container, rerender } = renderLoop({
        sessionTotal: 4,
        questionIndex: 1,
        attempts: makeAttempts(1, 1)
      });
      const meter = container.querySelector(".session-meter")!;
      expect(meter).toHaveAttribute("aria-hidden", "true");
      expect(meter).toHaveAttribute("data-answered", "1");
      expect(meter.querySelector<HTMLElement>(".session-meter-fill")!.style.getPropertyValue("--progress")).toBe("0.25");

      rerender(
        <DrillPanel
          {...baseProps}
          language="zh-Hant"
          sessionTotal={4}
          questionIndex={1}
          attempts={makeAttempts(2, 2)}
          {...correct}
        />
      );
      expect(container.querySelector(".session-meter")).toBe(meter);
      expect(meter).toHaveAttribute("data-answered", "2");
      expect(meter.querySelector<HTMLElement>(".session-meter-fill")!.style.getPropertyValue("--progress")).toBe("0.5");
    });

    it("shows no meter for an open-ended session", () => {
      const { container } = renderLoop({ sessionTotal: null });
      expect(container.querySelector(".session-meter")).toBeNull();
    });

    it("keeps the question in place when answering but turns to a fresh one on Next", () => {
      const { container, rerender } = renderLoop();
      const word = container.querySelector(".word-block");
      const grid = container.querySelector(".choice-grid");

      rerender(<DrillPanel {...baseProps} language="zh-Hant" {...correct} />);
      expect(container.querySelector(".word-block")).toBe(word);
      expect(container.querySelector(".choice-grid")).toBe(grid);

      rerender(
        <DrillPanel
          {...baseProps}
          language="zh-Hant"
          questionIndex={1}
          currentQuestion={{ ...question, id: "kiku:te" }}
        />
      );
      expect(container.querySelector(".word-block")).not.toBe(word);
      expect(container.querySelector(".choice-grid")).not.toBe(grid);
    });

    it("docks the multiple-choice action row but leaves typed recall in flow", () => {
      const { container, rerender } = renderLoop();
      expect(container.querySelector(".action-row")).toHaveClass("action-row--dock");
      rerender(<DrillPanel {...baseProps} language="zh-Hant" isRecallQuestion />);
      expect(container.querySelector(".action-row")).not.toHaveClass("action-row--dock");
    });

    function attemptsEndingWith(pattern: boolean[]): Attempt[] {
      return pattern.map((isCorrect, i) => ({ ...makeAttempts(1, 1)[0], isCorrect, timestamp: i }));
    }

    describe("verdict button with ジャビ子 (dock slot)", () => {
      it("offers 看答案 before answering and no verdict button", () => {
        const { container } = renderLoop();
        expect(screen.getByRole("button", { name: "看答案" })).toBeEnabled();
        expect(container.querySelector(".verdict-chip")).toBeNull();
      });

      it.each([
        ["correct", correct, "正解", "happy"],
        ["incorrect", incorrect, "再想一下", "oops"],
        ["revealed", revealed, "先記這題", "thinking"]
      ] as const)("turns the reveal slot into the verdict when %s", (_label, state, title, mood) => {
        const { container } = renderLoop(state);
        expect(screen.queryByRole("button", { name: "看答案" })).not.toBeInTheDocument();
        const chip = container.querySelector(".action-row > .verdict-chip")!;
        expect(chip).toBe(container.querySelector(".action-row")!.firstElementChild);
        expect(screen.getByRole("button", { name: `${title} 看解說` })).toBe(chip);
        expect(chip.querySelector(".jabiko-buddy")).toHaveAttribute("data-mood", mood);
      });

      it("lets ジャビ子 say a Japanese line that stays out of the button's name", () => {
        const { container } = renderLoop({ ...incorrect, attempts: attemptsEndingWith([false]) });
        const bubble = container.querySelector(".verdict-chip .buddy-bubble")!;
        expect(bubble).toHaveTextContent("どんまい！");
        expect(bubble).toHaveAttribute("lang", "ja");
        expect(bubble).toHaveAttribute("aria-hidden", "true");
        expect(screen.getByRole("button", { name: "再想一下 看解說" })).toBeInTheDocument();
      });

      it.each([
        [[true], "1"],
        [[false, true, true, true], "2"],
        [[true, true, true, true, true], "3"],
        [[true, true, true, true, false, true], "1"]
      ] as const)("lets a real in-session run (%j) set ジャビ子's energy %s", (pattern, energy) => {
        const { container } = renderLoop({ ...correct, attempts: attemptsEndingWith([...pattern]) });
        expect(container.querySelector(".verdict-chip .jabiko-buddy")).toHaveAttribute("data-energy", energy);
      });

      it("opens the full explanation and moves focus there", () => {
        const scrollIntoView = vi.fn();
        Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
          configurable: true,
          writable: true,
          value: scrollIntoView
        });
        const { container } = renderLoop(incorrect);
        fireEvent.click(container.querySelector(".verdict-chip")!);
        const feedback = container.querySelector(".feedback")!;
        expect(scrollIntoView).toHaveBeenCalledOnce();
        expect(scrollIntoView.mock.contexts[0]).toBe(feedback);
        expect(document.activeElement).toBe(feedback);
      });

      it("keeps Enter on the verdict button from skipping to the next question", () => {
        const handleDrillKeyDown = vi.fn();
        const { container } = renderLoop({ ...correct, handleDrillKeyDown });
        fireEvent.keyDown(container.querySelector(".verdict-chip")!, { key: "Enter" });
        expect(handleDrillKeyDown).not.toHaveBeenCalled();
      });

      it("lets ジャビ子 cheer on the completion card, hardest for a perfect run", () => {
        const { container } = renderDone({ total: 4, correct: 4, accuracy: 100 });
        const buddy = container.querySelector(".session-done .jabiko-buddy")!;
        expect(buddy).toHaveAttribute("data-mood", "cheer");
        expect(buddy).toHaveAttribute("data-energy", "3");
        expect(container.querySelector(".session-done .buddy-bubble")).toHaveTextContent("かんぺき！");
        const { container: modest } = renderDone({ total: 4, correct: 1, accuracy: 25 });
        expect(modest.querySelector(".session-done .jabiko-buddy")).toHaveAttribute("data-energy", "1");
        expect(modest.querySelector(".session-done .buddy-bubble")).toHaveTextContent("がんばったね！");
      });
    });

    describe("peeking the explanation above the dock", () => {
      const scrollBy = vi.fn();
      const rects: Record<string, number> = {};

      function stubPeekLayout({ feedbackTop, dockTop, markTop, reduce = false }: {
        feedbackTop: number;
        dockTop: number;
        markTop: number;
        reduce?: boolean;
      }) {
        vi.useFakeTimers();
        scrollBy.mockClear();
        vi.stubGlobal("scrollBy", scrollBy);
        vi.stubGlobal("innerHeight", 844);
        Object.assign(rects, { feedbackTop, dockTop, markTop });
        vi.spyOn(window.HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
          const at = (top: number, height: number) =>
            ({ top, bottom: top + height, left: 0, right: 0, width: 0, height, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
          if (this.classList.contains("feedback")) return at(rects.feedbackTop, 400);
          if (this.classList.contains("action-row--dock")) return at(rects.dockTop, 844 - rects.dockTop);
          if (this.matches(".choice-grid button[data-result]")) return at(rects.markTop, 60);
          return at(500, 60);
        });
        vi.stubGlobal(
          "matchMedia",
          vi.fn((query: string) => ({
            matches: reduce && query.includes("reduce"),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
          }))
        );
      }

      afterEach(() => {
        vi.restoreAllMocks();
      });

      function answer(overrides: Partial<ComponentProps<typeof DrillPanel>> = incorrect) {
        const { rerender } = renderLoop();
        rerender(<DrillPanel {...baseProps} language="zh-Hant" {...overrides} />);
        vi.runAllTimers();
      }

      it("scrolls just enough to show the explanation's start above the dock, after the mark lands", () => {
        stubPeekLayout({ feedbackTop: 800, dockTop: 780, markTop: 450 });
        const { rerender } = renderLoop();
        rerender(<DrillPanel {...baseProps} language="zh-Hant" {...incorrect} />);
        expect(scrollBy).not.toHaveBeenCalled();
        vi.runAllTimers();
        // 800 + 120 (peek) - 780 = 140
        expect(scrollBy).toHaveBeenCalledWith({ top: 140, behavior: "smooth" });
      });

      it("never scrolls the judged options up under the header", () => {
        stubPeekLayout({ feedbackTop: 1300, dockTop: 780, markTop: 300 });
        answer();
        // room = 300 - 0 (no scroll-margin in jsdom) = 300 < needed 640
        expect(scrollBy).toHaveBeenCalledWith({ top: 300, behavior: "smooth" });
      });

      it("jumps instantly with reduced motion", () => {
        stubPeekLayout({ feedbackTop: 800, dockTop: 780, markTop: 450, reduce: true });
        answer();
        expect(scrollBy).toHaveBeenCalledWith({ top: 140, behavior: "auto" });
      });

      it("leaves the page alone when the explanation already shows", () => {
        stubPeekLayout({ feedbackTop: 500, dockTop: 780, markTop: 300 });
        answer(correct);
        expect(scrollBy).not.toHaveBeenCalled();
      });

      it("does not peek when the page is rendered already answered", () => {
        stubPeekLayout({ feedbackTop: 800, dockTop: 780, markTop: 450 });
        renderLoop(incorrect);
        vi.runAllTimers();
        expect(scrollBy).not.toHaveBeenCalled();
      });
    });

    describe("bringing the next step into view", () => {
      const scrollIntoView = vi.fn();
      let top = -400;

      function stubLayout(reduce: boolean) {
        scrollIntoView.mockClear();
        Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
          configurable: true,
          writable: true,
          value: scrollIntoView
        });
        vi.spyOn(window.HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
          () => ({ top, bottom: top + 600, left: 0, right: 0, width: 0, height: 600, x: 0, y: top, toJSON: () => ({}) })
        );
        vi.stubGlobal(
          "matchMedia",
          vi.fn((query: string) => ({
            matches: reduce && query.includes("reduce"),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
          }))
        );
      }

      afterEach(() => {
        vi.restoreAllMocks();
        top = -400;
      });

      it("does not scroll on first render or when feedback appears", () => {
        stubLayout(false);
        const { rerender } = renderLoop();
        rerender(<DrillPanel {...baseProps} language="zh-Hant" {...correct} />);
        expect(scrollIntoView).not.toHaveBeenCalled();
      });

      it.each([
        [false, "smooth"],
        [true, "auto"]
      ] as const)("scrolls an off-screen new question into view (reduced motion: %s)", (reduce, behavior) => {
        stubLayout(reduce);
        const { rerender } = renderLoop(correct);
        rerender(
          <DrillPanel
            {...baseProps}
            language="zh-Hant"
            questionIndex={1}
            currentQuestion={{ ...question, id: "kiku:te" }}
          />
        );
        expect(scrollIntoView).toHaveBeenCalledOnce();
        expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior });
      });

      it("scrolls the completion card into view when the session ends", () => {
        stubLayout(false);
        const { rerender } = renderLoop(correct);
        rerender(
          <DrillPanel
            {...baseProps}
            language="zh-Hant"
            currentQuestion={null}
            sessionExhausted
            attempts={makeAttempts(4, 4)}
            correctCount={4}
            accuracy={100}
          />
        );
        expect(scrollIntoView).toHaveBeenCalledOnce();
      });

      it("also scrolls when the new step starts under the sticky header", () => {
        top = 25;
        stubLayout(false);
        const { container, rerender } = renderLoop(correct);
        (container.querySelector(".drill-panel") as HTMLElement).style.scrollMarginTop = "64px";
        rerender(
          <DrillPanel
            {...baseProps}
            language="zh-Hant"
            questionIndex={1}
            currentQuestion={{ ...question, id: "kiku:te" }}
          />
        );
        expect(scrollIntoView).toHaveBeenCalledOnce();
      });

      it("leaves the page alone when the new question is already in view", () => {
        top = 80;
        stubLayout(false);
        const { rerender } = renderLoop(correct);
        rerender(
          <DrillPanel
            {...baseProps}
            language="zh-Hant"
            questionIndex={1}
            currentQuestion={{ ...question, id: "kiku:te" }}
          />
        );
        expect(scrollIntoView).not.toHaveBeenCalled();
      });
    });
  });
});

describe("DrillPanel session bar (#866)", () => {
  it("names the current set in the session bar and toggles the set switcher", () => {
    const onToggle = vi.fn();
    render(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        sessionTotal={20}
        modeTitle="N3 備考"
        switcher={{ open: false, onToggle, controlsId: "practice-switcher" }}
      />
    );
    const title = screen.getByRole("button", { name: "換練習" });
    expect(title).toHaveAccessibleDescription("N3 備考");
    expect(title).toHaveTextContent("N3 備考");
    expect(title).toHaveAttribute("aria-expanded", "false");
    expect(title).toHaveAttribute("aria-controls", "practice-switcher");
    fireEvent.click(title);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  // Astra review #872: choosing 自己輸入 inside the open set list autofocused
  // the answer field behind the list.
  it("does not pull focus into the typed answer while the set list is open", () => {
    render(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        isRecallQuestion
        modeTitle="基礎變化"
        switcher={{ open: true, onToggle: vi.fn(), controlsId: "practice-switcher" }}
      />
    );
    expect(document.querySelector("#recall-answer")).not.toHaveFocus();
  });

  // Astra review round 4: closing the list must not pull focus into the
  // typed answer -- the learner (or the close path) already chose a target.
  it("does not steal focus into the typed answer when the set list closes", () => {
    const props = {
      ...baseProps,
      language: "zh-Hant" as const,
      isRecallQuestion: true,
      modeTitle: "基礎變化"
    };
    const { rerender } = render(
      <>
        <button type="button">outside</button>
        <DrillPanel {...props} switcher={{ open: true, onToggle: vi.fn(), controlsId: "practice-switcher" }} />
      </>
    );
    const outside = screen.getByRole("button", { name: "outside" });
    outside.focus();
    rerender(
      <>
        <button type="button">outside</button>
        <DrillPanel {...props} switcher={{ open: false, onToggle: vi.fn(), controlsId: "practice-switcher" }} />
      </>
    );
    expect(outside).toHaveFocus();
  });

  it("still focuses the typed answer when the set list is closed", () => {
    render(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        isRecallQuestion
        modeTitle="基礎變化"
        switcher={{ open: false, onToggle: vi.fn(), controlsId: "practice-switcher" }}
      />
    );
    expect(document.querySelector("#recall-answer")).toHaveFocus();
  });

  it("keeps the Today exit and the n / N count in the same bar", () => {
    const { container } = render(
      <DrillPanel {...baseProps} language="zh-Hant" sessionTotal={20} modeTitle="今日練習" />
    );
    const bar = container.querySelector(".session-bar");
    expect(bar).not.toBeNull();
    expect(bar!.querySelector(".session-exit")).not.toBeNull();
    expect(bar!.querySelector(".prompt-header")).not.toBeNull();
  });
});

describe("DrillPanel phase-following Next (#866, D-25)", () => {
  it("keeps 下一題 quiet before a verdict and makes it the primary after", () => {
    const { rerender } = render(<DrillPanel {...baseProps} language="zh-Hant" />);
    const next = () => screen.getByRole("button", { name: "下一題" });
    expect(next()).toHaveAttribute("data-emphasis", "tonal");
    rerender(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        selectedChoice="書いて"
        feedback={{ status: "correct", question, submittedAnswer: "書いて" }}
      />
    );
    expect(next()).toHaveAttribute("data-emphasis", "primary");
  });
});

// The label is drawn from `data-verdict-label` by CSS generated content with
// empty alt text, so the option's textContent and accessible name stay the
// choice itself (the #862 contract above); the live region announces the verdict.
describe("DrillPanel per-option verdict labels (#864, D-03)", () => {
  const label = (choice: string) =>
    document.querySelector(`.choice-option[data-choice="${choice}"]`)?.getAttribute("data-verdict-label") ?? null;

  it("labels the learner's miss and the right answer", () => {
    render(
      <DrillPanel
        {...baseProps}
        language="zh-Hant"
        selectedChoice="書いた"
        feedback={{ status: "incorrect", question, submittedAnswer: "書いた" }}
      />
    );
    expect(label("書いた")).toBe("你的答案");
    expect(label("書いて")).toBe("正解");
    expect(label("書かない")).toBeNull();
  });

  it("labels a correct pick", () => {
    render(
      <DrillPanel
        {...baseProps}
        language="en"
        selectedChoice="書いて"
        feedback={{ status: "correct", question, submittedAnswer: "書いて" }}
      />
    );
    expect(label("書いて")).toBe("Correct");
  });

  it("labels the answer shown by 看答案", () => {
    render(
      <DrillPanel
        {...baseProps}
        language="ja"
        feedback={{ status: "revealed", question, submittedAnswer: null }}
      />
    );
    expect(label("書いて")).toBe("答え");
  });

  it("shows no labels before answering", () => {
    render(<DrillPanel {...baseProps} language="zh-Hant" />);
    expect(document.querySelectorAll("[data-verdict-label]")).toHaveLength(0);
  });
});

describe("DrillPanel completion stamp (#866)", () => {
  it("stamps a 花丸 on a perfect set", () => {
    renderDone({ total: 5, correct: 5, accuracy: 100 });
    expect(document.querySelector('[data-stamp="hanamaru"]')).not.toBeNull();
  });

  it("does not stamp a 花丸 on a set with misses", () => {
    renderDone({ total: 5, correct: 3, accuracy: 60 });
    expect(document.querySelector('[data-stamp="hanamaru"]')).toBeNull();
  });
});
