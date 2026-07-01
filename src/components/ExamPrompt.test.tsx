import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ExamPrompt } from "./ExamPrompt";
import type { PracticeQuestion } from "../domain/types";
import { FuriganaContext } from "./furiganaContext";
import { examStyleQuestions } from "../domain/examBlocks";
import { buildClozeQuestionPool } from "../domain/cloze";
import { clozeSentences } from "../domain/cloze-data";
import { vocabulary } from "../domain/vocabulary";

describe("ExamPrompt answer-leak guard", () => {
  it("hides the surface・reading・meaning row for an exam item whose surface contains the answer", () => {
    // n3-grammar-tahougaii: surface「たほうがいい」CONTAINS answer「ほうがいい」
    // (the た already sits in the prompt「行った」). The old exact-match guard
    // let the row through, so the pre-answer line spelled out the answer +
    // its「比較好（建議）」gloss. The row must now be suppressed.
    const item = examStyleQuestions.find((question) => question.id === "n3-grammar-tahougaii");
    expect(item).toBeDefined();

    const { container } = render(<ExamPrompt question={item!} language="zh-Hant" />);

    // The prompt sentence renders; the neutral situation hint is now behind
    // the 提示 toggle (collapsed by default), so its text isn't shown yet.
    expect(screen.getByText(/病院へ行った/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提示" })).toBeInTheDocument();
    expect(screen.queryByText("發燒時對就醫安排的判斷。")).not.toBeInTheDocument();
    // ...and the leaky surface・reading・meaning vocab row is gone.
    expect(container.querySelector("p.reading")).toBeNull();
    expect(screen.queryByText(/たほうがいい/)).not.toBeInTheDocument();
    expect(screen.queryByText(/比較好（建議）/)).not.toBeInTheDocument();
  });

  it("reveals the pre-answer hint only after tapping 提示, and collapses again", async () => {
    const user = userEvent.setup();
    const item = examStyleQuestions.find((question) => question.id === "n3-grammar-tahougaii");
    render(<ExamPrompt question={item!} language="zh-Hant" />);

    const toggle = screen.getByRole("button", { name: "提示" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("發燒時對就醫安排的判斷。")).not.toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByText("發燒時對就醫安排的判斷。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "隱藏提示" })).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "隱藏提示" }));
    expect(screen.queryByText("發燒時對就醫安排的判斷。")).not.toBeInTheDocument();
  });

  it("collapses the hint again when the question changes", async () => {
    const user = userEvent.setup();
    const first = examStyleQuestions.find((question) => question.id === "n3-grammar-tahougaii");
    const second = examStyleQuestions.find(
      (question) => question.id !== first!.id && (question.hintZh ?? question.promptContextZh)
    );
    expect(second).toBeDefined();
    const { rerender } = render(<ExamPrompt question={first!} language="zh-Hant" />);

    // Expand the hint on the first question.
    await user.click(screen.getByRole("button", { name: "提示" }));
    expect(screen.getByText("發燒時對就醫安排的判斷。")).toBeInTheDocument();

    // Switching to another question resets the toggle to collapsed
    // (useEffect keyed by question.id), so the new question starts hidden.
    rerender(<ExamPrompt question={second!} language="zh-Hant" />);
    expect(screen.getByRole("button", { name: "提示" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("發燒時對就醫安排的判斷。")).not.toBeInTheDocument();
  });

  it("keeps the surface・reading・meaning row for cloze items", () => {
    // For cloze items the surface is the dictionary form -- a legit "which
    // verb" cue, not the answer -- so the row must still show.
    const cloze = buildClozeQuestionPool(clozeSentences, vocabulary)[0];
    const { container } = render(<ExamPrompt question={cloze} language="zh-Hant" />);

    const vocabRow = container.querySelector("p.reading");
    expect(vocabRow).not.toBeNull();
    expect(vocabRow?.textContent).toContain(cloze.vocabulary.surface);
  });
});

describe("ExamPrompt furigana (#134)", () => {
  // A pre-baked sentence (学校 -> がっこう) used as the prompt so the ruby
  // path actually has data to render.
  const SENTENCE = "ここは学校だ。";
  const base = examStyleQuestions[0];

  const renderOn = (question: typeof base): ReturnType<typeof render> =>
    render(
      (
        <FuriganaContext.Provider value={{ enabled: true }}>
          <ExamPrompt question={question} language="zh-Hant" />
        </FuriganaContext.Provider>
      ) as ReactElement
    );

  it("renders ruby on a non-reading prompt when furigana is on", () => {
    const grammarItem = {
      ...base,
      promptText: SENTENCE,
      promptLabel: "文法形式選擇",
      targetForm: "ta" as const
    };
    const { container } = renderOn(grammarItem);
    const readings = Array.from(container.querySelectorAll(".exam-prompt rt")).map((n) => n.textContent);
    expect(readings).toContain("がっこう");
  });

  it("never renders ruby on a reading prompt, even with furigana on (answer-leak guard)", () => {
    const readingItem = {
      ...base,
      promptText: SENTENCE,
      promptLabel: "漢字読み",
      targetForm: "reading" as const
    };
    const { container } = renderOn(readingItem);
    expect(container.querySelector(".exam-prompt rt")).toBeNull();
    expect(container.querySelector(".exam-prompt")?.textContent).toContain(SENTENCE);
  });

  // The two guard arms, tested independently, so a future change of the OR to
  // an AND (or dropping one argument from the call site) is caught.

  it("suppresses ruby on a 漢字読み item even when targetForm is not 'reading'", () => {
    const readingByLabel = {
      ...base,
      promptText: SENTENCE,
      promptLabel: "漢字読み",
      targetForm: "ta" as const
    };
    const { container } = renderOn(readingByLabel);
    expect(container.querySelector(".exam-prompt rt")).toBeNull();
  });

  it("shows ruby on a labelled grammar stem even though exam items default targetForm to 'reading' (#134 P4)", () => {
    // The whole point of P4: targetForm defaults to "reading" for every exam
    // item, so a grammar / vocab stem must still get furigana -- the learner
    // reads a hard question with the readings on. Only 漢字読み is suppressed.
    const grammarReading = {
      ...base,
      promptText: SENTENCE,
      promptLabel: "文法形式選擇",
      targetForm: "reading" as const
    };
    const { container } = renderOn(grammarReading);
    const readings = Array.from(container.querySelectorAll(".exam-prompt rt")).map((n) => n.textContent);
    expect(readings).toContain("がっこう");
  });
});

describe("ExamPrompt content localization (#400)", () => {
  // A cloze-style item whose vocab row IS shown (surface not in answers, no
  // exam_style / sentence_pattern tag) so the instruction / hint / meaning all
  // render, letting us assert the per-locale overlays with a Chinese fallback.
  const makeQuestion = (overrides: Partial<PracticeQuestion> = {}): PracticeQuestion => ({
    id: "loc-1",
    vocabulary: {
      id: "loc-1",
      surface: "待つ",
      reading: "まつ",
      meaningZh: "等待",
      meaningI18n: { en: "to wait" },
      partOfSpeech: "verb",
      group: null,
      lesson: null,
      tags: [],
      examples: []
    },
    targetForm: "reading",
    expectedAnswers: ["待って"],
    explanation: "解說",
    promptLabel: "句中填空",
    promptText: "ちょっと ___ ください。",
    promptContextZh: "情境中文",
    promptContextI18n: { en: "English context" },
    hintZh: "提示中文",
    hintI18n: { en: "English hint" },
    instructionZh: "說明中文",
    instructionI18n: { en: "English instruction" },
    options: ["待って", "待つ", "待ち", "待った"],
    ...overrides
  });

  it("renders the instruction in the target locale when an overlay exists", () => {
    render(<ExamPrompt question={makeQuestion()} language="en" />);
    expect(screen.getByText("English instruction")).toBeInTheDocument();
    expect(screen.queryByText("說明中文")).not.toBeInTheDocument();
  });

  it("falls back to the Chinese instruction when the locale has no overlay", () => {
    render(<ExamPrompt question={makeQuestion({ instructionI18n: { ja: "x" } })} language="en" />);
    expect(screen.getByText("說明中文")).toBeInTheDocument();
  });

  it("localizes the pre-answer hint once revealed", async () => {
    const user = userEvent.setup();
    const { container } = render(<ExamPrompt question={makeQuestion()} language="en" />);
    await user.click(container.querySelector(".hint-toggle") as HTMLElement);
    expect(screen.getByText("English hint")).toBeInTheDocument();
    expect(screen.queryByText("提示中文")).not.toBeInTheDocument();
  });

  it("localizes the vocab-row meaning, falling back to Chinese when the overlay is absent", () => {
    // The vocab row is a single <p> "surface・reading・meaning", so assert on
    // its combined text content rather than an exact-text element match.
    const { container, unmount } = render(<ExamPrompt question={makeQuestion()} language="en" />);
    const row = container.querySelector("p.reading");
    expect(row?.textContent).toContain("to wait");
    expect(row?.textContent).not.toContain("等待");
    unmount();

    const noOverlay = makeQuestion();
    noOverlay.vocabulary = { ...noOverlay.vocabulary, meaningI18n: undefined };
    const { container: c2 } = render(<ExamPrompt question={noOverlay} language="en" />);
    expect(c2.querySelector("p.reading")?.textContent).toContain("等待");
  });
});
