import { describe, expect, it } from "vitest";
import {
  evaluateCuratedConversationResponse,
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
        explanations: {
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
});
