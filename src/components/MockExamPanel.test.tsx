import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MockExamPanel } from "./MockExamPanel";
import { N4_BLUEPRINT, N5_BLUEPRINT } from "../domain/mockExam";

const noop = () => {};

function renderPanel() {
  render(<MockExamPanel language="zh-Hant" onStartSection={noop} />);
}

// 模擬考 mode 的 level picker 與 section list（#703：接入 #702 的 N4/N5
// blueprints）。picker 順序固定 N1→N5；選 level 後只消費該級 blueprint 的
// sections；沒有題目的 section 沿用「準備中」UI，不建立空 challenge。
describe("MockExamPanel level picker (#703)", () => {
  it("renders the level picker in fixed N1–N5 order", () => {
    renderPanel();
    const picker = screen.getByRole("group", { name: "等級" });
    const buttons = within(picker).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "N1",
      "N2",
      "N3",
      "N4",
      "N5"
    ]);
  });

  it("marks only the active level as selected when switching levels", () => {
    renderPanel();
    const levelButtons = () => screen.getAllByRole("button", { name: /^N[1-5]$/ });

    fireEvent.click(levelButtons()[3]); // N4
    expect(levelButtons()[3]).toHaveClass("selected");
    expect(
      levelButtons().filter((button) => button.classList.contains("selected"))
    ).toHaveLength(1);

    fireEvent.click(levelButtons()[0]); // N1
    expect(levelButtons()[0]).toHaveClass("selected");
    expect(levelButtons()[3]).not.toHaveClass("selected");
  });

  it("keeps the picker accessible (fieldset + legend, focusable buttons)", () => {
    renderPanel();
    const picker = screen.getByRole("group", { name: "等級" });
    const buttons = within(picker).getAllByRole("button");
    buttons[0].focus();
    expect(buttons[0]).toHaveFocus();
  });
});

describe("MockExamPanel N4 / N5 blueprints (#703)", () => {
  it("selecting N4 shows exactly the N4 blueprint sections", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "N4" }));
    for (const section of N4_BLUEPRINT.sections) {
      expect(screen.getByText(section.labelJa)).toBeInTheDocument();
    }
  });

  it("selecting N5 shows exactly the N5 blueprint sections", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "N5" }));
    for (const section of N5_BLUEPRINT.sections) {
      expect(screen.getByText(section.labelJa)).toBeInTheDocument();
    }
  });

  it("an N5 section with authored items shows its live count, not 準備中", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "N5" }));
    // 漢字読み has authored N5 items (n5.ts), so it is a startable card.
    const reading = screen.getByRole("button", { name: /漢字読み/ });
    expect(reading).toHaveTextContent("題");
    expect(reading).not.toHaveTextContent("準備中");
  });

  it("the newly authored N4 表記 and 語順組合 pools are startable with live counts (#665)", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "N4" }));
    for (const label of ["表記", "文の文法 2（文の組み立て）"]) {
      const section = screen.getByRole("button", { name: new RegExp(label) });
      expect(section).toHaveTextContent("17 題");
      expect(section).not.toHaveTextContent("準備中");
    }
  });

  it("starting a section calls onStartSection with the level and matching promptLabel", () => {
    const onStartSection = vi.fn();
    render(<MockExamPanel language="zh-Hant" onStartSection={onStartSection} />);
    fireEvent.click(screen.getByRole("button", { name: "N5" }));
    fireEvent.click(screen.getByRole("button", { name: /漢字読み/ }));
    expect(onStartSection).toHaveBeenCalledWith("N5", "漢字読み");
  });
});

describe("MockExamPanel level switching (#703)", () => {
  it("switching N5→N4→N1 leaves no stale sections from the previous level", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "N5" }));
    // N5 drops 詞彙用法 (N4+ only), so it must be absent.
    expect(screen.queryByText("詞彙用法")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "N4" }));
    expect(screen.getByText("詞彙用法")).toBeInTheDocument();
    // 内容理解（長文） is N3-only, never present at N4.
    expect(screen.queryByText("内容理解（長文）")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "N1" }));
    // N1 has no 表記 (N2+ only) and no 内容理解（長文）.
    expect(screen.queryByText("表記")).not.toBeInTheDocument();
    expect(screen.queryByText("内容理解（長文）")).not.toBeInTheDocument();
  });

  it("N1–N3 picker and sections behave as before", () => {
    renderPanel();
    // Default level is N2.
    expect(screen.getByText("漢字読み")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "N1" }));
    expect(screen.getByText("統合理解")).toBeInTheDocument();
    expect(screen.queryByText("表記")).not.toBeInTheDocument();
  });
});
