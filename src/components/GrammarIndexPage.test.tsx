import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { GrammarIndexPage } from "./GrammarIndexPage";
import { copy } from "../i18n";
import type { JlptLevel } from "../domain/types";

const t = copy["zh-Hant"];

type PageProps = {
  language: "zh-Hant";
  level: JlptLevel | null;
  onOpenPattern: (surface: string) => void;
  onSelectLevel: (level: JlptLevel) => void;
};

function makeProps(level: JlptLevel | null): PageProps {
  return {
    language: "zh-Hant",
    level,
    onOpenPattern: vi.fn(),
    onSelectLevel: vi.fn(),
  };
}

function setup(level: JlptLevel | null) {
  const props = makeProps(level);
  const view = render(<GrammarIndexPage {...props} />);
  return { ...view, props };
}

// N5 文型總數：16（14 must_know + 2 high_frequency）。
// N4 文型總數：19（3 must_know + 16 high_frequency）。
// 只有 N2 有 4 條含影視例句的文型（ni-shitemo/kaneru/warini/nimo-kakawarazu）。

describe("GrammarIndexPage level-local filters (issue #682)", () => {
  it("resets media + importance filters after an overview round-trip back into N5", async () => {
    const user = userEvent.setup();
    const { rerender } = setup("N5");

    // 16 N5 patterns by default, filters off.
    expect(screen.getAllByRole("listitem")).toHaveLength(16);
    const mediaButton = screen.getByRole("button", { name: t.grammarFilterMediaOnly });
    const importanceSelect = screen.getByLabelText(t.grammarFilterImportance);
    expect(mediaButton).not.toHaveClass("active");
    expect(importanceSelect).toHaveValue("");

    // Enable both level-local filters.
    await user.click(mediaButton);
    await user.selectOptions(importanceSelect, "must_know");
    expect(mediaButton).toHaveClass("active");
    expect(importanceSelect).toHaveValue("must_know");

    // Back to overview: the level-local filter UI unmounts.
    rerender(<GrammarIndexPage {...makeProps(null)} />);
    expect(
      screen.queryByRole("button", { name: t.grammarFilterMediaOnly })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(t.grammarFilterImportance)).not.toBeInTheDocument();

    // Re-entering N5 remounts the level subtree with default filters.
    rerender(<GrammarIndexPage {...makeProps("N5")} />);
    expect(screen.getByRole("button", { name: t.grammarFilterMediaOnly })).not.toHaveClass(
      "active"
    );
    expect(screen.getByLabelText(t.grammarFilterImportance)).toHaveValue("");
    expect(screen.getAllByRole("listitem")).toHaveLength(16);
  });

  it("starts N4 with default filters on a direct N5 -> N4 switch", async () => {
    const user = userEvent.setup();
    const { rerender } = setup("N5");

    // Apply an importance filter inside N5.
    await user.selectOptions(screen.getByLabelText(t.grammarFilterImportance), "must_know");
    // N5 must_know = 14.
    expect(screen.getAllByRole("listitem")).toHaveLength(14);
    expect(screen.getByLabelText(t.grammarFilterImportance)).toHaveValue("must_know");

    // Switch straight to N4 without visiting the overview.
    rerender(<GrammarIndexPage {...makeProps("N4")} />);
    // The keyed N4 subtree mounts fresh: default filter, all 19 N4 patterns.
    expect(screen.getByLabelText(t.grammarFilterImportance)).toHaveValue("");
    expect(screen.getAllByRole("listitem")).toHaveLength(19);
  });

  it("keeps the search query across overview round-trips and level switches", async () => {
    const user = userEvent.setup();
    const { rerender } = setup("N2");

    const input = screen.getByRole("searchbox");
    await user.type(input, "としても");
    // In a level, the query filters that level's list down to the match.
    expect(input).toHaveValue("としても");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    // Overview still owns the same searchQuery -> global search shows the match.
    rerender(<GrammarIndexPage {...makeProps(null)} />);
    expect(screen.getByRole("searchbox")).toHaveValue("としても");
    expect(
      screen.getByRole("heading", { name: `${t.grammarSearchResults}（1）` })
    ).toBeInTheDocument();

    // Re-entering the level keeps the query and re-applies it to the level list.
    rerender(<GrammarIndexPage {...makeProps("N2")} />);
    expect(screen.getByRole("searchbox")).toHaveValue("としても");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("does not remount the search input when the level branch changes mid-composition", () => {
    const { rerender } = setup("N5");

    const input = screen.getByRole("searchbox");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "ても" } });

    rerender(<GrammarIndexPage {...makeProps(null)} />);
    expect(screen.getByRole("searchbox")).toBe(input);

    rerender(<GrammarIndexPage {...makeProps("N5")} />);
    expect(screen.getByRole("searchbox")).toBe(input);
    expect(input).toHaveValue("ても");

    fireEvent.compositionEnd(input);
  });

  it("does not leak unmounted level filters into overview global search", async () => {
    const user = userEvent.setup();
    const { rerender } = setup("N2");

    // N2 has 5 "understand" patterns; toshitemo is high_frequency (not filtered in).
    await user.selectOptions(screen.getByLabelText(t.grammarFilterImportance), "understand");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);

    // Back to overview and run a global search matching a non-understand pattern.
    rerender(<GrammarIndexPage {...makeProps(null)} />);
    await user.type(screen.getByRole("searchbox"), "としても");

    // Global search is driven solely by the query — no level-filter leakage.
    expect(
      screen.getByRole("heading", { name: `${t.grammarSearchResults}（1）` })
    ).toBeInTheDocument();
    expect(screen.getByText("〜としても")).toBeInTheDocument();
  });

  it("keeps level results, empty state, matched count and pattern-open behavior intact", async () => {
    const user = userEvent.setup();

    // Level results: full N5 list.
    const levelView = setup("N5");
    expect(screen.getAllByRole("listitem")).toHaveLength(16);

    // Empty state inside a level when the query matches nothing there.
    await user.type(screen.getByRole("searchbox"), "としても");
    expect(screen.getByText(t.grammarNoPatterns)).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);

    // Matched count on the overview global search.
    levelView.unmount();
    const overview = setup(null);
    await user.type(screen.getByRole("searchbox"), "としても");
    expect(
      screen.getByRole("heading", { name: `${t.grammarSearchResults}（1）` })
    ).toBeInTheDocument();
    overview.unmount();

    // Opening a pattern still strips the 〜 prefix and calls onOpenPattern.
    const openProps = makeProps("N5");
    const openView = render(<GrammarIndexPage {...openProps} />);
    await user.click(screen.getByText("〜てもいい"));
    expect(openProps.onOpenPattern).toHaveBeenCalledWith("てもいい");
    openView.unmount();

    expect(levelView.props.onOpenPattern).not.toHaveBeenCalled();
  });

  it("resets filters exactly once under StrictMode without state-update warnings", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    const props = makeProps("N5");
    const { rerender } = render(
      <StrictMode>
        <GrammarIndexPage {...props} />
      </StrictMode>
    );
    await user.selectOptions(screen.getByLabelText(t.grammarFilterImportance), "must_know");
    await user.click(screen.getByRole("button", { name: t.grammarFilterMediaOnly }));

    rerender(
      <StrictMode>
        <GrammarIndexPage {...makeProps(null)} />
      </StrictMode>
    );
    rerender(
      <StrictMode>
        <GrammarIndexPage {...makeProps("N5")} />
      </StrictMode>
    );

    // Fresh mount defaults, not a double-applied filter.
    expect(screen.getByLabelText(t.grammarFilterImportance)).toHaveValue("");
    expect(screen.getByRole("button", { name: t.grammarFilterMediaOnly })).not.toHaveClass(
      "active"
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(16);

    // No React warning was emitted during the branch switches.
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
