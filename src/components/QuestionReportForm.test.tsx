import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuestionReportForm } from "./QuestionReportForm";
import type { PracticeQuestion } from "../domain/types";

const question: PracticeQuestion = {
  id: "rep-q-123",
  vocabulary: {
    id: "v",
    surface: "面倒",
    reading: "めんどう",
    meaningZh: "麻煩",
    partOfSpeech: "na_adjective",
    group: null,
    lesson: null,
    tags: [],
    examples: [],
    level: "N2"
  },
  targetForm: "reading",
  expectedAnswers: ["めんどう"],
  explanation: "讀作 めんどう。",
  promptLabel: "漢字読み",
  promptText: "この仕事は面倒だ。"
};

function renderForm(overrides: Partial<React.ComponentProps<typeof QuestionReportForm>> = {}) {
  const submit = overrides.submit ?? vi.fn().mockResolvedValue(undefined);
  render(
    <QuestionReportForm
      question={question}
      selectedAnswer="めいわく"
      language="zh-Hant"
      onClose={() => {}}
      submit={submit}
      {...overrides}
    />
  );
  return submit;
}

describe("QuestionReportForm", () => {
  it("renders all five report reasons as selectable options", () => {
    renderForm();
    expect(screen.getByRole("button", { name: "答案／正解有誤" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "句意不自然" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "解說看不懂" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "錯字或用字問題" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "其他" })).toBeInTheDocument();
  });

  it("submits with category 'bug' and a message carrying the question id", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    renderForm({ submit });
    fireEvent.click(screen.getByRole("button", { name: "送出回報" }));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    const arg = submit.mock.calls[0][0];
    expect(arg.category).toBe("bug");
    expect(arg.message).toContain("rep-q-123");
    expect(arg.message).toContain("題目回報");
  });

  it("packs the selected reason and free-text detail into the message", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    renderForm({ submit });
    fireEvent.click(screen.getByRole("button", { name: "句意不自然" }));
    fireEvent.change(screen.getByPlaceholderText(/補充說明/), {
      target: { value: "這句不自然" }
    });
    fireEvent.click(screen.getByRole("button", { name: "送出回報" }));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    const message = submit.mock.calls[0][0].message as string;
    expect(message).toContain("awkwardMeaning");
    expect(message).toContain("這句不自然");
  });

  it("shows a thank-you on success", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "送出回報" }));
    await waitFor(() => expect(screen.getByText(/謝謝你的回饋/)).toBeInTheDocument());
  });

  it("shows a GitHub fallback link when submit fails (does not block the user)", async () => {
    const submit = vi.fn().mockRejectedValue(new Error("boom"));
    renderForm({ submit });
    fireEvent.click(screen.getByRole("button", { name: "送出回報" }));
    const link = await screen.findByRole("link", { name: /GitHub/ });
    expect(link.getAttribute("href") ?? "").toContain("labels=bug");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    renderForm({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <QuestionReportForm
        question={question}
        selectedAnswer={null}
        language="zh-Hant"
        onClose={onClose}
        submit={vi.fn()}
      />
    );
    fireEvent.click(container.querySelector(".feedback-overlay")!);
    expect(onClose).toHaveBeenCalled();
  });
});
