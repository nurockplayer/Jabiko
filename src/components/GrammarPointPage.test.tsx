import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GrammarPointPage } from "./GrammarPointPage";
import { allGrammarSurfaces, buildGrammarPoint } from "../domain/grammarPoints";
import { grammarNotes } from "../domain/grammarNotes";
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
    await user.click(screen.getByRole("button", { name: t.reviewDoneExit }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
