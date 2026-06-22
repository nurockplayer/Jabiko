import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
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

// Default landing changed from "learn" to "home" so the first-time UX
// is a dashboard with four entry cards instead of dropping the learner
// straight into the chapter list. Every test that depends on Learn
// being visible needs this helper to navigate there first.
async function gotoLearn(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "學習" }));
}

describe("App", () => {
  // The challenge / mock / kanji views are React.lazy in App, and
  // React.lazy only suspends on its first resolution. Prime the chunks
  // once here so every test below renders them synchronously regardless of
  // run order -- otherwise whichever test first navigates to a view would
  // run its synchronous assertions before the lazy chunk finished loading.
  beforeAll(async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });
    await user.click(screen.getByRole("button", { name: "模擬考" }));
    await screen.findByRole("region", { name: "模擬考" });
    await user.click(screen.getByRole("button", { name: "漢字" }));
    await screen.findByRole("heading", { name: /漢字音読み/ });
    unmount();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    window.history.replaceState({}, "", "/");
  });

  it("renders the home dashboard with the four-tab nav by default", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /自習室/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "首頁" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "學習" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "規則表" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "挑戰" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "模擬考" })).toBeInTheDocument();
    // Home hero copy + at least one entry card heading.
    expect(screen.getByRole("heading", { name: /今天想練什麼/ })).toBeInTheDocument();
    // Chapter index belongs to Learn view; not visible on Home.
    expect(screen.queryByRole("heading", { name: "一章一章解鎖" })).not.toBeInTheDocument();
  });

  it("opens the rules reference page after clicking the 規則表 tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "規則表" }));

    // Rules page banner + the full v2 eight-table set.
    expect(screen.getByRole("heading", { name: /動詞變化 速查/ })).toBeInTheDocument();
    // v1 tables (verb basics):
    expect(screen.getByRole("heading", { name: "動詞 三類分類" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ます形" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /一類動詞 て形・た形/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /一類例外動詞/ })).toBeInTheDocument();
    // v2 tables (advanced + adjectives + obligation past + patterns):
    expect(
      screen.getByRole("heading", { name: /動詞 進階形 速查/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /形容詞・名詞 變化四格/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /必要過去 step-by-step/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /句型 cheat sheet/ })).toBeInTheDocument();
  });

  it("shows the chapter index after clicking the Learn tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);

    expect(screen.getByRole("heading", { name: "一章一章解鎖" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "先分清楚く / に" }).length).toBeGreaterThan(0);
    expect(screen.getByText("高い -> 高く")).toBeInTheDocument();
    expect(screen.getByText("静か -> 静かに")).toBeInTheDocument();
    expect(screen.getByText("学生 -> 学生に")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "練く/に修飾" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：ない形家族" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看：動詞て形 / た形（一類音便重點）" })
    ).toBeInTheDocument();
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

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "查看：ない形家族" }));

    expect(screen.getByRole("heading", { name: "ない形家族" })).toBeInTheDocument();
    expect(screen.getAllByText("書かない -> 書かなかった").length).toBeGreaterThan(1);
    expect(screen.getByRole("button", { name: "練否定整理" })).toBeInTheDocument();
    expect(screen.queryByText("学生 -> 学生にならなければならなかった")).not.toBeInTheDocument();
  });

  it("starts the first prerequisite from the recommended chapter CTA", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    // Default-active chapter is "先分清楚く / に"; its く/に drill button is
    // the equivalent of the old "開始第 1 關" hero CTA.
    await user.click(screen.getByRole("button", { name: "練く/に修飾" }));

    expect(screen.getByRole("button", { name: "く/に修飾" })).toHaveClass("selected");
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("修飾形・く/に")).toBeInTheDocument();
  });

  it("starts a focused negative drill from the learning guide", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
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

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "練な形容詞" }));

    expect(screen.getByRole("button", { name: "な形容詞" })).toHaveClass("selected");
    expect(screen.getByText("静か")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("普通形・非過去肯定")).toBeInTheDocument();
  });

  it("starts a ku-ni modifier drill from the learning guide", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "練く/に修飾" }));

    expect(screen.getByRole("button", { name: "く/に修飾" })).toHaveClass("selected");
    expect(screen.getByText("高い")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "高く" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("修飾形・く/に")).toBeInTheDocument();
  });

  it("renders the new verb-basic blocks and runs a ます drill from the ます chapter", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
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

  it("renders the new sentence-pattern reference chapters and reaches their related drill", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    // All four B2 chapters surface in the chapter list (smoke check).
    expect(
      screen.getByRole("button", { name: "查看：てください / てもいい / てはいけない" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：なくてもいい（不必）" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看：てもらう / てくれる / てあげる" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看：と思う / と言う（引用・意見）" })
    ).toBeInTheDocument();

    // For each new chapter, walk: open chapter → confirm an example
    // renders → click the related drill → confirm the practice region
    // lands on the expected target form. This catches drill-mapping
    // regressions on any of the four chapters individually.
    type DrillCase = { chapter: string; example: string; drill: string; form: string | RegExp };
    const cases: DrillCase[] = [
      {
        chapter: "查看：てください / てもいい / てはいけない",
        example: "書く → 書いてください",
        drill: "練一類て/た",
        form: "て形"
      },
      {
        chapter: "查看：なくてもいい（不必）",
        example: "書く → 書かなくてもいい",
        drill: "練否定整理",
        form: "ない形"
      },
      {
        chapter: "查看：てもらう / てくれる / てあげる",
        example: "友達が 教えてくれた",
        drill: "練一類て/た",
        form: "て形"
      },
      {
        chapter: "查看：と思う / と言う（引用・意見）",
        example: "明日は雨だ → 明日は雨だと思う",
        drill: "練普通形",
        // The plain focus shuffles across all four plain forms; any of
        // the four 普通形・... labels is acceptable as the first
        // question's form. Match the prefix only.
        form: /普通形・/
      }
    ];

    for (const { chapter, example, drill, form } of cases) {
      // Return to the learning view (idempotent if already there).
      await gotoLearn(user);
      await user.click(screen.getByRole("button", { name: chapter }));
      expect(screen.getByText(example)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: drill }));
      expect(within(screen.getByRole("region", { name: "目前題目" })).getByText(form)).toBeInTheDocument();
    }
  });

  it("launches the sentence-pattern drill from each reference chapter's pattern button", async () => {
    // The 4 reference chapters now expose a primary pattern-drill
    // button (above the existing form-variation drill). Clicking it
    // should set the challenge page to "句型練習" mode filtered to
    // that chapter's pattern, and the first question's prompt label
    // should reflect the pattern.
    const user = userEvent.setup();
    type PatternCase = {
      chapter: string;
      drill: string;
      promptLabelFragment: RegExp;
    };
    const cases: PatternCase[] = [
      {
        chapter: "查看：てください / てもいい / てはいけない",
        drill: "練句型：請求 / 許可 / 禁止",
        promptLabelFragment: /請求 \/ 許可 \/ 禁止/
      },
      {
        chapter: "查看：なくてもいい（不必）",
        drill: "練句型：不必 vs 必須",
        promptLabelFragment: /不必 \/ 必須/
      },
      {
        chapter: "查看：てもらう / てくれる / てあげる",
        drill: "練句型：授受視角",
        promptLabelFragment: /授受視角/
      },
      {
        chapter: "查看：と思う / と言う（引用・意見）",
        drill: "練句型：引用 / 意見",
        promptLabelFragment: /引用 \/ 意見/
      }
    ];

    render(<App />);

    for (const { chapter, drill, promptLabelFragment } of cases) {
      await gotoLearn(user);
      await user.click(screen.getByRole("button", { name: chapter }));
      await user.click(screen.getByRole("button", { name: drill }));
      // Challenge page: "句型練習" mode card is selected and the
      // question header includes the pattern label.
      expect(screen.getByRole("button", { name: /句型練習/ })).toHaveClass("selected");
      expect(
        within(screen.getByRole("region", { name: "目前題目" })).getByText(promptLabelFragment)
      ).toBeInTheDocument();
    }
  });

  it("renders reference chapters with '參考' badge and a drill-note", async () => {
    // Reference chapters (verb-types + the 4 sentence-pattern chapters)
    // have no requiredForms and should never get marked "完成". Their
    // status badge says "參考"; sentence-pattern chapters carry an
    // explicit drillNote saying the linked drill is a prerequisite-form
    // practice, not the chapter's own pattern.
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    const referenceChapter = screen.getByRole("button", {
      name: "查看：てください / てもいい / てはいけない"
    });
    expect(referenceChapter.textContent).toContain("參考");

    await user.click(referenceChapter);
    expect(
      screen.getByText(/上方按鈕直接練本章句型判斷.*前置「て形」音便/)
    ).toBeInTheDocument();
  });

  it("renders a soft '建議先看' hint on chapters whose prereqs are incomplete", async () => {
    // Empty progress: 必要過去's three prereqs (adverbial / negative /
    // teTa) are all incomplete. The chapter-list subtitle should show
    // the hint instead of the block's default subtitle. The hint is
    // informational only -- the chapter itself is still openable and
    // the drill CTA still renders (covered by the next test).
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    const obligationButton = screen.getByRole("button", { name: "查看：必要過去" });
    expect(obligationButton.textContent).toContain("建議先看");
    expect(obligationButton.textContent).toContain("先分清楚く / に");
    expect(obligationButton).toBeEnabled();
  });

  it("starts an obligation past drill from the learning guide without prereqs", async () => {
    // No seedProgress -- with the unlock gate removed, 必要過去 must be
    // drillable cold. (Previously this required seeded prereq progress
    // and the drill was hidden otherwise.)
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "查看：必要過去" }));
    await user.click(screen.getAllByRole("button", { name: "練必要過去" })[0]);

    expect(screen.getByRole("button", { name: "必要過去" })).toHaveClass("selected");
    expect(screen.getByText("学生")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "学生にならなければならなかった" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("必要過去・なければならなかった")).toBeInTheDocument();
  });

  it("runs review as a finite pass and shows a completion screen (no infinite loop)", async () => {
    // Seed one wrong attempt on a real exam question so it's due in the
    // SRS review queue (box 0, due immediately).
    localStorage.setItem(
      "jabiko:attempts",
      JSON.stringify([
        {
          questionId: "n1-grammar-yainaya",
          vocabularyId: "n1-grammar-yainaya",
          targetForm: "meaning",
          prompt: "seed",
          expectedAnswers: ["や否や"],
          submittedAnswer: "x",
          isCorrect: false,
          timestamp: 1000,
          responseTimeMs: 100
        }
      ])
    );

    const user = userEvent.setup();
    render(<App />);

    // Home banner surfaces the due item; clicking it enters review mode.
    await user.click(screen.getByRole("button", { name: /等待複習/ }));

    // The single due question renders; answer it, then advance.
    expect(screen.getByRole("button", { name: "や否や" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "や否や" }));
    await user.click(screen.getByRole("button", { name: "下一題" }));

    // Finite pass -> completion screen, NOT a wrapped-around next question.
    expect(screen.getByRole("heading", { name: "複習完成！" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "や否や" })).not.toBeInTheDocument();
  });

  it("does not leak the answer in the pre-answer vocab row of an exam item", async () => {
    // n1-grammar-yainaya: surface や否や (== the answer), reading やいなや.
    // The old ExamPrompt rendered "surface・reading・meaning" pre-answer,
    // handing over the answer. Now that row is suppressed for items
    // whose surface/reading IS an expected answer.
    localStorage.setItem(
      "jabiko:attempts",
      JSON.stringify([
        {
          questionId: "n1-grammar-yainaya",
          vocabularyId: "n1-grammar-yainaya",
          targetForm: "meaning",
          prompt: "seed",
          expectedAnswers: ["や否や"],
          submittedAnswer: "x",
          isCorrect: false,
          timestamp: 1000,
          responseTimeMs: 100
        }
      ])
    );

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /等待複習/ }));

    // The answer is offered as a choice...
    expect(screen.getByRole("button", { name: "や否や" })).toBeInTheDocument();
    // ...but the reading row that used to spell it out is gone.
    expect(screen.queryByText(/やいなや/)).not.toBeInTheDocument();
  });

  it("starts a 今日練習 session from the home entry", async () => {
    const user = userEvent.setup();
    render(<App />);

    // The prominent home CTA launches the mixed daily session.
    await user.click(screen.getByRole("button", { name: /開始今日練習/ }));

    // Lands in the challenge view with a question and the 今日練習 mode
    // card selected.
    await screen.findByRole("region", { name: "目前題目" });
    expect(screen.getByRole("button", { name: /今日練習/ })).toHaveClass("selected");
  });

  it("mock exam is a section picker that launches a filtered exam drill", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "模擬考" }));

    // Section cards from the N2 blueprint render; the grammar section has
    // items, so its card is enabled and clickable.
    const grammarCard = screen.getByRole("button", { name: /文の文法 1/ });
    await user.click(grammarCard);

    // Lands in the challenge drill, exam mode filtered to that section
    // (prompt-header shows the section's promptLabel).
    expect(
      within(screen.getByRole("region", { name: "目前題目" })).getByText("文法形式選擇")
    ).toBeInTheDocument();
  });

  it("starts the challenge from the learning path", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
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

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "書いて" }));

    expect(screen.getByRole("heading", { name: "正解" })).toBeInTheDocument();
  });

  it("keeps the current question on screen after answering (no mid-attempt reshuffle)", async () => {
    // Regression: progressAttempts changes used to cascade through
    // reviewQueue into the questions useMemo deps, reshuffling the
    // pool on every answer. The user saw "答題後跳下一題、不能答、
    // 解析還在；按下一題又跳一題". After the fix, currentQuestion
    // stays put until the learner explicitly hits 下一題.
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));

    // Default first question in basic mode is 書く -> て形.
    expect(screen.getByText("書く")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "書いて" }));

    // Feedback overlays, the question itself is unchanged.
    expect(screen.getByRole("heading", { name: "正解" })).toBeInTheDocument();
    expect(screen.getByText("書く")).toBeInTheDocument();

    // Only after explicit advance does the question change.
    await user.click(screen.getByRole("button", { name: "下一題" }));
    expect(screen.queryByRole("heading", { name: "正解" })).not.toBeInTheDocument();
    // Next question per the te-form shuffle is 聞く (matches existing
    // "moves to the next question with Enter" test below).
    expect(screen.getByText("聞く")).toBeInTheDocument();
  });

  it("shows the accepted answer and explanation when the learner picks a wrong choice", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "書って" }));

    expect(screen.getByText("再想一下")).toBeInTheDocument();
    expect(screen.getByText("正解：書いて")).toBeInTheDocument();
    expect(screen.getByText(/一類動詞/)).toBeInTheDocument();
  });

  it("adds missed questions to the review panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "書って" }));

    expect(screen.getByRole("heading", { name: "錯題複習" })).toBeInTheDocument();
    expect(screen.getByText("書く -> て形")).toBeInTheDocument();
  });

  it("moves to the next question with Enter after feedback", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "書いて" }));
    await user.keyboard("{Enter}");

    expect(screen.getByText("聞く")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "聞いて" })).toBeInTheDocument();
  });

  it("answers the MCQ drill with the matching number key (1-4)", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));

    // Options are shuffled, so find 書いて's slot and press its 1-based
    // position. The number key must select AND submit that option, even
    // with focus outside the drill (a global, focus-independent shortcut).
    const grid = screen.getByLabelText("答案選項");
    const options = within(grid).getAllByRole("button");
    const correctSlot = options.findIndex((button) => button.textContent === "書いて");
    expect(correctSlot).toBeGreaterThanOrEqual(0);

    await user.keyboard(String(correctSlot + 1));

    expect(screen.getByRole("heading", { name: "正解" })).toBeInTheDocument();
  });

  it("ignores a number key past the option count", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));

    // Only 4 options exist; pressing 9 must not submit anything.
    await user.keyboard("9");

    expect(screen.queryByRole("heading", { name: "正解" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "再想一下" })).not.toBeInTheDocument();
  });

  it("lets the learner focus on negative transformations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "否定整理" }));

    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("ない形")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "下一題" }));

    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("否定て形・ないで")).toBeInTheDocument();
  });

  it("lets the learner practice noun-like transformations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    await user.click(screen.getByRole("button", { name: "名詞" }));

    expect(screen.getByText("学生")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("普通形・非過去否定")).toBeInTheDocument();
  });

  it("defaults to light theme and stores a dark preference when toggled", async () => {
    // First-time default switched from dark to light when the wafuu
    // paper palette landed. Dark theme is still selectable via the
    // toggle, and explicit localStorage preferences (covered by the
    // two tests below) override the default in either direction.
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "深色模式" })).toBeInTheDocument();

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

  it("loads the stored light theme preference", () => {
    localStorage.setItem("jabiko.theme", "light");

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "深色模式" })).toBeInTheDocument();
  });

  it("lists 綜合考題庫 / N1 備考 / N2 備考 as side-by-side mode presets", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    // The exam pool's level ranges are now first-class mode cards, not an
    // in-mode "題庫範圍" segmented filter.
    const exam = screen.getByRole("button", { name: /綜合考題庫/ });
    const n1 = screen.getByRole("button", { name: /N1 備考/ });
    const n2 = screen.getByRole("button", { name: /N2 備考/ });
    expect(exam).toBeInTheDocument();
    expect(n1).toBeInTheDocument();
    expect(n2).toBeInTheDocument();
    expect(screen.queryByText("題庫範圍")).toBeNull();

    // Picking N2 備考 activates it (exam mode + N2+N3 range) and deselects
    // 綜合. The pool actually narrowing to N2/N3 is covered by
    // levelRange.test.ts (buildExamQuestionPool(["N2","N3"]) excludes N1).
    await user.click(n2);
    expect(n2).toHaveAttribute("aria-pressed", "true");
    expect(exam).toHaveAttribute("aria-pressed", "false");
    // The active-mode summary reflects the picked preset's copy (examN2
    // 「N2＋N3 綜合題」), not the generic 綜合 text -- so that copy now
    // appears on BOTH the N2 備考 card and the summary (>= 2 occurrences).
    expect(screen.getAllByText(/N2＋N3 綜合題/).length).toBeGreaterThanOrEqual(2);
  });

  it("opens 今日練習 by default when entering the challenge tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    // Entering the challenge tab lands on the guided 今日練習 mixed session,
    // not the raw 基礎變化 setup cascade, so the learner is practising on
    // arrival rather than configuring four selectors first.
    expect(screen.getByRole("button", { name: /今日練習/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /基礎變化/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows accuracy in the 今日戰報 stats block, not on the 錯題複習 heading", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    // Accuracy is a labelled value with a progress bar, both owned by the
    // 今日戰報 block (now sitting atop the right-hand 錯題複習 column).
    const scoreReport = screen.getByLabelText("今日戰報");
    expect(within(scoreReport).getByText("目前正解率")).toBeInTheDocument();
    expect(within(scoreReport).getByRole("progressbar")).toBeInTheDocument();

    // The 錯題複習 heading itself still does not carry the percentage
    // (which previously read as a mistake-list count).
    const reviewHeading = screen.getByRole("heading", { name: "錯題複習" });
    expect(reviewHeading.textContent ?? "").not.toMatch(/%/);
  });

  it("opens the 漢字音読み table and shows example words for a kanji", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "漢字" }));

    // The table renders, grouped by homophone family.
    expect(await screen.findByRole("heading", { name: /漢字音読み/ })).toBeInTheDocument();
    // Tap the 解 kanji cell -> its example words (from the vocab bank) show.
    await user.click(screen.getByRole("button", { name: /解.*かい/s }));
    expect(screen.getByText("例詞")).toBeInTheDocument();
    // 解決's reading is unique to the example row (its surface 解決 also
    // shows as its own meaningZh, so assert on the reading instead).
    expect(screen.getByText("かいけつ")).toBeInTheDocument();
  });

  it("exposes data-selected and data-result on choice buttons after answering", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    const grid = screen.getByLabelText("答案選項");
    const options = within(grid).getAllByRole("button");
    // Nothing flagged before answering.
    options.forEach((button) => {
      expect(button).not.toHaveAttribute("data-selected");
      expect(button).not.toHaveAttribute("data-result");
    });

    await user.click(options[0]);

    // Exactly one button carries data-selected="true" -- the one picked.
    const selected = grid.querySelectorAll('[data-selected="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toBe(options[0]);

    // The picked button gets a result. If wrong, the correct answer is
    // flagged target; if correct, there is no target.
    const result = options[0].getAttribute("data-result");
    expect(["correct", "wrong"]).toContain(result);
    if (result === "wrong") {
      const target = grid.querySelector('[data-result="target"]');
      expect(target).not.toBeNull();
      expect(target).not.toBe(options[0]);
    } else {
      expect(grid.querySelector('[data-result="target"]')).toBeNull();
    }
  });

  it("flags the correct answer with data-result=target when revealed", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    await user.click(screen.getByRole("button", { name: "看答案" }));

    const grid = screen.getByLabelText("答案選項");
    // Revealing flags the correct answer(s) as target, with nothing selected.
    expect(grid.querySelectorAll('[data-result="target"]').length).toBeGreaterThanOrEqual(1);
    expect(grid.querySelector('[data-selected="true"]')).toBeNull();
  });

  it("exposes the whole answer state on the drill container for embedded AI", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    const panel = await screen.findByRole("region", { name: "目前題目" });

    // Before answering: unanswered, with no selection / expected answer leaked.
    expect(panel).toHaveAttribute("data-result", "unanswered");
    expect(panel).not.toHaveAttribute("data-selected");
    expect(panel).not.toHaveAttribute("data-expected-answer");
    expect(panel).toHaveAttribute("data-question-id");

    const grid = screen.getByLabelText("答案選項");
    const options = within(grid).getAllByRole("button");
    await user.click(options[0]);

    // After answering: the container summarises selection + result + answer.
    expect(panel).toHaveAttribute("data-selected", options[0].textContent ?? "");
    expect(["correct", "wrong"]).toContain(panel.getAttribute("data-result"));
    expect(panel).toHaveAttribute("data-expected-answer");
  });

  it("marks the drill container revealed (no selection) after 看答案", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    const panel = await screen.findByRole("region", { name: "目前題目" });

    await user.click(screen.getByRole("button", { name: "看答案" }));

    // Revealing sets result=revealed, exposes the answer, with no selection.
    expect(panel).toHaveAttribute("data-result", "revealed");
    expect(panel).not.toHaveAttribute("data-selected");
    expect(panel).toHaveAttribute("data-expected-answer");
  });

});
