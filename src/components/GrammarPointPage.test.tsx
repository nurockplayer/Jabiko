import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { cleanExplanation, GrammarPointPage } from "./GrammarPointPage";
import { allGrammarSurfaces, buildGrammarPoint } from "../domain/grammarPoints";
import { findPatternBySurface } from "../domain/grammarIndex";
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
      <GrammarPointPage surface={notedSurface} language="zh-Hant" onPractice={vi.fn()} onBack={vi.fn()} />
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
      <GrammarPointPage surface={notedSurface} language="zh-Hant" onPractice={onPractice} onBack={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: t.startChallenge }));
    expect(onPractice).toHaveBeenCalledTimes(1);
  });

  it("falls back gracefully for an unknown surface and supports going back", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(
      <GrammarPointPage surface="存在しない文法zzz" language="zh-Hant" onPractice={vi.fn()} onBack={onBack} />
    );

    expect(screen.getByRole("heading", { level: 1, name: "存在しない文法zzz" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.grammarBackToIndex }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders a database-only pattern's Chinese content in zh-Hant but hides it in en (#438/#427)", () => {
    const dbOnly = grammarPatterns.find((p) => buildGrammarPoint(p.pattern.replace(/^[〜～]/, "")) === null);
    expect(dbOnly, "expected at least one database-only pattern").toBeDefined();
    const surface = dbOnly!.pattern.replace(/^[〜～]/, "");

    const zh = render(
      <GrammarPointPage surface={surface} language="zh-Hant" onPractice={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText(dbOnly!.meaningZh)).toBeInTheDocument();
    zh.unmount();

    render(<GrammarPointPage surface={surface} language="en" onPractice={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText(dbOnly!.meaningZh)).not.toBeInTheDocument();
  });

  it("renders localized meaning and usage notes for an un-noted point in en (#427)", () => {
    const surface = allGrammarSurfaces().find((s) => {
      const p = buildGrammarPoint(s);
      return p !== null && !p.note && p.explanations.length > 0 && Boolean(p.meaningI18n?.en);
    })!;
    const point = buildGrammarPoint(surface)!;
    render(<GrammarPointPage surface={surface} language="en" onPractice={vi.fn()} onBack={vi.fn()} />);

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
// Content language gates — product contract (#437 / #427)
describe("content language gates", () => {
  it("renders database-enriched sections for zh-Hant on an un-noted exam-data surface", () => {
    const surface = allGrammarSurfaces().find((s) => {
      const p = buildGrammarPoint(s);
      const db = findPatternBySurface(s);
      return p !== null && !p.note && db !== undefined && db.examples.length > 0;
    })!;
    expect(surface).toBeTruthy();
    render(<GrammarPointPage surface={surface} language="zh-Hant" onPractice={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText(copy["zh-Hant"].grammarDatabaseExamples)).toBeInTheDocument();
  });

  it("renders all Chinese content for zh-Hant on a database-only surface", () => {
    const dbOnly = grammarPatterns.find((p) => { const s = p.pattern.replace(/^[〜～]/, ""); return buildGrammarPoint(s) === null; })!;
    expect(dbOnly).toBeTruthy();
    const surface = dbOnly.pattern.replace(/^[〜～]/, "");
    render(<GrammarPointPage surface={surface} language="zh-Hant" onPractice={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: surface })).toBeInTheDocument();
    expect(screen.getByText(dbOnly.meaningZh)).toBeInTheDocument();
    expect(screen.getByText(dbOnly.formation)).toBeInTheDocument();
  });

  it("hides database-enriched sections from en users on a noted exam-data surface", () => {
    render(<GrammarPointPage surface={notedSurface} language="en" onPractice={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: notedSurface })).toBeInTheDocument();
    expect(screen.queryByText(copy.en.grammarDatabaseExamples)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.en.grammarMediaExamples)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.en.grammarRelatedPatterns)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.en.grammarCommonMistakes)).not.toBeInTheDocument();
  });

  it("hides database-enriched sections from en users on an un-noted exam-data surface", () => {
    const surface = allGrammarSurfaces().find((s) => {
      const p = buildGrammarPoint(s);
      const db = findPatternBySurface(s);
      return p !== null && !p.note && db !== undefined && db.examples.length > 0;
    })!;
    expect(surface).toBeTruthy();
    render(<GrammarPointPage surface={surface} language="en" onPractice={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText(copy.en.grammarDatabaseExamples)).not.toBeInTheDocument();
  });

  it("hides database-enriched sections from ja users", () => {
    render(<GrammarPointPage surface={notedSurface} language="ja" onPractice={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText(copy.ja.grammarMediaExamples)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.ja.grammarRelatedPatterns)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.ja.grammarCommonMistakes)).not.toBeInTheDocument();
  });

  it("does not render meaningZh or formation for en users on a database-only surface", () => {
    const dbOnly = grammarPatterns.find((p) => { const s = p.pattern.replace(/^[〜～]/, ""); return buildGrammarPoint(s) === null; })!;
    expect(dbOnly).toBeTruthy();
    const surface = dbOnly.pattern.replace(/^[〜～]/, "");
    render(<GrammarPointPage surface={surface} language="en" onPractice={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: surface })).toBeInTheDocument();
    expect(screen.queryByText(dbOnly.meaningZh)).not.toBeInTheDocument();
    expect(screen.queryByText(dbOnly.formation)).not.toBeInTheDocument();
  });

  it("does not render example Chinese translations for en users on a database-only surface", () => {
    const dbOnly = grammarPatterns.find((p) => { const s = p.pattern.replace(/^[〜～]/, ""); return buildGrammarPoint(s) === null && p.examples.some((ex) => ex.meaningZh); })!;
    expect(dbOnly).toBeTruthy();
    const surface = dbOnly.pattern.replace(/^[〜～]/, "");
    render(<GrammarPointPage surface={surface} language="en" onPractice={vi.fn()} onBack={vi.fn()} />);
    for (const ex of dbOnly.examples) { if (ex.meaningZh) { expect(screen.queryByText(ex.meaningZh)).not.toBeInTheDocument(); } }
  });

  it("does not render related-pattern Chinese meanings for en users on a database-only surface", () => {
    const dbOnly = grammarPatterns.find((p) => { const s = p.pattern.replace(/^[〜～]/, ""); return buildGrammarPoint(s) === null && p.relatedPatternIds.length > 0; })!;
    expect(dbOnly).toBeTruthy();
    const surface = dbOnly.pattern.replace(/^[〜～]/, "");
    render(<GrammarPointPage surface={surface} language="en" onPractice={vi.fn()} onBack={vi.fn()} />);
    const related = grammarPatterns.filter((p) => dbOnly.relatedPatternIds.includes(p.id));
    expect(related.length).toBeGreaterThan(0);
    for (const rp of related) { expect(screen.queryByText(rp.meaningZh)).not.toBeInTheDocument(); }
  });

  it("does not render commonMistakes for en users on a database-only surface", () => {
    const dbOnly = grammarPatterns.find((p) => { const s = p.pattern.replace(/^[〜～]/, ""); return buildGrammarPoint(s) === null && p.commonMistakes && p.commonMistakes.length > 0; })!;
    expect(dbOnly).toBeTruthy();
    const surface = dbOnly.pattern.replace(/^[〜～]/, "");
    render(<GrammarPointPage surface={surface} language="en" onPractice={vi.fn()} onBack={vi.fn()} />);
    for (const mistake of dbOnly.commonMistakes!) { expect(screen.queryByText(mistake)).not.toBeInTheDocument(); }
  });

  it("does not render meaningZh or formation for ja users on a database-only surface", () => {
    const dbOnly = grammarPatterns.find((p) => { const s = p.pattern.replace(/^[〜～]/, ""); return buildGrammarPoint(s) === null; })!;
    expect(dbOnly).toBeTruthy();
    const surface = dbOnly.pattern.replace(/^[〜～]/, "");
    render(<GrammarPointPage surface={surface} language="ja" onPractice={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText(dbOnly.meaningZh)).not.toBeInTheDocument();
    expect(screen.queryByText(dbOnly.formation)).not.toBeInTheDocument();
  });
});
