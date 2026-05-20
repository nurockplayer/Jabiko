export type PartOfSpeech = "verb" | "i_adjective" | "na_adjective";

export type VerbGroup = "godan" | "ichidan" | "irregular";

export type TargetForm =
  | "dictionary"
  | "masu"
  | "nai"
  | "te"
  | "ta"
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
