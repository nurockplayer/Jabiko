export type PartOfSpeech = "verb" | "i_adjective" | "na_adjective" | "noun" | "adverb";

export type VerbGroup = "godan" | "ichidan" | "irregular";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

/**
 * Supported UI locale codes. Single source of truth in the domain layer so
 * content overlays (e.g. `explanationI18n`) and the i18n `Language` type can
 * both reference it without the UI layer owning a domain concept. `i18n.ts`
 * derives `Language` from this.
 */
export type LocaleCode = "zh-Hant" | "ja" | "en" | "th" | "id" | "ko" | "vi" | "my";

/**
 * Per-locale translation overlay for a Chinese-source content field. Absent
 * locales fall back to the zh-Hant source (see `pickLocalized`). AI-assisted
 * translation (#378) only ever writes these overlays, never the source.
 */
export type LocalizedText = Partial<Record<LocaleCode, string>>;

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
  /** Per-locale translations of `meaningZh`; falls back to the zh source (#378/#400). */
  meaningI18n?: LocalizedText;
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
  /** Per-locale translations of `explanation`; falls back to the zh source (#378). */
  explanationI18n?: LocalizedText;
  promptLabel?: string;
  promptText?: string;
  /**
   * Full Chinese translation of the prompt. Shown POST-answer in the
   * feedback panel. May contain content that would otherwise hint at
   * the correct answer (e.g. "請勿停車" gives away 「てはいけません」),
   * which is why pre-answer display switched from this to `hintZh`.
   */
  promptContextZh?: string;
  /** Per-locale translations of `promptContextZh`; falls back to the zh source (#400). */
  promptContextI18n?: LocalizedText;
  /**
   * Pre-answer "neutral situation" hint shown above the prompt. Should
   * describe WHO/WHERE/WHAT the context is without naming the answer's
   * grammatical role. Falls back to `promptContextZh` only as a
   * compatibility shim for items that haven't been audited yet.
   */
  hintZh?: string;
  /** Per-locale translations of `hintZh`; falls back to the zh source (#400). */
  hintI18n?: LocalizedText;
  instructionZh?: string;
  /** Per-locale translations of `instructionZh`; falls back to the zh source (#400). */
  instructionI18n?: LocalizedText;
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
