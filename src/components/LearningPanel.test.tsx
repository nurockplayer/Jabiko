import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LearningPanel } from "./LearningPanel";
import { learningBlocks } from "../domain/learningBlocks";
import { FuriganaContext } from "./furiganaContext";

// #608 P0: on phones the 74-button chapter index used to sit ABOVE the lesson,
// pushing the material ~7000px down. The mobile chapter bar surfaces the
// current chapter + progress, prev/next, and a collapsible index. It renders
// unconditionally (desktop hides it with CSS), so jsdom can exercise it.
function renderPanel(onOpenKana = vi.fn()) {
  render(
    <LearningPanel
      language="zh-Hant"
      progressAttempts={[]}
      reviewCount={0}
      onStartChallenge={vi.fn()}
      onStartReview={vi.fn()}
      onStartDrill={vi.fn()}
      onStartPatternDrill={vi.fn()}
      onStartExamSection={vi.fn()}
      onStartKanaDrill={vi.fn()}
      onStartStarterDrill={vi.fn()}
      onOpenKana={onOpenKana}
    />
  );
  return onOpenKana;
}

const basicBlocks = learningBlocks.filter((block) => block.group === "basic");
const originalScrollIntoView = Element.prototype.scrollIntoView;

afterEach(() => {
  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    delete (Element.prototype as { scrollIntoView?: Element["scrollIntoView"] }).scrollIntoView;
  }
});

function renderPanelWithFurigana(enabled: boolean) {
  return render(
    <FuriganaContext.Provider value={{ enabled }}>
      <LearningPanel
        language="zh-Hant"
        progressAttempts={[]}
        reviewCount={0}
        onStartChallenge={vi.fn()}
        onStartReview={vi.fn()}
        onStartDrill={vi.fn()}
        onStartPatternDrill={vi.fn()}
        onStartExamSection={vi.fn()}
        onStartKanaDrill={vi.fn()}
        onStartStarterDrill={vi.fn()}
        onOpenKana={vi.fn()}
      />
    </FuriganaContext.Provider>
  );
}

