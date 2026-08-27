import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModePicker } from "./ModePicker";

type ModePickerProps = Parameters<typeof ModePicker>[0];

// ModePicker is a pure presentation component over the practice session's
// state + handlers, so a full mock prop object exercises the render paths
// without mounting the hook.
const base: ModePickerProps = {
  language: "zh-Hant",
  partOfSpeech: "mixed",
  practiceFilter: {},
  practiceFocus: "single",
  practiceMode: "vocab",
  levelRange: "all",
  showLevelRange: true,
  selectedForm: "reading",
  setTargetForm: vi.fn(),
  compatibleForms: ["reading", "meaning"],
  isVerbCapable: true,
  availableFocusOptions: [],
  focusSummary: "N1〜N5 漢字詞 · 選正確讀音（よみ）",
  reviewQueue: [],
  bookmarkedQuestions: [],
  modeCounts: {
    cloze: 10,
    pattern: 10,
    exam: 10,
    examN1: 10,
    examN2: 10,
    examN3: 10,
    examN4: 10,
    vocab: 400
  },
  handlePartOfSpeechChange: vi.fn(),
  handlePracticeFocusChange: vi.fn(),
  handlePracticeFilterChange: vi.fn(),
  applyModePreset: vi.fn(),
  handleLevelRangeChange: vi.fn(),
  resetSession: vi.fn()
};

function renderPicker(overrides: Partial<ModePickerProps> = {}) {
  return render(<ModePicker {...base} {...overrides} />);
}

describe("ModePicker vocab level-range picker (#668)", () => {
  it("offers n4n5 in the 単字 segmented control, alongside all / n1n2 / n2n3", () => {
    renderPicker();
    const segmented = screen.getByRole("group", { name: "題庫範圍" });
    const buttons = Array.from(segmented.querySelectorAll("button")).map((b) => b.textContent);
    expect(buttons).toEqual(["全部", "N1＋N2", "N2＋N3", "N4＋N5"]);
  });

  it("marks the active range pressed and forwards changes", () => {
    const handleLevelRangeChange = vi.fn();
    renderPicker({ levelRange: "n2n3", handleLevelRangeChange });

    expect(screen.getByRole("button", { name: "N2＋N3" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "N4＋N5" }));
    expect(handleLevelRangeChange).toHaveBeenCalledWith("n4n5");
  });

  it("does not offer the starter band (完全新手 drills 入門 content, never 単字)", () => {
    renderPicker();
    expect(screen.queryByRole("button", { name: "完全新手" })).not.toBeInTheDocument();
  });
});

describe("ModePicker basic composable filters (#789)", () => {
  it("renders compact accessible level and verb-group multi-selects", () => {
    const { container } = renderPicker({
      practiceMode: "basic",
      showLevelRange: false,
      partOfSpeech: "verb",
      practiceFilter: {
        levels: ["N3", "N4", "N5"],
        verbGroups: ["godan", "ichidan"]
      }
    });

    const levels = screen.getByRole("group", { name: "題庫範圍" });
    expect(Array.from(levels.querySelectorAll("button")).map((button) => button.textContent)).toEqual([
      "全部",
      "N1",
      "N2",
      "N3",
      "N4",
      "N5"
    ]);
    expect(within(levels).getByRole("button", { name: "全部" })).toHaveAttribute("aria-pressed", "false");
    expect(within(levels).getByRole("button", { name: "N3" })).toHaveAttribute("aria-pressed", "true");
    expect(within(levels).getByRole("button", { name: "N4" })).toHaveAttribute("aria-pressed", "true");
    expect(within(levels).getByRole("button", { name: "N5" })).toHaveAttribute("aria-pressed", "true");

    const groups = screen.getByRole("group", { name: "動詞類別" });
    expect(Array.from(groups.querySelectorAll("button")).map((button) => button.textContent)).toEqual([
      "全部",
      "一類",
      "二類",
      "三類"
    ]);
    expect(within(groups).getByRole("button", { name: "一類" })).toHaveAttribute("aria-pressed", "true");
    expect(within(groups).getByRole("button", { name: "二類" })).toHaveAttribute("aria-pressed", "true");
    expect(within(groups).getByRole("button", { name: "三類" })).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelectorAll(".level-segmented")).toHaveLength(2);
  });

  it("adds a level with keyboard activation and starts one canonical filter change", async () => {
    const user = userEvent.setup();
    const handlePracticeFilterChange = vi.fn();
    renderPicker({
      practiceMode: "basic",
      showLevelRange: false,
      partOfSpeech: "verb",
      practiceFilter: {
        levels: ["N3", "N5"],
        verbGroups: ["godan", "ichidan"]
      },
      handlePracticeFilterChange
    });

    const levels = screen.getByRole("group", { name: "題庫範圍" });
    const n4 = within(levels).getByRole("button", { name: "N4" });
    n4.focus();
    await user.keyboard("{Enter}");

    expect(handlePracticeFilterChange).toHaveBeenCalledTimes(1);
    expect(handlePracticeFilterChange).toHaveBeenCalledWith({
      levels: ["N3", "N4", "N5"],
      verbGroups: ["godan", "ichidan"]
    });
  });

  it("toggles multiple verb groups without collapsing to one scalar value", () => {
    const handlePracticeFilterChange = vi.fn();
    renderPicker({
      practiceMode: "basic",
      showLevelRange: false,
      partOfSpeech: "verb",
      practiceFilter: { levels: ["N5"], verbGroups: ["godan"] },
      handlePracticeFilterChange
    });

    const groups = screen.getByRole("group", { name: "動詞類別" });
    fireEvent.click(within(groups).getByRole("button", { name: "二類" }));

    expect(handlePracticeFilterChange).toHaveBeenCalledWith({
      levels: ["N5"],
      verbGroups: ["godan", "ichidan"]
    });
  });

  it("uses All to remove each restriction without changing the other filter", () => {
    const handlePracticeFilterChange = vi.fn();
    renderPicker({
      practiceMode: "basic",
      showLevelRange: false,
      partOfSpeech: "verb",
      practiceFilter: {
        levels: ["N3", "N4", "N5"],
        verbGroups: ["godan", "ichidan"]
      },
      handlePracticeFilterChange
    });

    const levels = screen.getByRole("group", { name: "題庫範圍" });
    fireEvent.click(within(levels).getByRole("button", { name: "全部" }));
    expect(handlePracticeFilterChange).toHaveBeenLastCalledWith({
      levels: undefined,
      verbGroups: ["godan", "ichidan"]
    });

    const groups = screen.getByRole("group", { name: "動詞類別" });
    fireEvent.click(within(groups).getByRole("button", { name: "全部" }));
    expect(handlePracticeFilterChange).toHaveBeenLastCalledWith({
      levels: ["N3", "N4", "N5"],
      verbGroups: undefined
    });
  });

  it("keeps both compact multi-select rows available at a mobile viewport", () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 360 });

    const { container } = renderPicker({
      practiceMode: "basic",
      showLevelRange: false,
      partOfSpeech: "verb",
      practiceFilter: {}
    });

    expect(container.querySelectorAll(".level-segmented")).toHaveLength(2);
    expect(screen.getByRole("group", { name: "題庫範圍" }).querySelectorAll("button")).toHaveLength(6);
    expect(screen.getByRole("group", { name: "動詞類別" }).querySelectorAll("button")).toHaveLength(4);

    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
  });
});
