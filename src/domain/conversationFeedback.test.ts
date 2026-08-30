import { describe, expect, it } from "vitest";
import {
  createCuratedConversationFeedbackEvaluator,
  evaluateCuratedConversationResponse,
  toConversationFeedbackAnalytics,
  type CuratedConversationResponse
} from "./conversationFeedback";

describe("evaluateCuratedConversationResponse", () => {
  it("preserves an understandable message while identifying grammar that still needs work", () => {
    const response = {
      id: "weekend-understandable-01",
      responseJapanese: "昨日、友達、飲みました。",
      context: {
        situation: "A classmate asks what the learner did yesterday.",
        relationship: "classmates using polite casual conversation",
        discourse: "The learner is answering a direct question about yesterday."
      },
      feedback: {
        languageQuality: "understandable",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "answer", canonicalSkillId: "share" }],
        authorRationale: {
          understandable: "The intended activity and time are recoverable.",
          correct: "The companion marker and destination construction need work."
        }
      }
    } as const satisfies CuratedConversationResponse<"share">;

    expect(evaluateCuratedConversationResponse(response)).toMatchObject({
      source: "curated",
      responseId: "weekend-understandable-01",
      languageQuality: "understandable",
      dimensions: {
        understandable: "met",
        correct: "needs_work",
        natural: "needs_work",
        continuation: "met",
        register_context_fit: "met"
      },
      composition: [{ feature: "answer", canonicalSkillId: "share" }]
    });
  });

  it("keeps dead-end, continuing, and enriching responses distinct without a numeric score", () => {
    const context = {
      situation: "A classmate has just shared a weekend trip to Kamakura.",
      relationship: "classmates using polite casual conversation",
      discourse: "The partner has offered a new experience for the learner to develop."
    };
    const cases = [
      {
        id: "kamakura-dead-end",
        responseJapanese: "そうですか。",
        context,
        feedback: {
          languageQuality: "natural",
          continuation: "dead_end",
          registerContextFit: "fits",
          composition: [{ feature: "answer", canonicalSkillId: "react" }],
          authorRationale: {
            continuation: "The acknowledgement offers no next conversational move."
          }
        }
      },
      {
        id: "kamakura-better",
        responseJapanese: "いいですね。どうでした？",
        context,
        feedback: {
          languageQuality: "natural",
          continuation: "opens_thread",
          registerContextFit: "fits",
          composition: [{ feature: "ask", canonicalSkillId: "expand" }],
          authorRationale: {
            continuation: "The follow-up invites the partner to develop the trip."
          }
        }
      },
      {
        id: "kamakura-richer",
        responseJapanese: "いいですね！最近行ってないです。人多かったですか？",
        context,
        feedback: {
          languageQuality: "natural",
          continuation: "enriches_thread",
          registerContextFit: "fits",
          composition: [
            { feature: "add", canonicalSkillId: "share" },
            { feature: "ask", canonicalSkillId: "expand" }
          ],
          authorRationale: {
            continuation: "The learner adds relevant material and invites a focused reply."
          }
        }
      }
    ] as const satisfies readonly CuratedConversationResponse<string>[];

    expect(cases.map(evaluateCuratedConversationResponse)).toMatchObject([
      { continuationQuality: "dead_end", dimensions: { continuation: "needs_work" } },
      {
        continuationQuality: "opens_thread",
        dimensions: { continuation: "met" },
        composition: [{ feature: "ask", canonicalSkillId: "expand" }]
      },
      {
        continuationQuality: "enriches_thread",
        dimensions: { continuation: "met" },
        composition: [
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ]
      }
    ]);
  });

  it("maps the Ask feature by conversational function rather than treating it as a skill", () => {
    const followUp = {
      id: "ask-follow-up",
      responseJapanese: "どうでした？",
      context: {
        situation: "The partner has shared a trip.",
        relationship: "classmates",
        discourse: "The learner asks about the partner's contribution."
      },
      feedback: {
        languageQuality: "correct",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "ask", canonicalSkillId: "expand" }],
        authorRationale: {}
      }
    } as const satisfies CuratedConversationResponse<"expand">;
    const askBack = {
      ...followUp,
      id: "ask-back",
      responseJapanese: "〇〇さんは何してました？",
      context: {
        ...followUp.context,
        discourse: "The learner has answered and returns responsibility to the partner."
      },
      feedback: {
        ...followUp.feedback,
        composition: [{ feature: "ask", canonicalSkillId: "bounce" }]
      }
    } as const satisfies CuratedConversationResponse<"bounce">;

    expect(evaluateCuratedConversationResponse(followUp).composition).toEqual([
      { feature: "ask", canonicalSkillId: "expand" }
    ]);
    expect(evaluateCuratedConversationResponse(askBack).composition).toEqual([
      { feature: "ask", canonicalSkillId: "bounce" }
    ]);
  });

  it("reports register mismatch independently from other successful dimensions", () => {
    const response = {
      id: "teacher-register-mismatch",
      responseJapanese: "週末何してた？",
      context: {
        situation: "The learner opens a weekend topic with a teacher.",
        relationship: "student speaking to a teacher",
        discourse: "This is the first topic after class."
      },
      feedback: {
        languageQuality: "correct",
        continuation: "opens_thread",
        registerContextFit: "mismatch",
        composition: [{ feature: "ask", canonicalSkillId: "open" }],
        authorRationale: {
          register_context_fit: "The plain form is too familiar for the declared relationship."
        }
      }
    } as const satisfies CuratedConversationResponse<"open">;

    expect(evaluateCuratedConversationResponse(response)).toMatchObject({
      continuationQuality: "opens_thread",
      registerContextFit: "mismatch",
      dimensions: {
        understandable: "met",
        correct: "met",
        natural: "needs_work",
        continuation: "met",
        register_context_fit: "needs_work"
      }
    });
  });

  it("can identify production that has not yet reached the understandable stage", () => {
    const response = {
      id: "not-yet-understandable",
      responseJapanese: "昨日、友達。",
      context: {
        situation: "A classmate asks what the learner did yesterday.",
        relationship: "classmates",
        discourse: "The fragment does not communicate an activity."
      },
      feedback: {
        languageQuality: "not_understandable",
        continuation: "dead_end",
        registerContextFit: "fits",
        composition: [],
        authorRationale: {
          understandable: "The partner cannot recover what happened from the fragment."
        }
      }
    } as const satisfies CuratedConversationResponse<string>;

    expect(evaluateCuratedConversationResponse(response).dimensions).toMatchObject({
      understandable: "needs_work",
      correct: "needs_work",
      natural: "needs_work"
    });
  });

  it("keeps naturalness relative to the declared discourse context", () => {
    const responseJapanese = "昨日、友達と飲みに行ってたんです。";
    const explanatory = {
      id: "past-explanatory-context",
      responseJapanese,
      context: {
        situation: "A classmate asks what the learner did yesterday.",
        relationship: "classmates using polite casual conversation",
        discourse: "The response explains the background to the partner's direct question."
      },
      feedback: {
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "answer", canonicalSkillId: "share" }],
        authorRationale: {
          natural: "The explanatory form fits the prompted background explanation."
        }
      }
    } as const satisfies CuratedConversationResponse<"share">;
    const unpromptedAnnouncement = {
      ...explanatory,
      id: "past-unprompted-context",
      context: {
        ...explanatory.context,
        discourse: "The learner volunteers a standalone factual announcement without an explanatory prompt."
      },
      feedback: {
        ...explanatory.feedback,
        languageQuality: "correct",
        authorRationale: {
          natural: "A plain past event report better fits this unprompted announcement."
        }
      }
    } as const satisfies CuratedConversationResponse<"share">;

    const naturalResult = evaluateCuratedConversationResponse(explanatory);
    const contextSpecificResult = evaluateCuratedConversationResponse(unpromptedAnnouncement);

    expect(naturalResult).toMatchObject({
      context: explanatory.context,
      languageQuality: "natural",
      dimensions: { natural: "met" }
    });
    expect(contextSpecificResult).toMatchObject({
      context: unpromptedAnnouncement.context,
      languageQuality: "correct",
      dimensions: { natural: "needs_work" }
    });
  });

  it("rejects curated naturalness or pragmatic judgments without complete context", () => {
    const incomplete = {
      id: "missing-discourse",
      responseJapanese: "昨日、友達と飲みに行ってたんです。",
      context: {
        situation: "A classmate asks about yesterday.",
        relationship: "classmates",
        discourse: "   "
      },
      feedback: {
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "answer", canonicalSkillId: "share" }],
        authorRationale: {}
      }
    } as const satisfies CuratedConversationResponse<"share">;

    expect(() => evaluateCuratedConversationResponse(incomplete)).toThrow(
      "Curated conversation feedback requires non-empty situation, relationship, and discourse context."
    );
  });

  it("projects deterministic analytics categories without learner or author text", () => {
    const response = {
      id: "analytics-boundary-example",
      responseJapanese: "いいですね！最近行ってないです。人多かったですか？",
      context: {
        situation: "A classmate has shared a weekend trip.",
        relationship: "classmates",
        discourse: "The learner develops the partner's contribution."
      },
      feedback: {
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "ask", canonicalSkillId: "expand" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          continuation: "Free-form author rationale must stay out of analytics."
        }
      }
    } as const satisfies CuratedConversationResponse<"expand" | "share">;

    const firstEvaluation = evaluateCuratedConversationResponse(response);
    const secondEvaluation = evaluateCuratedConversationResponse(response);
    const analytics = toConversationFeedbackAnalytics(firstEvaluation);

    expect(secondEvaluation).toEqual(firstEvaluation);
    expect(analytics).toEqual({
      source: "curated",
      languageQuality: "natural",
      continuationQuality: "enriches_thread",
      registerContextFit: "fits",
      understandable: "met",
      correct: "met",
      natural: "met",
      continuation: "met",
      register_context_fit: "met",
      compositionFeatures: ["add", "ask"]
    });
    expect(JSON.stringify(analytics)).not.toContain(response.id);
    expect(JSON.stringify(analytics)).not.toContain(response.responseJapanese);
    expect(JSON.stringify(analytics)).not.toContain(response.context.situation);
    expect(JSON.stringify(analytics)).not.toContain(
      response.feedback.authorRationale.continuation
    );
    expect(JSON.stringify(analytics)).not.toContain("expand");
    expect(JSON.stringify(analytics)).not.toContain("share");
  });

  it("exposes deterministic curated evaluation through the provider-neutral evaluator seam", async () => {
    const response = {
      id: "future-evaluator-seam",
      responseJapanese: "いいですね。どうでした？",
      context: {
        situation: "A classmate has shared a weekend trip.",
        relationship: "classmates",
        discourse: "The learner follows up on the partner's contribution."
      },
      feedback: {
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "ask", canonicalSkillId: "expand" }],
        authorRationale: {}
      }
    } as const satisfies CuratedConversationResponse<"expand">;
    const evaluator = createCuratedConversationFeedbackEvaluator<"expand">();

    await expect(evaluator.evaluate(response)).resolves.toEqual(
      evaluateCuratedConversationResponse(response)
    );
  });
});
