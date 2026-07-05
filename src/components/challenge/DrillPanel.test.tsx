import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DrillPanel } from "./DrillPanel";
import type { PracticeQuestion } from "../../domain/types";
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

function renderPanel(language: Language) {
  return render(
    <DrillPanel
      language={language}
      questionIndex={0}
      sessionTotal={null}
      selectedChoice={null}
      feedback={null}
      attempts={[]}
      practiceMode="basic"
      currentQuestion={question}
      reviewEmpty={false}
      bookmarksEmpty={false}
      sessionExhausted={false}
      choiceOptions={["書いて", "書いた", "書かない", "書きます"]}
      correctCount={0}
      nextButtonRef={{ current: null }}
      setPracticeMode={vi.fn()}
      setPracticeFilter={vi.fn()}
      handleChoiceSubmit={vi.fn()}
      nextQuestion={vi.fn()}
      resetSession={vi.fn()}
      revealAnswer={vi.fn()}
      handleDrillKeyDown={vi.fn()}
      isQuestionBookmarked={() => false}
      onToggleBookmark={vi.fn()}
      onExit={vi.fn()}
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
});
