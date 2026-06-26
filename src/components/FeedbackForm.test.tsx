import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedbackForm } from "./FeedbackForm";

describe("FeedbackForm", () => {
  it("preselects the given category", () => {
    render(<FeedbackForm language="zh-Hant" category="bug" onClose={() => {}} submit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "回報問題", pressed: true })).toBeInTheDocument();
  });

  it("disables submit until a message is typed", () => {
    render(<FeedbackForm language="zh-Hant" category="wish" onClose={() => {}} submit={vi.fn()} />);
    const send = screen.getByRole("button", { name: /送出/ });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/想許什麼願/), { target: { value: "想要夜間模式" } });
    expect(send).toBeEnabled();
  });

  it("submits trimmed input and shows a thank-you", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<FeedbackForm language="zh-Hant" category="wish" onClose={() => {}} submit={submit} />);
    fireEvent.change(screen.getByPlaceholderText(/想許什麼願/), { target: { value: "  想要夜間模式  " } });
    fireEvent.click(screen.getByRole("button", { name: /送出/ }));
    await waitFor(() => expect(screen.getByText(/謝謝你的回饋/)).toBeInTheDocument());
    expect(submit).toHaveBeenCalledWith({ category: "wish", message: "想要夜間模式", contact: undefined });
  });

  it("shows a GitHub fallback link when submit fails", async () => {
    const submit = vi.fn().mockRejectedValue(new Error("boom"));
    render(<FeedbackForm language="zh-Hant" category="bug" onClose={() => {}} submit={submit} />);
    fireEvent.change(screen.getByPlaceholderText(/想許什麼願/), { target: { value: "壞了" } });
    fireEvent.click(screen.getByRole("button", { name: /送出/ }));
    const link = await screen.findByRole("link", { name: /GitHub/ });
    expect(link.getAttribute("href") ?? "").toContain("labels=bug");
  });
});
