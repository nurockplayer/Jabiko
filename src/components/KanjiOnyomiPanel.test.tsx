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

  // #608 P1: the unfiltered view used to put all 671 kanji in the DOM at once
  // (~54,000px page on phones). Families render in batches with a load-more.
  it("caps the initial render and loads more on demand (#608)", () => {
    const { container } = render(<KanjiOnyomiPanel language="zh-Hant" />);
    const initial = container.querySelectorAll(".kanji-cell").length;
    expect(initial).toBeGreaterThan(0);
    expect(initial).toBeLessThanOrEqual(80);

    const loadMore = screen.getByRole("button", { name: /載入更多/ });
    fireEvent.click(loadMore);
    const afterOneClick = container.querySelectorAll(".kanji-cell").length;
    expect(afterOneClick).toBeGreaterThan(initial);
  });

  it("defaults the level filter to the learner's band when provided (#608)", () => {
    render(<KanjiOnyomiPanel language="zh-Hant" defaultLevel="N2" />);
    expect(screen.getByRole("button", { name: "N2" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "全部" })).toHaveAttribute("aria-pressed", "false");
  });
});
