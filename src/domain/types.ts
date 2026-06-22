export type PartOfSpeech = "verb" | "i_adjective" | "na_adjective" | "noun" | "adverb";

export type VerbGroup = "godan" | "ichidan" | "irregular";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type TargetForm =
  | "dictionary"
  | "masu"
  | "nai"
  | "negativeTe"
  | "negativeContinuative"
  | "adverbial"
  | "obligationPast"
  | "te"
  | "ta"
  | "potential"
  | "volitional"
  | "causative"
  | "passive"
  | "desiderative"
  | "reading"
  | "meaning"
  | "plainPresentAffirmative"
  | "plainPresentNegative"
  | "plainPastAffirmative"
  | "plainPastNegative";

export interface ExampleSentence {
  japanese: string;
  meaningZh: string;
}

export interface VocabularyItem {
  id: string;
  surface: string;
  reading: string;
  meaningZh: string;
  partOfSpeech: PartOfSpeech;
  group: VerbGroup | null;
  lesson: number | null;
  tags: string[];
  examples: ExampleSentence[];
  level?: JlptLevel;
}

export interface ConjugationResult {
  targetForm: TargetForm;
  answers: string[];
  explanation: string;
}

export interface PracticeQuestion {
  id: string;
  vocabulary: VocabularyItem;
  targetForm: TargetForm;
  expectedAnswers: string[];
  explanation: string;
  promptLabel?: string;
  promptText?: string;
  /**
   * Full Chinese translation of the prompt. Shown POST-answer in the
   * feedback panel. May contain content that would otherwise hint at
   * the correct answer (e.g. "請勿停車" gives away 「てはいけません」),
   * which is why pre-answer display switched from this to `hintZh`.
   */
  promptContextZh?: string;
  /**
   * Pre-answer "neutral situation" hint shown above the prompt. Should
   * describe WHO/WHERE/WHAT the context is without naming the answer's
   * grammatical role. Falls back to `promptContextZh` only as a
   * compatibility shim for items that haven't been audited yet.
   */
  hintZh?: string;
  instructionZh?: string;
  options?: string[];
}

export interface Attempt {
  questionId?: string;
  vocabularyId: string;
  targetForm: TargetForm;
  prompt: string;
  expectedAnswers: string[];
  submittedAnswer: string;
  isCorrect: boolean;
  timestamp: number;
  responseTimeMs: number;
}
