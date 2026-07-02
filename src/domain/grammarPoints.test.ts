import { describe, expect, it } from "vitest";
import { allGrammarSurfaces, buildGrammarPoint, hasGrammarPoint } from "./grammarPoints";
import { examStyleQuestions } from "./examBlocks";
import { grammarNotes } from "./grammarNotes";

const grammarItems = examStyleQuestions.filter((q) => (q.promptLabel ?? "").includes("文法"));

describe("grammarPoints", () => {
  it("lists every distinct grammar surface, sorted and real", () => {
    const surfaces = allGrammarSurfaces();
    expect(surfaces.length).toBeGreaterThan(0);
    expect(surfaces).toEqual([...surfaces].sort());

    const real = new Set(grammarItems.map((q) => q.vocabulary.surface));
    for (const surface of surfaces) {
      expect(real.has(surface)).toBe(true);
    }
  });

  it("returns null for a surface no grammar item uses", () => {
    expect(buildGrammarPoint("この文法点は存在しないzzz")).toBeNull();
  });

  it("hasGrammarPoint matches buildGrammarPoint's existence (#282)", () => {
    const real = allGrammarSurfaces()[0];
    expect(hasGrammarPoint(real)).toBe(true);
    expect(buildGrammarPoint(real)).not.toBeNull();

    expect(hasGrammarPoint("この文法点は存在しないzzz")).toBe(false);
    expect(buildGrammarPoint("この文法点は存在しないzzz")).toBeNull();
  });

  it("aggregates a real surface: meaning, complete examples, and a count", () => {
    const surface = allGrammarSurfaces()[0];
    const point = buildGrammarPoint(surface);

    expect(point).not.toBeNull();
    expect(point!.surface).toBe(surface);
    expect(point!.meaningZh.length).toBeGreaterThan(0);
    expect(point!.questionCount).toBeGreaterThanOrEqual(1);
    expect(point!.explanations.length).toBeGreaterThanOrEqual(1);
    expect(point!.examples.length).toBeGreaterThanOrEqual(1);
    // The cloze blank is filled -- examples read as complete sentences.
    for (const example of point!.examples) {
      expect(example.ja).not.toContain("___");
    }
  });

  it("attaches the curated grammarNotes entry when the surface has one", () => {
    const noted = allGrammarSurfaces().find((s) => grammarNotes[s]);
    // grammarNotes is keyed by exam surfaces, so an overlap must exist.
    expect(noted).toBeDefined();

    const point = buildGrammarPoint(noted!);
    expect(point!.note).not.toBeNull();
    expect(point!.note!.surface).toBe(noted);
    // Curated examples are folded into the example list.
    expect(point!.examples.length).toBeGreaterThanOrEqual(point!.note!.examples.length);
  });

  it("threads the exam items' i18n overlays into the point (#427)", () => {
    // Every exam item carries meaningI18n / explanationI18n / promptContextI18n
    // since #400; the aggregation must not drop them. Use an un-noted point so
    // the tested fields are the ones the page actually renders.
    const surface = allGrammarSurfaces().find((s) => {
      const p = buildGrammarPoint(s);
      return p !== null && !p.note && p.explanations.length > 0 && p.examples.length > 0;
    });
    expect(surface).toBeDefined();

    const point = buildGrammarPoint(surface!)!;
    expect(point.meaningI18n?.en).toBeTruthy();
    expect(point.explanations.some((entry) => entry.i18n?.en)).toBe(true);
    expect(point.examples.some((example) => example.zhI18n?.en)).toBe(true);
  });
});
