// Per-grammar-point aggregation (issue #281). Builds a standalone study view
// for a single 文法点 by gathering every 文法形式選擇 exam item that drills the
// same `surface` (e.g. 「に伴って」「ないことには」) and enriching it with the
// curated grammarNotes entry when one exists.
//
// MVP content source: the existing exam bank (aggregate) + curated notes. No
// new authored content. This module reaches into examBlocks + grammarNotes, so
// it carries the lazy exam-bank weight -- it MUST only be imported by the lazy
// GrammarPointPage, never from an eager path (see bundle-codesplit discipline).
import type { JlptLevel, PracticeQuestion } from "./types";
import { examStyleQuestions } from "./examBlocks";
import { grammarNotes, type GrammarNote } from "./grammarNotes";

export type GrammarPointExample = { ja: string; zh: string };

export type GrammarPoint = {
  /** The grammar-point surface; also the route id (`/grammar/<surface>`). */
  surface: string;
  level: JlptLevel | null;
  meaningZh: string;
  /** Curated reference note (rule / usage / confusions), when one exists. */
  note: GrammarNote | null;
  /** Worked example sentences: curated first, then exam-item-derived. */
  examples: GrammarPointExample[];
  /** Distinct exam explanations -- the "rule" content for un-noted points. */
  explanations: string[];
  /** How many exam questions drill this point (a "練習這個文法" entry hint). */
  questionCount: number;
};

const BLANK = "___";

// A "grammar point" comes from 文法形式選擇 items, whose `surface` IS a single
// pattern. 語順組合 (word-order) items have no clean single-point surface, so
// they're excluded -- their promptLabel doesn't contain 文法.
function isGrammarQuestion(question: PracticeQuestion): boolean {
  return (question.promptLabel ?? "").includes("文法");
}

// Turn a cloze question into a complete example sentence by filling its blank
// with the correct answer; pair it with the post-answer full translation.
function exampleFromQuestion(question: PracticeQuestion): GrammarPointExample | null {
  if (!question.promptText) return null;
  const answer = question.expectedAnswers[0] ?? "";
  const ja = question.promptText.includes(BLANK)
    ? question.promptText.replace(BLANK, answer)
    : question.promptText;
  return { ja, zh: question.promptContextZh ?? "" };
}

// Curated note lookup, tolerant of a leading 〜/～ on the surface.
function lookupNote(surface: string): GrammarNote | null {
  return grammarNotes[surface] ?? grammarNotes[surface.replace(/^[〜～]/, "")] ?? null;
}

// Every distinct grammar-point surface present in the exam bank, sorted for a
// stable order (an index page / build-time prerender can rely on it).
export function allGrammarSurfaces(): string[] {
  const surfaces = new Set<string>();
  for (const question of examStyleQuestions) {
    if (isGrammarQuestion(question)) surfaces.add(question.vocabulary.surface);
  }
  return [...surfaces].sort();
}

// Aggregate everything known about one grammar point. Returns null when no
// grammar exam item uses this surface (so the route can 404 cleanly).
export function buildGrammarPoint(surface: string): GrammarPoint | null {
  const items = examStyleQuestions.filter(
    (question) => isGrammarQuestion(question) && question.vocabulary.surface === surface
  );
  if (items.length === 0) return null;

  const note = lookupNote(surface);

  // Curated examples first (hand-written, cleaner), then exam-derived; dedupe
  // by the Japanese sentence so a curated example isn't repeated by an item.
  const seen = new Set<string>();
  const examples: GrammarPointExample[] = [];
  const candidates: GrammarPointExample[] = [
    ...(note?.examples ?? []),
    ...items.map(exampleFromQuestion).filter((ex): ex is GrammarPointExample => ex !== null)
  ];
  for (const example of candidates) {
    if (!example.ja || seen.has(example.ja)) continue;
    seen.add(example.ja);
    examples.push(example);
  }

  const explanations = [...new Set(items.map((item) => item.explanation).filter(Boolean))];

  return {
    surface,
    level: items[0].vocabulary.level ?? note?.jlptLevel ?? null,
    meaningZh: note?.meaningZh ?? items[0].vocabulary.meaningZh,
    note,
    examples,
    explanations,
    questionCount: items.length
  };
}
