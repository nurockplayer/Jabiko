import type {
  ConversationCompositionFeature,
  ConversationContinuationQuality,
  ConversationFeedbackDimension,
  ConversationLanguageQuality,
  ConversationRegisterContextFit
} from "../conversationFeedback";
import type { ConversationLearnerText, ConversationSkillId } from "../conversationScenario";
import type {
  ConversationSessionDefinition,
  ConversationSessionResponseBinding
} from "../conversationSession";

function learnerText(textZh: string, ja: string, en: string): ConversationLearnerText {
  return { textZh, textI18n: { ja, en } };
}

interface WeekendBindingInput {
  stepId: string;
  responseExampleId: string;
  branchId: string;
  responseJapanese: string;
  situation: string;
  relationship: string;
  discourse: string;
  languageQuality: ConversationLanguageQuality;
  continuation: ConversationContinuationQuality;
  registerContextFit: ConversationRegisterContextFit;
  composition: readonly {
    feature: ConversationCompositionFeature;
    canonicalSkillId: ConversationSkillId;
  }[];
  authorRationale: Partial<Record<ConversationFeedbackDimension, string>>;
}

function weekendBinding(input: WeekendBindingInput): ConversationSessionResponseBinding {
  return {
    stepId: input.stepId,
    responseExampleId: input.responseExampleId,
    branchId: input.branchId,
    feedback: {
      id: `${input.responseExampleId}-feedback`,
      responseJapanese: input.responseJapanese,
      context: {
        situation: input.situation,
        relationship: input.relationship,
        discourse: input.discourse
      },
      feedback: {
        languageQuality: input.languageQuality,
        continuation: input.continuation,
        registerContextFit: input.registerContextFit,
        composition: input.composition,
        authorRationale: input.authorRationale
      }
    }
  };
}

