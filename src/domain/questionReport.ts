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

// The prompt is convenience context; long 短文/読解 stems get trimmed so the
// report stays scannable in a table row.
const PROMPT_TRIM = 160;

export function buildQuestionReportMessage(input: QuestionReportInput): string {
  const { question, reason, detail, language, selectedAnswer } = input;
  const vocab = question.vocabulary;

  // 2026-07 rework: a reviewer reads (1) which question, (2) the pick +
  // report reason, (3) the learner's own words -- so those lead. Everything
  // below the `---` separator is derivable from the question id and exists
  // only so a table row makes sense without opening the repo.
  const essentials = [
    `[題目回報 / question report] ${orDash(question.id)}`,
    `reason: ${reason} · selected: ${orDash(selectedAnswer)} · ui: ${language}`
  ];

  const promptText = question.promptText?.trim();
  const contextLines = [
    "---",
    `context: ${orDash(question.promptLabel)} · ${question.targetForm} · ${orDash(vocab.level)} · ${orDash(vocab.surface)}`,
    `expected: ${question.expectedAnswers.join(" / ") || DASH}`
  ];
  if (promptText) {
    contextLines.push(
      `prompt: ${promptText.length > PROMPT_TRIM ? `${promptText.slice(0, PROMPT_TRIM)}…` : promptText}`
    );
  }

  const skeleton = [...essentials, ...contextLines].join("\n");
  const detailText = detail?.trim();
  if (!detailText) {
    return skeleton.slice(0, FEEDBACK_MAX);
  }

  const detailPrefix = "detail: ";
  // Essentials and context are reserved first; the detail gets the remaining
  // room (+1 for the newline its own line adds when inserted).
  const room = FEEDBACK_MAX - skeleton.length - detailPrefix.length - 1;
  if (room <= 0) {
    // Pathological: keep the learner's voice over the convenience block.
    return [...essentials, `${detailPrefix}${detailText}`].join("\n").slice(0, FEEDBACK_MAX);
  }
  return [...essentials, `${detailPrefix}${detailText.slice(0, room)}`, ...contextLines].join("\n");
}
