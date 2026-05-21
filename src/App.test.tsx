import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the practice tool immediately", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /變化訓練場/ })).toBeInTheDocument();
    expect(screen.getByLabelText("答案")).toBeInTheDocument();
    expect(screen.getByText("書く")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("て形")).toBeInTheDocument();
  });

  it("shows success feedback when the learner submits a correct answer", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("答案"), "書いて");
    await user.click(screen.getByRole("button", { name: "送出" }));

    expect(screen.getByRole("heading", { name: "正解" })).toBeInTheDocument();
  });

  it("shows the accepted answer and explanation when the learner submits a wrong answer", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("答案"), "書て");
    await user.click(screen.getByRole("button", { name: "送出" }));

    expect(screen.getByText("再想一下")).toBeInTheDocument();
    expect(screen.getByText("正解：書いて")).toBeInTheDocument();
    expect(screen.getByText(/一類動詞/)).toBeInTheDocument();
  });

  it("adds missed questions to the review panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("答案"), "書て");
    await user.click(screen.getByRole("button", { name: "送出" }));

    expect(screen.getByRole("heading", { name: "錯題複習" })).toBeInTheDocument();
    expect(screen.getByText("書く -> て形")).toBeInTheDocument();
  });

  it("moves to the next question with Enter after feedback", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("答案"), "書いて");
    await user.click(screen.getByRole("button", { name: "送出" }));
    await user.keyboard("{Enter}");

    expect(screen.getByText("聞く")).toBeInTheDocument();
    expect(screen.getByLabelText("答案")).toHaveValue("");
  });
});
