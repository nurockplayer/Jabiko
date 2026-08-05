import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModePicker } from "./ModePicker";
import type { PracticeSession } from "../../hooks/usePracticeSession";
import type { Language } from "../../i18n";
import type { LevelRange } from "../../domain/levelRange";

// ModePicker is a pure presentation component over the practice session's
// state + handlers, so a full mock prop object exercises the render paths
// without mounting the hook.
const base = {
  language: "zh-Hant" as Language,
  partOfSpeech: "mixed",
  verbGroup: "all",
  practiceFocus: "single",
  practiceMode: "vocab",
  levelRange: "all" as LevelRange,
  showLevelRange: true,
  selectedForm: "reading",
  setVerbGroup: vi.fn(),
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
  applyModePreset: vi.fn(),
  handleLevelRangeChange: vi.fn(),
  resetSession: vi.fn()
} satisfies Pick<PracticeSession, "partOfSpeech" | "verbGroup" | "practiceFocus" | "practiceMode" | "levelRange" | "showLevelRange" | "selectedForm" | "setVerbGroup" | "setTargetForm" | "compatibleForms" | "isVerbCapable" | "availableFocusOptions" | "focusSummary" | "reviewQueue" | "bookmarkedQuestions" | "modeCounts" | "handlePartOfSpeechChange" | "handlePracticeFocusChange" | "applyModePreset" | "handleLevelRangeChange" | "resetSession"> & {
  language: Language;
};

function renderPicker(overrides: Partial<typeof base> = {}) {
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
