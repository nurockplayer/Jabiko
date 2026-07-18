import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { QuestionReportForm } from "./QuestionReportForm";
import { FEEDBACK_MAX } from "../domain/feedbackRemote";
import { buildQuestionReportMessage } from "../domain/questionReport";
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

function renderForm(overrides: Partial<ComponentProps<typeof QuestionReportForm>> = {}) {
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

  // 2026-07 report-UX fix: the reply checkbox used to point anonymous users at
  // a contact field that only existed on the general feedback form. Ticking
  // 希望收到回信 now reveals the same optional contact input here.
  it("reveals a contact input when the reply checkbox is ticked, and submits it", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    renderForm({ submit });

    expect(screen.queryByPlaceholderText(/聯絡方式/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "希望收到回信" }));
    const contact = screen.getByPlaceholderText(/聯絡方式/);
    fireEvent.change(contact, { target: { value: "hana@example.com" } });

    fireEvent.click(screen.getByRole("button", { name: "送出回報" }));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    const arg = submit.mock.calls[0][0];
    expect(arg.wantsReply).toBe(true);
    expect(arg.contact).toBe("hana@example.com");
    // Contact rides the dedicated column, never the message text.
    expect(arg.message).not.toContain("hana@example.com");
  });

  it("omits contact when the reply checkbox stays unticked", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    renderForm({ submit });
    fireEvent.click(screen.getByRole("button", { name: "送出回報" }));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(submit.mock.calls[0][0].contact).toBeUndefined();
  });

  it("sends wantsReply=true when the reply checkbox is ticked (#468)", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    renderForm({ submit });
    fireEvent.click(screen.getByRole("checkbox", { name: "希望收到回信" }));
    fireEvent.click(screen.getByRole("button", { name: "送出回報" }));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(submit.mock.calls[0][0].wantsReply).toBe(true);
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

  // The true remaining budget = FEEDBACK_MAX minus the structured block AND the
  // "detail:" prefix the builder inserts for non-empty detail. Probe with a
  // one-char detail so the prefix is counted: budget = FEEDBACK_MAX - (probe - 1).
  const remainingBudget = (reason: Parameters<typeof buildQuestionReportMessage>[0]["reason"]) => {
    const probeLength = buildQuestionReportMessage({
      question,
      reason,
      detail: "x",
      language: "zh-Hant",
      selectedAnswer: "めいわく"
    }).length;
    return FEEDBACK_MAX - (probeLength - 1);
  };

  it("caps the detail textarea to the real remaining budget (default reason)", () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(/補充說明/) as HTMLTextAreaElement;
    const expectedBudget = remainingBudget("wrongAnswer");
    expect(expectedBudget).toBeGreaterThan(0);
    // Strictly less than FEEDBACK_MAX -- the whole point of the fix.
    expect(expectedBudget).toBeLessThan(FEEDBACK_MAX);
    expect(textarea.maxLength).toBe(expectedBudget);
  });

  it("recomputes the budget when the reason changes", () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(/補充說明/) as HTMLTextAreaElement;
    fireEvent.click(screen.getByRole("button", { name: "句意不自然" }));
    expect(textarea.maxLength).toBe(remainingBudget("awkwardMeaning"));
  });

  it("does not truncate a detail typed at the textarea cap", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    renderForm({ submit });
    const textarea = screen.getByPlaceholderText(/補充說明/) as HTMLTextAreaElement;
    const budget = textarea.maxLength;
    // A detail exactly at the cap must survive intact through the message build.
    const detail = "あ".repeat(budget);
    fireEvent.change(textarea, { target: { value: detail } });
    fireEvent.click(screen.getByRole("button", { name: "送出回報" }));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    const message = submit.mock.calls[0][0].message as string;
    // Whole detail present (none silently dropped) and the message respects the cap.
    expect(message).toContain(detail);
    expect(message.length).toBeLessThanOrEqual(FEEDBACK_MAX);
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
