import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DrillPanel } from "./DrillPanel";
import { FuriganaContext } from "../furiganaContext";
import type { Attempt, PracticeQuestion } from "../../domain/types";
import type { Language } from "../../i18n";

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
});
