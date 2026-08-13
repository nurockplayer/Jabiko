import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { cleanExplanation, GrammarPointPage } from "./GrammarPointPage";
import { allGrammarSurfaces, buildGrammarPoint } from "../domain/grammarPoints";
import { getPatternsByLevel, patternSurface } from "../domain/grammarIndex";
import { grammarNotes } from "../domain/grammarNotes";
import { grammarPatterns } from "../domain/grammarDatabase";
import { copy } from "../i18n";

// A surface that exists in the exam bank AND has a curated note, so the page
// renders its richest layout (GrammarNoteCard + examples + practice entry).
const notedSurface = allGrammarSurfaces().find((s) => grammarNotes[s])!;
const t = copy["zh-Hant"];

describe("GrammarPointPage", () => {
  it("shows the grammar point as an <h1> with its meaning and a worked example", () => {
    const point = buildGrammarPoint(notedSurface)!;
    render(
      <GrammarPointPage surface={notedSurface} language="zh-Hant" onPractice={vi.fn()} />
    );

    expect(screen.getByRole("heading", { level: 1, name: notedSurface })).toBeInTheDocument();
    expect(screen.getByText(point.meaningZh)).toBeInTheDocument();
    // The curated example's translation sits in its own element -> unique match.
    expect(screen.getByText(point.note!.examples[0].zh)).toBeInTheDocument();
  });

  it("triggers practice from the practice entry", async () => {
    const onPractice = vi.fn();
    const user = userEvent.setup();
    render(
      <GrammarPointPage surface={notedSurface} language="zh-Hant" onPractice={onPractice} />
    );

    await user.click(screen.getByRole("button", { name: t.startChallenge }));
    expect(onPractice).toHaveBeenCalledTimes(1);
  });

  it("falls back gracefully for an unknown surface", () => {
    render(<GrammarPointPage surface="存在しない文法zzz" language="zh-Hant" onPractice={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "存在しない文法zzz" })).toBeInTheDocument();
  });

  it("renders a database-only pattern's Chinese content in any language (#438/#427)", () => {
    const dbOnly = grammarPatterns.find((p) => buildGrammarPoint(p.pattern.replace(/^[〜～]/, "")) === null);
    expect(dbOnly, "expected at least one database-only pattern").toBeDefined();
    const surface = dbOnly!.pattern.replace(/^[〜～]/, "");

    const zh = render(
      <GrammarPointPage surface={surface} language="zh-Hant" onPractice={vi.fn()} />
    );
    expect(screen.getByText(dbOnly!.meaningZh)).toBeInTheDocument();
    zh.unmount();

    const en = render(
      <GrammarPointPage surface={surface} language="en" onPractice={vi.fn()} />
    );
    expect(screen.getByText(dbOnly!.meaningZh)).toBeInTheDocument();
    en.unmount();

    render(<GrammarPointPage surface={surface} language="ja" onPractice={vi.fn()} />);
    expect(screen.getByText(dbOnly!.meaningZh)).toBeInTheDocument();
  });

  it("renders localized meaning and usage notes for an un-noted point in en (#427)", () => {
    const surface = allGrammarSurfaces().find((s) => {
      const p = buildGrammarPoint(s);
      return p !== null && !p.note && p.explanations.length > 0 && Boolean(p.meaningI18n?.en);
    })!;
    const point = buildGrammarPoint(surface)!;
    render(<GrammarPointPage surface={surface} language="en" onPractice={vi.fn()} />);

    expect(screen.getByText(point.meaningI18n!.en!)).toBeInTheDocument();
    const firstUsage = point.explanations
      .map((entry) => cleanExplanation(entry.i18n?.en ?? entry.zh))
      .filter(Boolean)[0];
    expect(firstUsage).toBeTruthy();
    expect(screen.getByText(firstUsage)).toBeInTheDocument();
  });

  it("strips the quiz answer lead-in per locale (#427)", () => {
    expect(cleanExplanation("正解是「たとえ」，因為後句是假設。")).toBe("因為後句是假設。");
    expect(cleanExplanation("正解は「たとえ」です。後半は仮定を表します。")).toBe("後半は仮定を表します。");
    expect(cleanExplanation("The correct answer is 「たとえ」: it pairs with a hypothetical.")).toBe(
      "it pairs with a hypothetical."
    );
    expect(cleanExplanation("沒有前綴的內容原樣通過。")).toBe("沒有前綴的內容原樣通過。");
  });
});
describe("GrammarPointPage next/prev pager (#457)", () => {
  const LEVEL_ORDER = ["N5", "N4", "N3", "N2", "N1"] as const;
  const flat = LEVEL_ORDER.flatMap((lvl) => getPatternsByLevel(lvl));
  const mid = Math.floor(flat.length / 2);
  const surface = patternSurface(flat[mid]);
  const nextSurface = patternSurface(flat[mid + 1]);
  const prevSurface = patternSurface(flat[mid - 1]);

  it("advances to the next grammar point without returning to the index (zh-Hant)", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <GrammarPointPage
        surface={surface}
        language="zh-Hant"
        onPractice={vi.fn()}
        onNavigate={onNavigate}
      />
    );
    await user.click(screen.getByRole("button", { name: new RegExp(t.grammarNext) }));
    expect(onNavigate).toHaveBeenCalledWith(nextSurface);
  });

  it("goes back to the previous grammar point", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <GrammarPointPage
        surface={surface}
        language="zh-Hant"
        onPractice={vi.fn()}
        onNavigate={onNavigate}
      />
    );
    await user.click(screen.getByRole("button", { name: new RegExp(t.grammarPrev) }));
    expect(onNavigate).toHaveBeenCalledWith(prevSurface);
  });

  it("renders no pager when onNavigate is not wired in", () => {
    const { container } = render(
      <GrammarPointPage surface={surface} language="zh-Hant" onPractice={vi.fn()} />
    );
    expect(container.querySelector(".gp-pager")).toBeNull();
  });
});
