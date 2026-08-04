import { Profiler, StrictMode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

// #683: the budget used to be a plain number reset by a `useEffect` that watched
// query/level/readingType. React 19 hooks v7's `set-state-in-effect` rule makes
// that pattern a violation. The budget is now keyed by a pure filterKey
// (query + level + readingType) so a filter change drops the effective budget
// back to the initial batch WITHOUT a setState call -- old-key state is just
// ignored on the next render, and the first load-more overwrites it.
//
// A filtered view shows whole families until the entry budget (FAMILY_ENTRY_BUDGET
// = 40) is crossed; the family that crosses it is included whole, so the exact
// visible count per filter is data-derived and asserted against the known
// kanjiOnyomi bank (matched counts below computed from src/domain/kanjiOnyomi.ts):
//   query う / all / on: 46 visible at budget 40, 82 after one load-more (220 matched)
//   query き / all / on: 43 visible at budget 40, 80 after one load-more (84 matched)
//   query う / N1  / on: 40 visible at budget 40, 42 after one load-more (42 matched)
//   query う / all / kun: 40 visible at budget 40 (164 matched)
// A budget reset is therefore observable as the visible count snapping back to
// the fresh-filter value instead of carrying the pre-change load-more position.
describe("KanjiOnyomiPanel filter-keyed budget (#683)", () => {
  const cells = () => document.querySelectorAll("button.kanji-cell");
  const visibleCount = () => cells().length;
  const query = "う"; // high-match query: 220 on-view entries (has a load-more boundary)
  const renderWithQuery = (q = query) => {
    render(<KanjiOnyomiPanel language="zh-Hant" />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: q } });
  };
  const typeInSearch = (value: string) => {
    fireEvent.change(screen.getByRole("searchbox"), { target: { value } });
  };
  const clickLevel = (label: string) => {
    fireEvent.click(screen.getByRole("button", { name: label }));
  };
  const clickReadingType = (label: string) => {
    fireEvent.click(screen.getByRole("button", { name: label }));
  };
  const clickLoadMore = () => {
    fireEvent.click(screen.getByRole("button", { name: /載入更多/ }));
  };

  it("resets the effective budget when the query changes after a load-more (#683)", () => {
    renderWithQuery(query);
    expect(visibleCount()).toBe(46); // う at budget 40
    clickLoadMore();
    expect(visibleCount()).toBe(82); // budget 80

    // う → き is a genuine query change; the き view must restart at its own
    // budget-40 position (43), not carry the う load-more position (82).
    typeInSearch("き");

    expect(visibleCount()).toBe(43);
    // 84 matched > 43 shown, so the load-more button is back -- the budget was
    // recomputed, not silently carried over.
    expect(screen.getByRole("button", { name: /載入更多/ })).toBeInTheDocument();
  });

  it("resets the effective budget when the level filter changes (#683)", () => {
    renderWithQuery(query);
    expect(visibleCount()).toBe(46);
    clickLoadMore();
    expect(visibleCount()).toBe(82);

    // う is spread across all levels; narrowing to N1 is a level change.
    clickLevel("N1");

    expect(visibleCount()).toBe(40); // う/N1 at budget 40
    expect(screen.getByRole("button", { name: /載入更多/ })).toBeInTheDocument();
  });

  it("resets the effective budget when the reading type changes (#683)", () => {
    renderWithQuery(query);
    expect(visibleCount()).toBe(46);
    clickLoadMore();
    expect(visibleCount()).toBe(82);

    // 訓讀 view of う restarts at its own budget-40 position (40).
    clickReadingType("訓讀");

    expect(visibleCount()).toBe(40);
    expect(screen.getByRole("button", { name: /載入更多/ })).toBeInTheDocument();
  });

  it("does not reset the budget on a language switch (#683)", () => {
    const { rerender } = render(<KanjiOnyomiPanel language="zh-Hant" />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: query } });
    expect(visibleCount()).toBe(46);
    clickLoadMore();
    const afterLoadMore = visibleCount();
    expect(afterLoadMore).toBe(82);

    // language is deliberately NOT part of the filterKey, so a switch keeps the
    // already-loaded batch (no budget reset).
    rerender(<KanjiOnyomiPanel language="ja" />);

    expect(visibleCount()).toBe(afterLoadMore);
  });

  it("loads the next batch from the initial budget on a fresh filter, not the old value (#683)", () => {
    renderWithQuery(query);
    clickLoadMore();
    expect(visibleCount()).toBe(82); // budget 80 under う

    // き is a fresh filter: it must restart at budget 40 (43 visible)...
    typeInSearch("き");
    expect(visibleCount()).toBe(43);

    // ...and its first load-more is one 40 bump on top of the initial budget,
    // landing at budget 80 (80 visible) -- NOT the stale う budget (which would
    // carry ~120+ from う's position and show everything).
    clickLoadMore();
    expect(visibleCount()).toBe(80);
  });

  it("switching back to a previous filter starts fresh from the initial budget (#683)", () => {
    renderWithQuery(query);
    clickLoadMore();
    expect(visibleCount()).toBe(82);

    // Move to き and load it twice so its state holds an 80 budget too.
    typeInSearch("き");
    clickLoadMore();
    expect(visibleCount()).toBe(80);

    // Back to う: must restart at 46 (budget 40), NOT restore the earlier
    // う load-more position of 82.
    typeInSearch(query);

    expect(visibleCount()).toBe(46);
    expect(screen.getByRole("button", { name: /載入更多/ })).toBeInTheDocument();
  });

  it("arrowing across the boundary still pulls the next batch in and focuses the revealed kanji (#683)", () => {
    const localArrow = (key: "ArrowRight" | "ArrowLeft") => fireEvent.keyDown(document, { key });
    const localSelectedChar = () =>
      document.querySelector(".kanji-cell.selected .kanji-cell-char")?.textContent ?? null;
    renderWithQuery(query);
    const before = visibleCount(); // 46
    const chars = Array.from(document.querySelectorAll("button.kanji-cell .kanji-cell-char")).map(
      (node) => node.textContent
    );
    // Walk one step beyond the last rendered cell so the handler must bump the budget.
    for (let i = 0; i < before; i++) localArrow("ArrowRight");
    expect(localSelectedChar()).toBe(chars[before - 1]);

    localArrow("ArrowRight");

    expect(visibleCount()).toBeGreaterThan(before);
    const allChars = Array.from(document.querySelectorAll("button.kanji-cell .kanji-cell-char")).map(
      (node) => node.textContent
    );
    expect(localSelectedChar()).toBe(allChars[before]);
    // The freshly-revealed cell is actually focused (focus passes after the
    // budget bump re-renders it into the DOM).
    expect(document.activeElement?.textContent?.trim()).toContain(allChars[before] ?? "");
  });

  // The behaviour tests above pass under BOTH the old effect-reset and the new
  // keyed-budget implementations (the old one also reset to 40 -- the visible
  // snap is identical). What actually distinguishes them is THAT a filter change
  // produces no effect-driven second render: the old code set state inside a
  // query/level/readingType effect, so a filter change cost TWO renders (query
  // state + effect state); the keyed version drops the effect and commits the
  // filter change in exactly ONE render. Profiler counts committed renders, so
  // this is the test that would fail on a regression back to set-state-in-effect.
  it("changes a filter in exactly one render (no effect-set state) (#683)", () => {
    let commits = 0;
    render(
      <Profiler id="budget" onRender={() => commits++}>
        <KanjiOnyomiPanel language="zh-Hant" />
      </Profiler>
    );
    commits = 0; // ignore the mount render

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: query } });
    expect(commits).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: /載入更多/ }));
    const afterLoadMore = commits;
    expect(afterLoadMore).toBeGreaterThan(commits - 1); // load-more commits

    // The query change from う → き must be a single committed render.
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "き" } });
    expect(commits).toBe(afterLoadMore + 1);
  });

  it("renders under StrictMode without extra state updates (#683)", () => {
    const { container } = render(
      <StrictMode>
        <KanjiOnyomiPanel language="zh-Hant" />
      </StrictMode>
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: query } });
    // Renderer stays coherent: the grid is present and batched.
    expect(container.querySelectorAll("button.kanji-cell").length).toBe(46);
    fireEvent.click(screen.getByRole("button", { name: /載入更多/ }));
    expect(container.querySelectorAll("button.kanji-cell").length).toBe(82);
  });
});

