import type { JlptLevel, TargetForm } from "../types";

export type ExamQuestionInput = {
  id: string;
  level: JlptLevel;
  surface: string;
  reading: string;
  meaningZh: string;
  targetForm?: TargetForm;
  promptLabel: string;
  instructionZh: string;
  promptText: string;
  promptContextZh: string;
  /**
   * Pre-answer neutral situation hint. Optional during the staged
   * audit -- items without it fall back to promptContextZh (which
   * may leak the answer category). Once a batch is audited, items
   * should never go back to nullable hintZh.
   */
  hintZh?: string;
  expectedAnswer: string;
  options: string[];
  explanation: string;
  /**
   * Override the auto-generated example sentence. Needed for question types
   * (e.g. 用法 / 言い換え類義) where the prompt is an instruction or the
   * target phrase rather than a sentence with a blank.
   */
  exampleJapanese?: string;
  exampleMeaningZh?: string;
};
