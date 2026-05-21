import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders the learning path before the challenge", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /變化訓練場/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "學習" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "挑戰" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "先學會，再挑戰" })).toBeInTheDocument();
    expect(screen.getByText("ないで / なくて / なかった")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "開始挑戰" })).toBeInTheDocument();
    expect(screen.queryByText("答題方式")).not.toBeInTheDocument();
  });

  it("starts the challenge from the learning path", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));

    expect(screen.getByText("練習重點")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "否定整理" })).toBeInTheDocument();
    expect(screen.getByText("答題方式")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "選擇題" })).toBeInTheDocument();
    expect(screen.queryByLabelText("答案")).not.toBeInTheDocument();
    expect(screen.getByText("書く")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "書いて" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("て形")).toBeInTheDocument();
  });

  it("shows success feedback when the learner picks a correct choice", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "書いて" }));

    expect(screen.getByRole("heading", { name: "正解" })).toBeInTheDocument();
  });

  it("shows the accepted answer and explanation when the learner picks a wrong choice", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "聞いて" }));

    expect(screen.getByText("再想一下")).toBeInTheDocument();
    expect(screen.getByText("正解：書いて")).toBeInTheDocument();
    expect(screen.getByText(/一類動詞/)).toBeInTheDocument();
  });

  it("adds missed questions to the review panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "聞いて" }));

    expect(screen.getByRole("heading", { name: "錯題複習" })).toBeInTheDocument();
    expect(screen.getByText("書く -> て形")).toBeInTheDocument();
  });

  it("moves to the next question with Enter after feedback", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "書いて" }));
    await user.keyboard("{Enter}");

    expect(screen.getByText("聞く")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "聞いて" })).toBeInTheDocument();
  });

  it("lets the learner switch to typed answers", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "輸入" }));
    await user.type(screen.getByLabelText("答案"), "書いて");
    await user.click(screen.getByRole("button", { name: "送出" }));

    expect(screen.getByRole("heading", { name: "正解" })).toBeInTheDocument();
  });

  it("lets the learner focus on negative transformations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "否定整理" }));

    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("ない形")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "下一題" }));

    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("否定て形・ないで")).toBeInTheDocument();
  });

  it("lets the learner practice noun-like transformations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "名詞" }));

    expect(screen.getByText("学生")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("普通形・非過去否定")).toBeInTheDocument();
  });

  it("defaults to dark theme and stores a light preference when toggled", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "淺色模式" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "淺色模式" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("jabiko.theme")).toBe("light");
    expect(screen.getByRole("button", { name: "深色模式" })).toBeInTheDocument();
  });

  it("loads the stored dark theme preference", () => {
    localStorage.setItem("jabiko.theme", "dark");

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "淺色模式" })).toBeInTheDocument();
  });

  it("loads the stored light theme preference", () => {
    localStorage.setItem("jabiko.theme", "light");

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "深色模式" })).toBeInTheDocument();
  });
});
