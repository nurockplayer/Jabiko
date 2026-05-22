import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

function seedProgress(targetForms: string[]) {
  localStorage.setItem(
    "jabiko:attempts",
    JSON.stringify(
      targetForms.map((targetForm, index) => ({
        vocabularyId: `seed-${targetForm}`,
        targetForm,
        prompt: "seed",
        expectedAnswers: ["seed"],
        submittedAnswer: "seed",
        isCorrect: true,
        timestamp: index + 1,
        responseTimeMs: 100
      }))
    )
  );
}

describe("App", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    window.history.replaceState({}, "", "/");
  });

  it("renders the learning path before the challenge", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /變化訓練場/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "學習" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "挑戰" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "先分清楚く / に" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "開始第 1 關" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "先把前置走完" })).toBeInTheDocument();
    expect(screen.getByText("ないで / なくて / なかった")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "動詞先分三類" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "て形和た形是同一張表" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "否定變化都先回到ない形" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "形容詞和名詞不要混在一起背" })).toBeInTheDocument();
    expect(screen.getByText("高い -> 高く")).toBeInTheDocument();
    expect(screen.getByText("静か -> 静かに")).toBeInTheDocument();
    expect(screen.getByText("学生 -> 学生に")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "練く/に修飾" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "必須的過去看最後一段" })).toBeInTheDocument();
    expect(screen.getByText("学生 -> 学生にならなければならなかった")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "完成前置後解鎖" })[0]).toBeDisabled();
    expect(screen.getByRole("button", { name: "開始挑戰" })).toBeInTheDocument();
    expect(screen.queryByText("答題方式")).not.toBeInTheDocument();
  });

  it("starts the first prerequisite from the hero", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole("button", { name: "開始第 1 關" })[0]);

    expect(screen.getByRole("button", { name: "く/に修飾" })).toHaveClass("selected");
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("修飾形・く/に")).toBeInTheDocument();
  });

  it("unlocks obligation past only after prerequisite forms are correct", async () => {
    const user = userEvent.setup();
    seedProgress(["adverbial", "nai", "negativeTe", "negativeContinuative", "plainPastNegative", "te", "ta"]);
    render(<App />);

    expect(screen.getAllByRole("heading", { name: "必要過去" }).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: "練必要過去" })[0]);

    expect(screen.getByRole("button", { name: "必要過去" })).toHaveClass("selected");
    expect(screen.getByText("学生")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "学生にならなければならなかった" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("必要過去・なければならなかった")).toBeInTheDocument();
  });

  it("starts a focused negative drill from the learning guide", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "練否定整理" }));

    expect(screen.getByText("練習重點")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "否定整理" })).toHaveClass("selected");
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("ない形")).toBeInTheDocument();
    expect(screen.getByText("書く")).toBeInTheDocument();
  });

  it("starts an adjective drill from the learning guide", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "練な形容詞" }));

    expect(screen.getByRole("button", { name: "な形容詞" })).toHaveClass("selected");
    expect(screen.getByText("静か")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("普通形・非過去肯定")).toBeInTheDocument();
  });

  it("starts a ku-ni modifier drill from the learning guide", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "練く/に修飾" }));

    expect(screen.getByRole("button", { name: "く/に修飾" })).toHaveClass("selected");
    expect(screen.getByText("高い")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "高く" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("修飾形・く/に")).toBeInTheDocument();
  });

  it("starts an obligation past drill from the learning guide", async () => {
    const user = userEvent.setup();
    seedProgress(["adverbial", "nai", "negativeTe", "negativeContinuative", "plainPastNegative", "te", "ta"]);
    render(<App />);

    await user.click(screen.getAllByRole("button", { name: "練必要過去" })[0]);

    expect(screen.getByRole("button", { name: "必要過去" })).toHaveClass("selected");
    expect(screen.getByText("学生")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "学生にならなければならなかった" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("必要過去・なければならなかった")).toBeInTheDocument();
  });

  it("starts the challenge from the learning path", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));

    expect(screen.getByText("練習重點")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "否定整理" })).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "書って" }));

    expect(screen.getByText("再想一下")).toBeInTheDocument();
    expect(screen.getByText("正解：書いて")).toBeInTheDocument();
    expect(screen.getByText(/一類動詞/)).toBeInTheDocument();
  });

  it("adds missed questions to the review panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "書って" }));

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

  it("switches the interface to English and stores the preference", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("button", { name: "Learn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Challenge" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "先分清楚く / に" }).length).toBeGreaterThan(0);
    expect(localStorage.getItem("jabiko.language")).toBe("en");
  });

  it("switches the interface to Korean and stores the preference", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "한국어" }));

    expect(screen.getByRole("button", { name: "학습" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "도전" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "先分清楚く / に" }).length).toBeGreaterThan(0);
    expect(localStorage.getItem("jabiko.language")).toBe("ko");
  });

  it("loads the stored English preference", () => {
    localStorage.setItem("jabiko.language", "en");

    render(<App />);

    expect(screen.getByRole("button", { name: "Learn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Challenge" })).toBeInTheDocument();
  });

  it("loads a supported language from the URL and stores the preference", () => {
    localStorage.setItem("jabiko.language", "en");
    window.history.replaceState({}, "", "/?lang=ko");

    render(<App />);

    expect(screen.getByRole("button", { name: "학습" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "도전" })).toBeInTheDocument();
    expect(localStorage.getItem("jabiko.language")).toBe("ko");
  });
});
