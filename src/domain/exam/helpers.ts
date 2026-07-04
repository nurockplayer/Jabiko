import type { PracticeQuestion } from "../types";
import type { ExamQuestionInput } from "./types";

// Bake the post-answer example sentence by filling the prompt's blank(s).
// Paired/correlative patterns (AやらBやら, AだのBだの…) use two "___" blanks
// and a "やら / やら"-style answer; split it so each blank gets its own half
// instead of dumping the whole "X / Y" into the first blank and leaving the
// second "___" behind. Single-blank items keep the original behaviour.
function bakeExample(promptText: string, expectedAnswer: string): string {
  const blankCount = promptText.split("___").length - 1;
  const parts = expectedAnswer.split(" / ");
  if (blankCount > 1 && parts.length === blankCount) {
    let i = 0;
    return promptText.replace(/___/g, () => parts[i++]);
  }
  return promptText.replace("___", expectedAnswer);
}

export function examQuestion(input: ExamQuestionInput): PracticeQuestion {
  return {
    id: input.id,
    vocabulary: {
      id: input.id,
      surface: input.surface,
      reading: input.reading,
      meaningZh: input.meaningZh,
      meaningI18n: input.meaningI18n,
      partOfSpeech: "noun",
      group: null,
      lesson: null,
      tags: ["exam_style", input.level],
      examples: [
        {
          japanese: input.exampleJapanese ?? bakeExample(input.promptText, input.expectedAnswer),
          meaningZh: input.exampleMeaningZh ?? input.promptContextZh,
          // The localized variant must match whichever zh source was baked in:
          // a custom example meaning gets its own overlay; the promptContext
          // fallback reuses the (already translated) promptContextI18n.
          meaningI18n:
            input.exampleMeaningZh != null ? input.exampleMeaningI18n : input.promptContextI18n
        }
      ],
      level: input.level
    },
    targetForm: input.targetForm ?? "reading",
    expectedAnswers: [input.expectedAnswer],
    explanation: input.explanation,
    explanationI18n: input.explanationI18n,
    promptLabel: input.promptLabel,
    promptText: input.promptText,
    promptContextZh: input.promptContextZh,
    promptContextI18n: input.promptContextI18n,
    hintZh: input.hintZh,
    hintI18n: input.hintI18n,
    instructionZh: input.instructionZh,
    instructionI18n: input.instructionI18n,
    options: input.options,
    vocabNotes: input.vocabNotes
  };
}