export const weekendShortMoviePlans: ConversationSessionDefinition = {
    scenario: {
      id: "weekend-short-movie-plans",
      topic: "weekend plans",
      world: "casual conversation at the office",
      situation: learnerText(
        "週一早上，你和常聊天的同事聊到週末安排。對方提起週六要去看電影。",
        "月曜日の朝、よく話す同僚と週末の予定について話しています。相手は土曜日に映画を見に行くそうです。",
        "On Monday morning, you are chatting with a coworker you know well about the weekend. They mention going to a movie on Saturday."
      ),
      relationship: {
        learnerRole: "coworker",
        partnerRole: "coworker",
        context: learnerText(
          "平常會輕鬆聊天的同事。使用親切但自然的です・ます語氣。",
          "普段から気軽に話す同僚です。親しみのある自然な「です・ます」で話します。",
          "You are coworkers who chat casually. Use friendly, natural polite Japanese."
        )
      },
      length: "short",
      primarySkills: ["react", "share", "expand"],
      difficulty: {
        linguisticComplexity: "basic",
        partnerSupport: "supportive",
        relationshipDistance: "familiar",
        topicDepth: "concrete",
        interactionPressure: "low"
      },
      objective: learnerText(
        "快速回應同事的週末計畫，並分享一點自己的近況或問一個自然的後續問題。",
        "同僚の週末の予定にすばやく反応し、自分のことを少し話すか、自然な質問を一つ返しましょう。",
        "React quickly to your coworker's weekend plan, then share a little about yourself or ask one natural follow-up."
      ),
      instruction: learnerText(
        "用一兩句話接住對方的話題。簡短回應也可以，只要符合情境並讓交流自然往下走。",
        "一、二文で相手の話題を受け止めましょう。短い返事でも、場面に合っていて自然に続けば十分です。",
        "Pick up the partner's topic in one or two sentences. A brief reply is enough when it fits and keeps the exchange natural."
      ),
      startStepId: "weekend-short-movie-opening",
      steps: [
        {
          id: "weekend-short-movie-opening",
          kind: "partner_line",
          japanese: "週末は何か予定ありますか？私は土曜日に友人と映画を見に行くんです。",
          nextStepId: "weekend-short-movie-response"
        },
        {
          id: "weekend-short-movie-response",
          kind: "learner_response",
          prompt: learnerText(
            "回應對方的電影計畫。可以問電影、分享自己的安排，或簡單說說週末的過法。",
            "相手の映画の予定に反応しましょう。映画について聞いても、自分の予定や週末の過ごし方を話してもかまいません。",
            "Respond to the movie plan. You can ask about the film, share your own plan, or say briefly how you spend the weekend."
          ),
          responseExamples: [
            {
              id: "weekend-short-movie-followup",
              kind: "suggested",
              japanese: "いいですね。どんな映画を見るんですか？",
              explanation: learnerText(
                "先表示興趣，再問一個直接承接電影計畫的問題，對方很容易接著聊。",
                "まず関心を示してから、映画の予定に沿った質問をしています。相手が答えやすく、会話も続きます。",
                "You show interest and ask a question directly connected to the plan, giving the partner an easy way to continue."
              )
            },
            {
              id: "weekend-short-movie-share",
              kind: "accepted",
              japanese: "映画館いいですね。私は日曜日に家で料理する予定です。",
              explanation: learnerText(
                "肯定對方的安排，再補充自己的週末計畫，提供另一個生活話題讓對方回應。",
                "相手の予定に共感してから、自分の週末のことを加えています。相手が返せる話題も増えています。",
                "You respond positively and add your own weekend plan, giving the partner another personal detail to respond to."
              )
            },
            {
              id: "weekend-short-movie-quiet",
              kind: "accepted",
              japanese: "そうなんですね。私は週末、家でゆっくりすることが多いです。",
              explanation: learnerText(
                "簡單承接對方的話，再分享自己的習慣。這種簡短回答在閒聊中自然，也留下回應空間。",
                "相手の話を受け止め、自分の習慣を短く伝えています。雑談らしい自然な返しで、会話の余地もあります。",
                "You acknowledge the plan and briefly share your own routine. This is natural small talk and leaves room for a reply."
              )
            }
          ],
          branches: [{ id: "weekend-short-movie-finish", nextStepId: "weekend-short-movie-complete" }]
        },
        {
          id: "weekend-short-movie-complete",
          kind: "completion",
          summary: learnerText(
            "你用簡短回應接住了同事的週末話題，也示範了如何用追問或分享延續閒聊。",
            "短い反応で同僚の週末の話題を受け止め、質問や自分のことを添えて雑談を続けました。",
            "You picked up your coworker's weekend topic with a brief response and continued the small talk with a question or personal detail."
          )
        }
      ]
    },
    responses: [
      weekendBinding({
        stepId: "weekend-short-movie-response",
        responseExampleId: "weekend-short-movie-followup",
        branchId: "weekend-short-movie-finish",
        responseJapanese: "いいですね。どんな映画を見るんですか？",
        situation: "A familiar coworker shares a Saturday movie plan during casual Monday-morning small talk.",
        relationship: "Coworkers who often chat; friendly polite Japanese is appropriate.",
        discourse: "The learner reacts positively and asks a direct follow-up about the shared plan.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The short acknowledgement and question are a natural response in casual coworker conversation.",
          continuation: "The question gives the partner a clear, low-effort next turn.",
          register_context_fit: "The polite question matches familiar but still workplace-based small talk."
        }
      }),
      weekendBinding({
        stepId: "weekend-short-movie-response",
        responseExampleId: "weekend-short-movie-share",
        branchId: "weekend-short-movie-finish",
        responseJapanese: "映画館いいですね。私は日曜日に家で料理する予定です。",
        situation: "A familiar coworker shares a Saturday movie plan during casual Monday-morning small talk.",
        relationship: "Coworkers who often chat; friendly polite Japanese is appropriate.",
        discourse: "The learner affirms the partner's plan and adds a contrasting personal weekend activity.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: {
          natural: "The casual evaluation followed by a simple plan is idiomatic in this familiar context.",
          continuation: "The cooking plan supplies a new detail the coworker can ask about.",
          register_context_fit: "The friendly response remains appropriately polite for coworkers."
        }
      }),
      weekendBinding({
        stepId: "weekend-short-movie-response",
        responseExampleId: "weekend-short-movie-quiet",
        branchId: "weekend-short-movie-finish",
        responseJapanese: "そうなんですね。私は週末、家でゆっくりすることが多いです。",
        situation: "A familiar coworker shares a Saturday movie plan during casual Monday-morning small talk.",
        relationship: "Coworkers who often chat; friendly polite Japanese is appropriate.",
        discourse: "The learner acknowledges the plan and shares a contrasting usual weekend routine without asking a question.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: {
          natural: "A brief acknowledgement and routine share fit ordinary small talk; a follow-up question is optional.",
          continuation: "The different routine gives the partner a possible point of comparison.",
          register_context_fit: "The wording is relaxed without becoming overly familiar for coworkers."
        }
      })
    ]
  };
