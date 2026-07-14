import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KanaTablePage } from "./KanaTablePage";

// #619: standalone /kana reference page — full hiragana + katakana charts
// (seion / dakuon / youon sections), romaji per cell, recognition-drill CTAs.
describe("KanaTablePage (#619)", () => {
  function renderPage(onStartKanaDrill = vi.fn()) {
    render(<KanaTablePage language="zh-Hant" onStartKanaDrill={onStartKanaDrill} />);
    return onStartKanaDrill;
  }

  it("renders both scripts with their group sections", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "平假名", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "片假名", level: 2 })).toBeInTheDocument();
    // Group sections appear once per script.
    expect(screen.getAllByRole("heading", { name: "清音", level: 3 })).toHaveLength(2);
    expect(screen.getAllByRole("heading", { name: "濁音・半濁音", level: 3 })).toHaveLength(2);
    expect(screen.getAllByRole("heading", { name: "拗音", level: 3 })).toHaveLength(2);
  });

  it("shows kana glyphs with romaji for both scripts", () => {
    renderPage();
    expect(screen.getByText("あ")).toBeInTheDocument();
    expect(screen.getByText("ア")).toBeInTheDocument();
    expect(screen.getByText("きゃ")).toBeInTheDocument();
    // romaji repeats across scripts (あ/ア both "a").
    expect(screen.getAllByText("a").length).toBeGreaterThanOrEqual(2);
  });

  it("fires the recognition drill CTA with the right script", () => {
    const onStartKanaDrill = renderPage();
    const buttons = screen.getAllByRole("button", { name: /認讀/ });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(buttons[0]);
    expect(onStartKanaDrill).toHaveBeenCalledWith("hiragana");
    fireEvent.click(buttons[1]);
    expect(onStartKanaDrill).toHaveBeenCalledWith("katakana");
  });
});
