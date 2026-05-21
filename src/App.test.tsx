import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders the practice tool immediately", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /變化訓練場/ })).toBeInTheDocument();
    expect(screen.getByText("練習重點")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "否定整理" })).toBeInTheDocument();
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

  it("lets the learner focus on negative transformations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "否定整理" }));

    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("ない形")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "下一題" }));

    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("否定て形・ないで")).toBeInTheDocument();
  });

  it("lets the learner practice noun-like transformations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "名詞" }));

    expect(screen.getByText("学生")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("普通形・非過去否定")).toBeInTheDocument();
  });

  it("toggles dark theme and stores the preference", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    await user.click(screen.getByRole("button", { name: "深色模式" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("jabiko.theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "淺色模式" })).toBeInTheDocument();
  });

  it("loads the stored dark theme preference", () => {
    localStorage.setItem("jabiko.theme", "dark");

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "淺色模式" })).toBeInTheDocument();
  });
});