describe("LearningPanel mobile chapter bar (#608)", () => {
  it("shows the current chapter title and progress position", () => {
    renderPanel();
    const bar = screen.getByTestId("chapter-mobile-bar");
    // Fresh learner: the first chapter is recommended, so 1 / total.
    expect(bar.textContent).toContain(`1 / ${basicBlocks.length}`);
    expect(bar.textContent).toContain(basicBlocks[0].title);
  });

  it("navigates with 下一章 / 上一章 and disables prev on the first chapter", () => {
    renderPanel();
    const next = screen.getByRole("button", { name: "下一章" });
    const prev = screen.getByRole("button", { name: "上一章" });
    expect(prev).toBeDisabled();

    fireEvent.click(next);
    expect(screen.getByTestId("chapter-mobile-bar").textContent).toContain(
      `2 / ${basicBlocks.length}`
    );
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(basicBlocks[1].title);
    expect(prev).not.toBeDisabled();

    fireEvent.click(prev);
    expect(screen.getByTestId("chapter-mobile-bar").textContent).toContain(
      `1 / ${basicBlocks.length}`
    );
    expect(screen.getByRole("button", { name: "上一章" })).toBeDisabled();
  });

  // #619: kana chapters link out to the standalone /kana reference chart.
  it("offers the full kana chart link on kana chapters", () => {
    const onOpenKana = renderPanel();
    // Default selection for a fresh learner is the first chapter (五十音).
    const link = screen.getByRole("button", { name: /五十音表/ });
    fireEvent.click(link);
    expect(onOpenKana).toHaveBeenCalled();
  });

  it("toggles the chapter index open and closes it again when a chapter is picked", () => {
    renderPanel();
    const toggle = screen.getByTestId("chapter-mobile-toggle");
    const index = screen.getByRole("complementary", { name: "學習章節" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(index.className).not.toContain("mobile-open");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(index.className).toContain("mobile-open");

    // Picking a chapter from the list selects it AND collapses the index so
    // the material is immediately in view.
    const target = screen.getByRole("tab", {
      name: (name) => name.includes(basicBlocks[2].title)
    });
    fireEvent.click(target);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(index.className).not.toContain("mobile-open");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(basicBlocks[2].title);
  });
});

describe("LearningPanel chapter navigation (#787)", () => {
  it("exposes the chapter rail as a labelled vertical tabs composite", () => {
    renderPanel();

    const tablist = screen.getByRole("tablist", { name: "學習章節" });
    expect(tablist).toHaveAttribute("aria-orientation", "vertical");
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(basicBlocks.length);
    expect(tabs[0]).toHaveAttribute("id", `chapter-tab-${basicBlocks[0].id}`);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).not.toHaveAttribute("aria-pressed");
    expect(tabs.slice(1).every((tab) => tab.getAttribute("aria-selected") === "false")).toBe(true);

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", tabs[0].id);
    expect(document.getElementById(panel.getAttribute("aria-labelledby")!)).toBe(tabs[0]);
  });

  it("keeps an Arrow-navigated chapter visible within the bounded index", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderPanel();
    const chapterButtons = screen.getAllByRole("tab", {
      name: (name) => name.startsWith("查看：")
    });

    chapterButtons[0].focus();
    fireEvent.keyDown(chapterButtons[0], { key: "ArrowDown" });

    expect(chapterButtons[1]).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("keeps the long chapter index to one tab stop and supports arrow navigation", () => {
    renderPanel();
    const chapterButtons = screen.getAllByRole("tab", {
      name: (name) => name.startsWith("查看：")
    });

    expect(chapterButtons[0]).toHaveAttribute("tabindex", "0");
    expect(chapterButtons.slice(1).every((button) => button.tabIndex === -1)).toBe(true);

    chapterButtons[0].focus();
    fireEvent.keyDown(chapterButtons[0], { key: "ArrowDown" });

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(basicBlocks[1].title);
    expect(chapterButtons[1]).toHaveFocus();
    expect(chapterButtons[0]).toHaveAttribute("aria-selected", "false");
    expect(chapterButtons[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", chapterButtons[1].id);

    fireEvent.keyDown(chapterButtons[1], { key: "ArrowUp" });
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(basicBlocks[0].title);
    expect(chapterButtons[0]).toHaveFocus();
  });

  it("moves keyboard focus from a chosen chapter into its content and primary action", async () => {
    const user = userEvent.setup();
    renderPanel();
    const chapterButtons = screen.getAllByRole("tab", {
      name: (name) => name.startsWith("查看：")
    });

    chapterButtons[0].focus();
    await user.keyboard("{ArrowDown}{Enter}");

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent(basicBlocks[1].title);
    expect(heading).toHaveFocus();

    await user.tab();
    expect(document.activeElement).toHaveClass("inline-drill-button");
  });
});

describe("LearningPanel furigana (#618)", () => {
  const target = learningBlocks.find((block) => block.id === "verb-types")!;

  function openTargetChapter() {
    fireEvent.click(
      screen.getByRole("tab", {
        name: (name) => name.includes(target.title)
      })
    );
  }

  it("keeps learning text plain when furigana is off", () => {
    const { container } = renderPanelWithFurigana(false);
    openTargetChapter();
    expect(container.querySelector(".chapter-content rt")).toBeNull();
  });

  it("adds ruby to the focus formula, examples, and pitfalls when enabled", async () => {
    const { container } = renderPanelWithFurigana(true);
    openTargetChapter();

    await waitFor(() => {
      expect(container.querySelector(".focus-formula rt")).not.toBeNull();
      expect(container.querySelector(".pipeline-card code rt")).not.toBeNull();
      expect(container.querySelector(".block-pitfalls li rt")).not.toBeNull();
    }, { timeout: 3_000 });
  });
});
