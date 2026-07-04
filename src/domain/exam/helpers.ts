import type { PracticeQuestion } from "../types";
import type { ExamQuestionInput } from "./types";

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
          japanese: input.exampleJapanese ?? input.promptText.replace("___", input.expectedAnswer),
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
