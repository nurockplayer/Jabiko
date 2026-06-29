import { FEEDBACK_MAX } from "./feedbackRemote";
import type { Language } from "../i18n";
import type { PracticeQuestion } from "./types";

// Per-question "report this question" (#299). The Supabase `feedback` table's
// RLS CHECK constraint only allows category in ('wish','bug','other'), so a
// question report is submitted as a "bug" with all the question context packed
// into the free-text message. This module builds that message: a deterministic,
// human-readable block a reviewer can read at a glance, capped at FEEDBACK_MAX.

export type ReportReason =
  | "wrongAnswer"
  | "awkwardMeaning"
  | "confusingExplanation"
  | "typo"
  | "other";

export interface QuestionReportInput {
  question: PracticeQuestion;
  reason: ReportReason;
  detail?: string;
  language: Language;
  selectedAnswer?: string | null;
}

const DASH = "-";

// A stable string for any optionally-missing value, so the message never
// contains the literal "undefined" / "null".
function orDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : DASH;
}

export function buildQuestionReportMessage(input: QuestionReportInput): string {
  const { question, reason, detail, language, selectedAnswer } = input;
  const vocab = question.vocabulary;

  // promptLabel (the human question-type tag, e.g. 漢字読み / 文法形式選擇) and
  // targetForm are emitted SEPARATELY rather than collapsed into one field:
  // exam items default targetForm to "reading", so collapsing would hide the
  // real form. A reviewer needs both to identify what the question tests.
  const level = orDash(vocab.level);
  const expected = question.expectedAnswers.join(" / ") || DASH;

  const header = "[題目回報 / question report]";
  const lines = [
    header,
    `reason: ${reason}`,
    `questionId: ${orDash(question.id)}`,
    `promptLabel: ${orDash(question.promptLabel)}`,
    `targetForm: ${orDash(question.targetForm)}`,
    `level: ${level}`,
    `vocabId: ${orDash(vocab.id)}`,
    `surface: ${orDash(vocab.surface)}`,
    `reading: ${orDash(vocab.reading)}`,
    `prompt: ${orDash(question.promptText)}`,
    `expectedAnswers: ${expected}`,
    `selectedAnswer: ${orDash(selectedAnswer)}`,
    `uiLanguage: ${language}`
  ];

  // The structured header block must always survive the cap; only the free-text
  // detail is trimmed to fit. Reserve room for the detail label + a newline.
  const structured = lines.join("\n");
  const detailText = detail?.trim();
  if (!detailText) {
    return structured.slice(0, FEEDBACK_MAX);
  }

  const detailPrefix = "\ndetail: ";
  const room = FEEDBACK_MAX - structured.length - detailPrefix.length;
  if (room <= 0) {
    // Pathological: even the structured block alone exceeds the cap.
    return structured.slice(0, FEEDBACK_MAX);
  }
  return `${structured}${detailPrefix}${detailText.slice(0, room)}`;
}
