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
      partOfSpeech: "noun",
      group: null,
      lesson: null,
      tags: ["exam_style", input.level],
      examples: [
        {
          japanese: input.exampleJapanese ?? input.promptText.replace("___", input.expectedAnswer),
          meaningZh: input.exampleMeaningZh ?? input.promptContextZh
        }
      ],
      level: input.level
    },
    targetForm: input.targetForm ?? "reading",
    expectedAnswers: [input.expectedAnswer],
    explanation: input.explanation,
    promptLabel: input.promptLabel,
    promptText: input.promptText,
    promptContextZh: input.promptContextZh,
    hintZh: input.hintZh,
    instructionZh: input.instructionZh,
    options: input.options
  };
}
