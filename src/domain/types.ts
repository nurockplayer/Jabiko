export type PartOfSpeech = "verb" | "i_adjective" | "na_adjective" | "noun" | "adverb";

export type VerbGroup = "godan" | "ichidan" | "irregular";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

/**
 * Every locale code the app knows about, in menu order. THE single source of
 * truth for the locale set — `LocaleCode` derives from it, `i18n.ts` derives
 * `Language`, and the `.mjs` scripts read this exact array back out (see
 * `scripts/_locales.mjs`, guarded by `locales.test.ts`). Keep it on ONE line
 * so the script-side regex parse stays robust; don't reformat.
 */
export const LOCALE_CODES = ["zh-Hant", "ja", "en", "th", "id", "ko", "vi", "my"] as const;

/**
 * Supported UI locale codes. Derived from {@link LOCALE_CODES} so the union and
 * the runtime list can never drift.
 */
export type LocaleCode = (typeof LOCALE_CODES)[number];

/**
 * The zh-Hant SOURCE locale: content is authored here and every `*Zh` field
 * stores it. Overlays translate away from this base.
 */
export const SOURCE_LOCALE = "zh-Hant" satisfies LocaleCode;

/**
 * Locales with a CONTENT-translation obligation: code that synthesizes
 * per-locale text (drill explanations, section subtitles, …) produces an
 * overlay entry for each of these, and adding a code here compile-forces every
 * such structure to supply that locale's string. Distinct from
 * `LAUNCHED_LANGUAGES` (user-facing) — a pilot locale can be a CONTENT locale
 * without being launched, or launched later once its content lands.
 */
export const CONTENT_LOCALES = ["ja", "en"] as const satisfies readonly LocaleCode[];

/** A locale that carries authored content overlays (see {@link CONTENT_LOCALES}). */
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

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
  /** Per-locale translations of `meaningZh`; falls back to the zh source (#400). */
  meaningI18n?: LocalizedText;
}

/**
 * A "worth learning" word that appears in a question's sentence but isn't the
 * item's target (e.g. 取引先 in a grammar item). Shown POST-answer in the
 * feedback panel so a learner picks up N+1 vocabulary in context (#453).
 * `meaningI18n` MUST cover every launched non-zh locale — a completeness guard
 * (contentGuard.test.ts) enforces it so `pickLocalized` never falls back to the
 * Chinese `meaningZh` for en/ja learners (language-isolation rule).
 */
export interface VocabNote {
  surface: string;
  reading: string;
  meaningZh: string;
  /** Per-locale translations of `meaningZh`; required for launched locales (#453). */
  meaningI18n?: LocalizedText;
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
  /** Per-locale translations of `explanation`; falls back to the zh source (#427). */
  explanationI18n?: LocalizedText;
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
  /** Optional "key vocabulary" from the sentence, shown post-answer (#453). */
  vocabNotes?: VocabNote[];
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
