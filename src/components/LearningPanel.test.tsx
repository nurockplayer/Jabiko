import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LearningPanel } from "./LearningPanel";
import { learningBlocks } from "../domain/learningBlocks";

// #608 P0: on phones the 74-button chapter index used to sit ABOVE the lesson,
// pushing the material ~7000px down. The mobile chapter bar surfaces the
// current chapter + progress, prev/next, and a collapsible index. It renders
// unconditionally (desktop hides it with CSS), so jsdom can exercise it.
function renderPanel() {
  return render(
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
    />
  );
}

const basicBlocks = learningBlocks.filter((block) => block.group === "basic");

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

  it("toggles the chapter index open and closes it again when a chapter is picked", () => {
    renderPanel();
    const toggle = screen.getByTestId("chapter-mobile-toggle");
    const index = screen.getByLabelText("學習章節");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(index.className).not.toContain("mobile-open");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(index.className).toContain("mobile-open");

    // Picking a chapter from the list selects it AND collapses the index so
    // the material is immediately in view.
    const target = screen.getByRole("button", {
      name: (name) => name.includes(basicBlocks[2].title)
    });
    fireEvent.click(target);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(index.className).not.toContain("mobile-open");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(basicBlocks[2].title);
  });
});