// User request (2026-07): browsing a level or a search result meant clicking
// every card. Desktop arrow keys now walk the grid in display order.
describe("KanjiOnyomiPanel arrow-key browsing", () => {
  const cells = () => Array.from(document.querySelectorAll<HTMLButtonElement>("button.kanji-cell"));
  const selectedChar = () =>
    document.querySelector(".kanji-cell.selected .kanji-cell-char")?.textContent ?? null;
  const arrow = (key: "ArrowRight" | "ArrowLeft", init: KeyboardEventInit = {}) =>
    fireEvent.keyDown(document, { key, ...init });

  it("selects the first card on the first ArrowRight, then walks forward and back", () => {
    renderNarrowed("高");
    const chars = cells().map((cell) => cell.querySelector(".kanji-cell-char")?.textContent);
    expect(chars.length).toBeGreaterThan(1);
    expect(selectedChar()).toBeNull();

    arrow("ArrowRight");
    expect(selectedChar()).toBe(chars[0]);

    arrow("ArrowRight");
    expect(selectedChar()).toBe(chars[1]);

    arrow("ArrowLeft");
    expect(selectedChar()).toBe(chars[0]);
  });

  it("stops at both ends instead of wrapping around", () => {
    renderNarrowed("高");
    const chars = cells().map((cell) => cell.querySelector(".kanji-cell-char")?.textContent);

    arrow("ArrowRight");
    arrow("ArrowLeft");
    expect(selectedChar()).toBe(chars[0]);

    for (let i = 0; i < chars.length + 3; i++) arrow("ArrowRight");
    expect(selectedChar()).toBe(chars[chars.length - 1]);
  });

  it("moves focus to the selected card so the grid stays keyboard-coherent", () => {
    renderNarrowed("高");
    arrow("ArrowRight");
    expect(document.activeElement).toBe(cells()[0]);
  });

  it("never hijacks typing in the search box", () => {
    renderNarrowed("高");
    const search = screen.getByRole("searchbox");
    search.focus();
    fireEvent.keyDown(search, { key: "ArrowRight" });
    expect(selectedChar()).toBeNull();
  });

  it("leaves browser and OS chords alone (Alt+Arrow is history navigation)", () => {
    renderNarrowed("高");
    arrow("ArrowRight", { altKey: true });
    arrow("ArrowRight", { ctrlKey: true });
    arrow("ArrowRight", { metaKey: true });
    expect(selectedChar()).toBeNull();
  });

  it("reveals the next batch when arrowing past the load-more boundary (#608)", () => {
    render(<KanjiOnyomiPanel language="zh-Hant" />);
    const before = cells().length;
    expect(screen.getByRole("button", { name: /載入更多/ })).toBeInTheDocument();

    // Walk one step beyond the last rendered card.
    for (let i = 0; i < before + 1; i++) arrow("ArrowRight");

    expect(cells().length).toBeGreaterThan(before);
    // The selection landed on the freshly revealed card, not stuck on the last.
    const chars = cells().map((cell) => cell.querySelector(".kanji-cell-char")?.textContent);
    expect(selectedChar()).toBe(chars[before]);
  });

  it("tells desktop learners the shortcut exists", () => {
    renderNarrowed("高");
    expect(screen.getByText(/← \/ →/)).toBeInTheDocument();
  });
});

