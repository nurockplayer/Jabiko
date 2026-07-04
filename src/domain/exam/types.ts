import type { JlptLevel, LocalizedText, TargetForm, VocabNote } from "../types";

export type ExamQuestionInput = {
  id: string;
  level: JlptLevel;
  surface: string;
  reading: string;
  meaningZh: string;
  /** Per-locale `meaningZh` overlay (#400); AI translation writes only this. */
  meaningI18n?: LocalizedText;
  targetForm?: TargetForm;
  promptLabel: string;
  instructionZh: string;
  /** Per-locale `instructionZh` overlay (#400). */
  instructionI18n?: LocalizedText;
  promptText: string;
  promptContextZh: string;
  /** Per-locale `promptContextZh` overlay (#400). */
  promptContextI18n?: LocalizedText;
  /**
   * Pre-answer neutral situation hint. Optional during the staged
   * audit -- items without it fall back to promptContextZh (which
   * may leak the answer category). Once a batch is audited, items
   * should never go back to nullable hintZh.
   */
  hintZh?: string;
  /** Per-locale `hintZh` overlay (#400). */
  hintI18n?: LocalizedText;
  expectedAnswer: string;
  options: string[];
  explanation: string;
  /**
   * Per-locale translations of `explanation` (#378). AI-assisted translation
   * writes only this overlay; absent locales fall back to the Chinese source.
   */
  explanationI18n?: LocalizedText;
  /**
   * Override the auto-generated example sentence. Needed for question types
   * (e.g. 用法 / 言い換え類義) where the prompt is an instruction or the
   * target phrase rather than a sentence with a blank.
   */
  exampleJapanese?: string;
  exampleMeaningZh?: string;
  /** Per-locale `exampleMeaningZh` overlay (#400). */
  exampleMeaningI18n?: LocalizedText;
  /**
   * Optional "key vocabulary" worth learning from the sentence, shown
   * post-answer (#453). Each note's `meaningI18n` must cover the launched
   * non-zh locales (enforced by contentGuard.test.ts).
   */
  vocabNotes?: VocabNote[];
};
