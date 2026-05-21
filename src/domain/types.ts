export type PartOfSpeech = "verb" | "i_adjective" | "na_adjective" | "noun";

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
  | "reading"
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
}

export interface Attempt {
  vocabularyId: string;
  targetForm: TargetForm;
  prompt: string;
  expectedAnswers: string[];
  submittedAnswer: string;
  isCorrect: boolean;
  timestamp: number;
  responseTimeMs: number;
}