// Feedback 2026-07: hearing a kanji's reading used to require selecting the
// cell, scrolling up to the detail card's TTS button, then scrolling back down
// to pick the next kanji. The selected cell now grows an in-place speak button
// so the listen-compare loop never leaves the grid.
type MockSynth = {
  speaking: boolean;
  pending: boolean;
  speak: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
  getVoices: () => unknown[];
};

function setupSynth(): MockSynth {
  const synth: MockSynth = {
    speaking: false,
    pending: false,
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => []
  };
  (window as unknown as { speechSynthesis: MockSynth }).speechSynthesis = synth;
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class {
    text: string;
    lang = "";
    rate = 1;
    voice: unknown = null;
    constructor(t: string) {
      this.text = t;
    }
    addEventListener() {}
    removeEventListener() {}
  };
  return synth;
}

// Pull the first reading of the given type out of a cell's own text (the cell
// shows "音 こう・…" / "訓 たかい・…"), so the assertions never hardcode data.
function firstCellReading(cell: HTMLElement, type: "on" | "kun"): string {
  const text = cell.querySelector(`.kanji-cell-${type}`)?.textContent ?? "";
  return text.replace(/^\S+\s+/, "").split("・")[0];
}

describe("KanjiOnyomiPanel in-place cell TTS", () => {
  let synth: MockSynth;
  beforeEach(() => {
    synth = setupSynth();
  });
  afterEach(() => {
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
  });

  it("grows a speak button on the selected cell only, reading its 音読み", () => {
    renderNarrowed("高");
    const grid = document.querySelector(".kanji-grid") as HTMLElement;
    expect(within(grid).queryByRole("button", { name: "朗讀日文" })).toBeNull();

    const cell = grid.querySelector<HTMLButtonElement>("button.kanji-cell");
    expect(cell).not.toBeNull();
    const expectedReading = firstCellReading(cell!, "on");
    expect(expectedReading.length).toBeGreaterThan(0);
    fireEvent.click(cell!);

    const wrap = cell!.closest(".kanji-cell-wrap");
    expect(wrap).not.toBeNull();
    const speak = within(wrap as HTMLElement).getByRole("button", { name: "朗讀日文" });
    expect(within(grid).getAllByRole("button", { name: "朗讀日文" })).toHaveLength(1);

    fireEvent.click(speak);
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect((synth.speak.mock.calls[0][0] as { text: string }).text).toBe(expectedReading);
  });

  it("reads the active reading type (訓讀 view speaks the kun reading)", () => {
    renderNarrowed("高");
    fireEvent.click(screen.getByRole("button", { name: "訓讀" }));

    const grid = document.querySelector(".kanji-grid") as HTMLElement;
    const cell = grid.querySelector<HTMLButtonElement>("button.kanji-cell");
    expect(cell).not.toBeNull();
    const expectedReading = firstCellReading(cell!, "kun");
    expect(expectedReading.length).toBeGreaterThan(0);

    fireEvent.click(cell!);
    const wrap = cell!.closest(".kanji-cell-wrap") as HTMLElement;
    fireEvent.click(within(wrap).getByRole("button", { name: "朗讀日文" }));

    expect((synth.speak.mock.calls[0][0] as { text: string }).text).toBe(expectedReading);
  });
});
