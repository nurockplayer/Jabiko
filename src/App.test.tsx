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
    expect(screen.getByRole("heading", { name: "一章一章解鎖" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "先分清楚く / に" }).length).toBeGreaterThan(0);
    expect(screen.getByText("高い -> 高く")).toBeInTheDocument();
    expect(screen.getByText("静か -> 静かに")).toBeInTheDocument();
    expect(screen.getByText("学生 -> 学生に")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "練く/に修飾" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：ない形家族" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：動詞て形 / た形" })).toBeInTheDocument();
    // 必要過去 is always clickable now (no lock UI); only the active
    // chapter's body content is rendered, so its examples should not
    // appear in the default view.
    expect(screen.getByRole("button", { name: "查看：必要過去" })).toBeEnabled();
    expect(screen.queryByText("学生 -> 学生にならなければならなかった")).not.toBeInTheDocument();
    expect(screen.queryByText("否定て形・ないで")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "開始挑戰" })).toBeInTheDocument();
    expect(screen.queryByText("答題方式")).not.toBeInTheDocument();
  });

  it("shows a single chapter detail after selecting a chapter", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "查看：ない形家族" }));

    expect(screen.getByRole("heading", { name: "ない形家族" })).toBeInTheDocument();
    expect(screen.getAllByText("書かない -> 書かなかった").length).toBeGreaterThan(1);
    expect(screen.getByRole("button", { name: "練否定整理" })).toBeInTheDocument();
    expect(screen.queryByText("学生 -> 学生にならなければならなかった")).not.toBeInTheDocument();
  });

  it("starts the first prerequisite from the recommended chapter CTA", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Default-active chapter is "先分清楚く / に"; its く/に drill button is
    // the equivalent of the old "開始第 1 關" hero CTA.
    await user.click(screen.getByRole("button", { name: "練く/に修飾" }));

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

    await user.click(screen.getByRole("button", { name: "查看：ない形家族" }));
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

  it("renders the new verb-basic blocks and runs a ます drill from the ます chapter", async () => {
    const user = userEvent.setup();
    render(<App />);

    // The new chapters surface in the chapter list.
    expect(screen.getByRole("button", { name: "查看：ます形" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：可能形 (V られる)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：使役形 (V せる/させる)" })).toBeInTheDocument();

    // Open the ます chapter; its example formulas and drill button render.
    await user.click(screen.getByRole("button", { name: "查看：ます形" }));
    expect(screen.getByText("書く → 書きます")).toBeInTheDocument();
    expect(screen.getByText("食べる → 食べます")).toBeInTheDocument();

    // Click the drill CTA -- challenge page should land in basic mode
    // with the masu target form selected.
    await user.click(screen.getByRole("button", { name: "練ます形" }));
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("ます形")).toBeInTheDocument();
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

  it("redirects to the prereq chapter when prereqs are incomplete on 必要過去", async () => {
    const user = userEvent.setup();
    // No seedProgress -- start with a clean slate so 必要過去 has all
    // three recommended prereqs incomplete.
    render(<App />);

    // Open the 必要過去 chapter.
    await user.click(screen.getByRole("button", { name: "查看：必要過去" }));

    // The drill CTA must not be present: launching obligationPast
    // practice with the gate still on would silently fall back to a
    // single-form drill, which is the bug Codex flagged.
    expect(screen.queryByRole("button", { name: "練必要過去" })).not.toBeInTheDocument();

    // Instead, the chapter offers a one-click jump to the first
    // incomplete prereq (adverbial → "先分清楚く / に").
    const prereqCta = screen.getByRole("button", { name: "先看前置：先分清楚く / に" });
    expect(prereqCta).toBeInTheDocument();

    await user.click(prereqCta);

    // Active chapter switches to adverbial; obligationPast content no
    // longer rendered.
    expect(screen.getAllByRole("heading", { name: "先分清楚く / に" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("学生 -> 学生にならなければならなかった")).not.toBeInTheDocument();
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
