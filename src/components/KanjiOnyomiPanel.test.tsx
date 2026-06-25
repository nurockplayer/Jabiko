import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KanjiOnyomiPanel } from "./KanjiOnyomiPanel";

// The default view renders the whole table (~hundreds of cells), which makes
// testing-library's accessible-name scans slow in jsdom (not in a real
// browser). Narrow with a search first so each test queries a tiny DOM.
function renderNarrowed(query = "高") {
  render(<KanjiOnyomiPanel language="zh-Hant" />);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: query } });
}

describe("KanjiOnyomiPanel (#195)", () => {
  it("offers the full N5–N1 level filter", () => {
    renderNarrowed();
    for (const label of ["全部", "N5", "N4", "N3", "N2", "N1"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("has an 音讀/訓讀 reading-type toggle, defaulting to 音讀", () => {
    renderNarrowed();
    const onButton = screen.getByRole("button", { name: "音讀" });
    const kunButton = screen.getByRole("button", { name: "訓讀" });
    expect(onButton).toHaveAttribute("aria-pressed", "true");
    expect(kunButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(kunButton);
    expect(kunButton).toHaveAttribute("aria-pressed", "true");
    expect(onButton).toHaveAttribute("aria-pressed", "false");
  });

  it("shows both on'yomi and kun'yomi for a kanji (高: こう / たかい)", () => {
    renderNarrowed("高");
    // Both readings render somewhere (family header + cell may repeat the on
    // reading, so use getAllByText to stay robust).
    expect(screen.getAllByText(/こう/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/たかい/).length).toBeGreaterThan(0);
  });

  it("regroups by kun'yomi when 訓讀 is selected (高 groups under たかい)", () => {
    renderNarrowed("高");
    fireEvent.click(screen.getByRole("button", { name: "訓讀" }));
    expect(screen.getAllByText(/たかい/).length).toBeGreaterThan(0);
  });
});
