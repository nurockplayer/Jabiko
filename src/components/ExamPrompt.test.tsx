import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ExamPrompt } from "./ExamPrompt";
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
