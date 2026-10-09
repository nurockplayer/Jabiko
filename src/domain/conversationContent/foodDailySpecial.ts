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

interface FoodBindingInput {
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

function foodBinding(input: FoodBindingInput): ConversationSessionResponseBinding {
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

export const foodDailySpecial: ConversationSessionDefinition = {
    scenario: {
      id: "food-short-daily-special-clarification",
      topic: "clarifying a lunch menu term",
      world: "lunch break at the office cafeteria",
      situation: learnerText(
        "午休時，你和常聊天的同事一起看餐廳菜單。對方提到很受歡迎的「每日特餐」，你不太清楚這個名稱代表什麼。",
        "昼休みに、よく話す同僚と食堂のメニューを見ています。相手が人気の「日替わり定食」に触れましたが、その言葉の意味がよく分かりません。",
        "At lunch, you are looking at the cafeteria menu with a coworker you often chat with. They mention the popular daily set meal, but you are not sure what the term means."
      ),
      relationship: {
        learnerRole: "coworker",
        partnerRole: "coworker",
        context: learnerText(
          "平常會輕鬆聊天的同事，彼此熟悉但仍使用自然有禮的日語。",
          "普段から気軽に話す同僚です。親しみを保ちながら、自然な丁寧語で話します。",
          "You are coworkers who chat casually. Keep a friendly tone with natural polite Japanese."
        )
      },
      length: "short",
      primarySkills: ["repair"],
      difficulty: {
        linguisticComplexity: "basic",
        partnerSupport: "supportive",
        relationshipDistance: "familiar",
        topicDepth: "concrete",
        interactionPressure: "low"
      },
      objective: learnerText(
        "遇到不熟悉的菜單名稱時，用簡短、自然的問題確認意思。",
        "知らないメニューの言葉が出たら、短く自然な質問で意味を確かめましょう。",
        "When an unfamiliar menu term comes up, ask a brief, natural question to clarify what it means."
      ),
      instruction: learnerText(
        "直接詢問「每日特餐」的意思或今天供應的料理即可；不需要假裝已經知道內容。",
        "「日替わり定食」の意味や今日の料理をそのまま尋ねましょう。内容を知っているふりをする必要はありません。",
        "Ask directly what the daily set means or what is served today. You do not need to pretend you already know."
      ),
      startStepId: "food-short-daily-special-opening",
      steps: [
        {
          id: "food-short-daily-special-opening",
          kind: "partner_line",
          japanese: "この食堂、日替わり定食が人気なんです。昼休みによく頼むんですよ。",
          nextStepId: "food-short-daily-special-response"
        },
        {
          id: "food-short-daily-special-response",
          kind: "learner_response",
          prompt: learnerText(
            "可以直接確認這個名稱的意思，或詢問今天供應什麼料理。",
            "言葉の意味を直接確認するか、今日の料理について尋ねましょう。",
            "Ask directly what the term means, or ask what dish is served today."
          ),
          responseExamples: [
            {
              id: "food-short-daily-special-meaning",
              kind: "suggested",
              japanese: "すみません、日替わり定食ってどんなものですか？",
              explanation: learnerText(
                "直接詢問不熟悉的名稱，讓同事可以用自己的話簡單說明。",
                "知らない言葉について率直に質問し、相手が簡単に説明できる形にしています。",
                "You ask directly about the unfamiliar term and give your coworker an easy opening to explain it."
              )
            },
            {
              id: "food-short-daily-special-menu",
              kind: "accepted",
              japanese: "日替わり定食は、毎日メニューが変わるセットなんですか？",
              explanation: learnerText(
                "用確認問題確認自己對名稱的理解，也讓同事能補充這份套餐的內容。",
                "確認の形で言葉の理解を確かめ、セットの内容も説明してもらえる質問です。",
                "You check your understanding and invite your coworker to explain what comes in the set."
              )
            },
            {
              id: "food-short-daily-special-today",
              kind: "accepted",
              japanese: "日替わり定食の内容がまだよく分からないんですが、今日はどんな料理が出るんですか？",
              explanation: learnerText(
                "明確表示還不清楚每日特餐的內容，並詢問今天供應的菜色。",
                "日替わり定食の内容がまだ分からないと伝えてから、今日の料理を尋ねています。",
                "You say you are still unsure what the daily set includes, then ask what is served today."
              )
            }
          ],
          branches: [{ id: "food-short-daily-special-explained", nextStepId: "food-short-daily-special-answer" }]
        },
        {
          id: "food-short-daily-special-answer",
          kind: "partner_line",
          japanese: "この食堂では、日替わりで主菜が変わるセットに、ご飯と味噌汁が付きます。今日は焼き魚ですよ。",
          nextStepId: "food-short-daily-special-complete"
        },
        {
          id: "food-short-daily-special-complete",
          kind: "completion",
          summary: learnerText(
            "你自然地確認了菜單用語，並聽到每日特餐的組成和今天供應的菜色。",
            "メニューの言葉を自然に確認し、日替わり定食の内容と今日の料理を聞けました。",
            "You naturally clarified the menu term and learned what the daily set includes and what is served today."
          )
        }
      ]
    },
    responses: [
      foodBinding({
        stepId: "food-short-daily-special-response",
        responseExampleId: "food-short-daily-special-meaning",
        branchId: "food-short-daily-special-explained",
        responseJapanese: "すみません、日替わり定食ってどんなものですか？",
        situation: "A coworker mentions the cafeteria's popular daily set meal while looking at the menu.",
        relationship: "Familiar coworkers who chat casually; a brief polite clarification is natural.",
        discourse: "The learner directly repairs a gap in understanding by asking what the menu term means.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "ask", canonicalSkillId: "repair" }],
        authorRationale: {
          natural: "ってどんなものですか is a natural, conversational way to ask about an unfamiliar dish.",
          continuation: "The direct question gives the coworker a clear opportunity to explain the set.",
          register_context_fit: "すみません softens a simple clarification without making the familiar exchange stiff."
        }
      }),
      foodBinding({
        stepId: "food-short-daily-special-response",
        responseExampleId: "food-short-daily-special-menu",
        branchId: "food-short-daily-special-explained",
        responseJapanese: "日替わり定食は、毎日メニューが変わるセットなんですか？",
        situation: "A coworker mentions the cafeteria's popular daily set meal while looking at the menu.",
        relationship: "Familiar coworkers who chat casually; a brief polite clarification is natural.",
        discourse: "The learner checks whether the set menu changes from day to day.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "ask", canonicalSkillId: "repair" }],
        authorRationale: {
          natural: "The confirmation question states the learner's current understanding in ordinary polite Japanese.",
          continuation: "The coworker can confirm the daily change and explain today's dish in the same answer.",
          register_context_fit: "The question is direct but appropriately polite for a coworker."
        }
      }),
      foodBinding({
        stepId: "food-short-daily-special-response",
        responseExampleId: "food-short-daily-special-today",
        branchId: "food-short-daily-special-explained",
        responseJapanese: "日替わり定食の内容がまだよく分からないんですが、今日はどんな料理が出るんですか？",
        situation: "A coworker mentions the cafeteria's popular daily set meal while looking at the menu.",
        relationship: "Familiar coworkers who chat casually; a brief polite clarification is natural.",
        discourse: "The learner says the daily set's contents are still unclear and asks what is served today before choosing lunch.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "ask", canonicalSkillId: "repair" }],
        authorRationale: {
          natural: "The question directly requests today's dish and fits the shared menu context.",
          continuation: "The coworker's reply supplies both the set format and today's main dish.",
          register_context_fit: "The polite question suits casual lunch conversation at work."
        }
      })
    ]
  };
