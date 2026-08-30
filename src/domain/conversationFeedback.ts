export const CONVERSATION_FEEDBACK_DIMENSIONS = [
  "understandable",
  "correct",
  "natural",
  "continuation",
  "register_context_fit"
] as const;

export type ConversationFeedbackDimension =
  (typeof CONVERSATION_FEEDBACK_DIMENSIONS)[number];
export type ConversationFeedbackStatus = "met" | "needs_work";
export type ConversationLanguageQuality =
  | "not_understandable"
  | "understandable"
  | "correct"
  | "natural";
export type ConversationContinuationQuality =
  | "dead_end"
  | "opens_thread"
  | "enriches_thread";
export type ConversationRegisterContextFit = "fits" | "mismatch";
export type ConversationFeedbackSource = "curated" | "bounded_ai";
export const CONVERSATION_COMPOSITION_FEATURES = ["answer", "add", "ask"] as const;
export type ConversationCompositionFeature =
  (typeof CONVERSATION_COMPOSITION_FEATURES)[number];

export interface ConversationFeedbackContext {
  situation: string;
  relationship: string;
  discourse: string;
}

export interface ConversationCompositionSignal<CanonicalSkillId extends string> {
  feature: ConversationCompositionFeature;
  canonicalSkillId: CanonicalSkillId;
}

export interface CuratedConversationResponse<CanonicalSkillId extends string> {
  id: string;
  responseJapanese: string;
  context: ConversationFeedbackContext;
  feedback: {
    languageQuality: ConversationLanguageQuality;
    continuation: ConversationContinuationQuality;
    registerContextFit: ConversationRegisterContextFit;
    composition: readonly ConversationCompositionSignal<CanonicalSkillId>[];
    authorRationale: Partial<Record<ConversationFeedbackDimension, string>>;
  };
}

export interface ConversationFeedbackResult<
  CanonicalSkillId extends string,
  Source extends ConversationFeedbackSource = ConversationFeedbackSource
> {
  source: Source;
  responseId: string;
  context: ConversationFeedbackContext;
  languageQuality: ConversationLanguageQuality;
  continuationQuality: ConversationContinuationQuality;
  registerContextFit: ConversationRegisterContextFit;
  dimensions: Record<ConversationFeedbackDimension, ConversationFeedbackStatus>;
  composition: readonly ConversationCompositionSignal<CanonicalSkillId>[];
  authorRationale: Partial<Record<ConversationFeedbackDimension, string>>;
}

export interface ConversationFeedbackAnalytics {
  source: ConversationFeedbackSource;
  languageQuality: ConversationLanguageQuality;
  continuationQuality: ConversationContinuationQuality;
  registerContextFit: ConversationRegisterContextFit;
  understandable: ConversationFeedbackStatus;
  correct: ConversationFeedbackStatus;
  natural: ConversationFeedbackStatus;
  continuation: ConversationFeedbackStatus;
  register_context_fit: ConversationFeedbackStatus;
  compositionFeatures: readonly ConversationCompositionFeature[];
}

export interface ConversationFeedbackEvaluator<
  Input,
  CanonicalSkillId extends string,
  Source extends ConversationFeedbackSource = ConversationFeedbackSource
> {
  evaluate(input: Input): Promise<ConversationFeedbackResult<CanonicalSkillId, Source>>;
}

const LANGUAGE_QUALITY_LEVEL = {
  not_understandable: 0,
  understandable: 1,
  correct: 2,
  natural: 3
} as const satisfies Record<ConversationLanguageQuality, number>;

export function evaluateCuratedConversationResponse<CanonicalSkillId extends string>(
  response: CuratedConversationResponse<CanonicalSkillId>
): ConversationFeedbackResult<CanonicalSkillId, "curated"> {
  const { situation, relationship, discourse } = response.context;
  if ([situation, relationship, discourse].some((value) => value.trim().length === 0)) {
    throw new Error(
      "Curated conversation feedback requires non-empty situation, relationship, and discourse context."
    );
  }
  if (
    response.feedback.languageQuality === "natural" &&
    response.feedback.registerContextFit === "mismatch"
  ) {
    throw new Error(
      "Natural conversation feedback requires register/context fit for the declared context."
    );
  }

  const attainedLanguageQuality = LANGUAGE_QUALITY_LEVEL[response.feedback.languageQuality];

  return {
    source: "curated",
    responseId: response.id,
    context: response.context,
    languageQuality: response.feedback.languageQuality,
    continuationQuality: response.feedback.continuation,
    registerContextFit: response.feedback.registerContextFit,
    dimensions: {
      understandable: attainedLanguageQuality >= 1 ? "met" : "needs_work",
      correct: attainedLanguageQuality >= 2 ? "met" : "needs_work",
      natural: attainedLanguageQuality >= 3 ? "met" : "needs_work",
      continuation:
        response.feedback.continuation === "dead_end" ? "needs_work" : "met",
      register_context_fit:
        response.feedback.registerContextFit === "fits" ? "met" : "needs_work"
    },
    composition: response.feedback.composition,
    authorRationale: response.feedback.authorRationale
  };
}

export function toConversationFeedbackAnalytics<CanonicalSkillId extends string>(
  feedback: ConversationFeedbackResult<CanonicalSkillId>
): ConversationFeedbackAnalytics {
  const presentFeatures = new Set(
    feedback.composition.map(({ feature }) => feature)
  );

  return {
    source: feedback.source,
    languageQuality: feedback.languageQuality,
    continuationQuality: feedback.continuationQuality,
    registerContextFit: feedback.registerContextFit,
    understandable: feedback.dimensions.understandable,
    correct: feedback.dimensions.correct,
    natural: feedback.dimensions.natural,
    continuation: feedback.dimensions.continuation,
    register_context_fit: feedback.dimensions.register_context_fit,
    compositionFeatures: CONVERSATION_COMPOSITION_FEATURES.filter((feature) =>
      presentFeatures.has(feature)
    )
  };
}

export function createCuratedConversationFeedbackEvaluator<CanonicalSkillId extends string>():
  ConversationFeedbackEvaluator<
    CuratedConversationResponse<CanonicalSkillId>,
    CanonicalSkillId,
    "curated"
  > {
  return {
    evaluate: async (response) => evaluateCuratedConversationResponse(response)
  };
}
