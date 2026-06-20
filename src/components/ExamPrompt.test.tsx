import { render, screen } from "@testing-library/react";
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

    // The prompt sentence and the neutral situation hint still render...
    expect(screen.getByText(/病院へ行った/)).toBeInTheDocument();
    expect(screen.getByText("發燒時對就醫安排的判斷。")).toBeInTheDocument();
    // ...but the leaky surface・reading・meaning vocab row is gone.
    expect(container.querySelector("p.reading")).toBeNull();
    expect(screen.queryByText(/たほうがいい/)).not.toBeInTheDocument();
    expect(screen.queryByText(/比較好（建議）/)).not.toBeInTheDocument();
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
