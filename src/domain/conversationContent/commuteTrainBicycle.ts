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

interface CommuteBindingInput {
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
  composition: readonly { feature: ConversationCompositionFeature; canonicalSkillId: ConversationSkillId }[];
  authorRationale: Partial<Record<ConversationFeedbackDimension, string>>;
}

function commuteBinding(input: CommuteBindingInput): ConversationSessionResponseBinding {
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

export const commuteTrainBicycle: ConversationSessionDefinition = {
    scenario: {
      id: "commute-medium-train-and-bicycle",
      topic: "choosing a commute mode",
      world: "coworkers comparing their fictional Aoba Line and bicycle commutes",
      situation: learnerText(
        "同事聊到上班時搭電車或騎腳踏車的差異。你平常走到青葉站搭青葉線；對方晴天時會騎腳踏車。",
        "同僚と、通勤で電車を使う場合と自転車に乗る場合の違いを話しています。あなたは普段、青葉駅まで歩いて青葉線に乗り、相手は晴れた日に自転車で通勤します。",
        "A coworker is comparing train and bicycle commutes. You usually walk to Aoba Station and take the Aoba Line; they cycle to work on clear days."
      ),
      relationship: {
        learnerRole: "coworker who commutes by train",
        partnerRole: "coworker who sometimes commutes by bicycle",
        context: learnerText(
          "平常會閒聊的同事，知道彼此大致的通勤方式。使用親切有禮的說法，分享經驗並互相提問。",
          "普段から話をする同僚で、お互いの通勤手段を大まかに知っています。自然な「です・ます」で経験を話し、質問を返します。",
          "You are coworkers who chat regularly and know each other's general commute. Use natural polite Japanese to share experiences and ask each other questions."
        )
      },
      length: "medium",
      primarySkills: ["share", "bounce"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "familiar",
        topicDepth: "concrete",
        interactionPressure: "low"
      },
      objective: learnerText(
        "分享搭電車通勤的經驗，詢問對方騎車的感受，再回應彼此對下班時段和雨天通勤的實際經驗。",
        "電車通勤の経験を話し、自転車通勤について質問したあと、帰りの混み具合や雨の日の通勤について互いの経験を話しましょう。",
        "Share your train-commute experience, ask about cycling, and exchange practical experiences about the evening ride and commuting in the rain."
      ),
      instruction: learnerText(
        "每次分享一點自己的經驗，再把話題交回同事；不要假設對方喜歡某一種通勤方式。",
        "自分の経験を少し話してから、同僚にも質問を返しましょう。相手が特定の通勤方法を好むと決めつけないでください。",
        "Share a little of your own experience and return the conversation to your coworker. Do not assume they prefer one commute mode."
      ),
      startStepId: "commute-medium-mode-question",
      steps: [
        {
          id: "commute-medium-mode-question",
          kind: "partner_line",
          japanese: "通勤なら、電車と自転車のどちらが好きですか？私は晴れた日は自転車で通っています。",
          nextStepId: "commute-medium-mode-response"
        },
        {
          id: "commute-medium-mode-response",
          kind: "learner_response",
          prompt: learnerText(
            "回答自己搭電車的經驗，並詢問同事騎車通勤的感受。",
            "電車で通勤する経験を話してから、同僚に自転車通勤について尋ねましょう。",
            "Share your train-commute experience, then ask your coworker about cycling to work."
          ),
          responseExamples: [
            {
              id: "commute-medium-train-reading",
              kind: "suggested",
              japanese: "私は電車が多いです。乗っている間に本が読めるので。自転車通勤のどんなところが気に入っていますか？",
              explanation: learnerText(
                "分享自己常搭電車的理由，再把話題交給對方分享騎車的感受。",
                "電車をよく使う理由を伝え、自転車通勤のよさを相手に尋ねています。",
                "You explain why you often take the train, then ask what your coworker likes about cycling."
              )
            },
            {
              id: "commute-medium-walk-to-train",
              kind: "accepted",
              japanese: "私は駅まで歩いて青葉線に乗ります。朝に少し歩くと気分が切り替わります。自転車だと職場までどれくらいですか？",
              explanation: learnerText(
                "說明自己步行到車站再搭電車的習慣，並詢問對方騎車到職場的時間。",
                "駅まで歩いて電車に乗る習慣を伝え、自転車で職場まで行く時間を尋ねています。",
                "You describe walking to the station before taking the train and ask how long the bicycle commute takes."
              )
            }
          ],
          branches: [{ id: "commute-medium-bike-experience", nextStepId: "commute-medium-bike-reply" }]
        },
        {
          id: "commute-medium-bike-reply",
          kind: "partner_line",
          japanese: "自転車だと職場まで十五分ほどです。道が混みすぎないのも気に入っています。天気が悪い日は桜町駅から電車に乗るので、両方使えるのが便利です。帰りの電車は混みますか？",
          nextStepId: "commute-medium-return-response"
        },
        {
          id: "commute-medium-return-response",
          kind: "learner_response",
          prompt: learnerText(
            "回答下班時的通勤經驗，再詢問同事雨天如何前往車站。",
            "帰りの通勤経験に答えてから、雨の日に駅までどう行くか同僚に尋ねましょう。",
            "Answer about your evening commute, then ask how your coworker gets to the station on rainy days."
          ),
          responseExamples: [
            {
              id: "commute-medium-evening-crowd",
              kind: "suggested",
              japanese: "私が乗る夕方の電車は席が埋まっていることが多いです。一本待つと少し空くこともあります。雨の日は桜町駅までどの道を通るんですか？",
              explanation: learnerText(
                "分享下班電車的經驗，再詢問對方雨天前往桜町站時走哪條路。",
                "帰りの電車について自分の経験を伝え、雨の日に桜町駅まで通る道を尋ねています。",
                "You share your experience of the evening train and ask which way they take to Sakuramachi Station in the rain."
              )
            },
            {
              id: "commute-medium-evening-wait",
              kind: "accepted",
              japanese: "帰りは少し混みますが、時間に余裕がある日は一本待つこともあります。雨の日は駅まで歩いて行くんですか？",
              explanation: learnerText(
                "回答下班時電車較擠的情況，再確認對方雨天是否步行到車站。",
                "帰りの電車が混むことを伝え、雨の日も駅まで歩くのか尋ねています。",
                "You explain that the evening train can be crowded, then ask whether they still walk to the station on rainy days."
              )
            }
          ],
          branches: [{ id: "commute-medium-rain-route", nextStepId: "commute-medium-rain-reply" }]
        },
        {
          id: "commute-medium-rain-reply",
          kind: "partner_line",
          japanese: "雨の日も桜町駅までは歩いています。商店街の屋根がある区間を通れるので、思ったより濡れにくいですよ。",
          nextStepId: "commute-medium-complete"
        },
        {
          id: "commute-medium-complete",
          kind: "completion",
          summary: learnerText(
            "你交換了搭電車和騎車的實際經驗，也聊到下班時段與雨天的通勤方式。",
            "電車と自転車の実際の経験を交換し、帰りの混み具合や雨の日の通勤についても話せました。",
            "You exchanged practical train and bicycle experiences and also discussed evening crowds and rainy-day routes."
          )
        }
      ]
    },
    responses: [
      commuteBinding({
        stepId: "commute-medium-mode-response",
        responseExampleId: "commute-medium-train-reading",
        branchId: "commute-medium-bike-experience",
        responseJapanese: "私は電車が多いです。乗っている間に本が読めるので。自転車通勤のどんなところが気に入っていますか？",
        situation: "The coworker bikes in clear weather and invites the learner to compare commute preferences.",
        relationship: "Coworkers who regularly chat and can comfortably exchange commute experiences.",
        discourse: "The learner answers with a reason for taking the train and asks an open question about the partner's bicycle commute.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The reason is personal and concrete, and the open question makes a natural handoff.",
          continuation: "The partner can explain what they enjoy about cycling.",
          register_context_fit: "The friendly polite question suits coworkers who already chat."
        }
      }),
      commuteBinding({
        stepId: "commute-medium-mode-response",
        responseExampleId: "commute-medium-walk-to-train",
        branchId: "commute-medium-bike-experience",
        responseJapanese: "私は駅まで歩いて青葉線に乗ります。朝に少し歩くと気分が切り替わります。自転車だと職場までどれくらいですか？",
        situation: "The coworker bikes in clear weather and invites the learner to compare commute preferences.",
        relationship: "Coworkers who regularly chat and can comfortably exchange commute experiences.",
        discourse: "The learner describes walking to the train and asks about the partner's bicycle commute duration.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The learner answers from their own routine instead of judging the other commute mode.",
          continuation: "A duration question gives the partner a clear, easy next turn.",
          register_context_fit: "The exchange stays friendly and matter-of-fact."
        }
      }),
      commuteBinding({
        stepId: "commute-medium-return-response",
        responseExampleId: "commute-medium-evening-crowd",
        branchId: "commute-medium-rain-route",
        responseJapanese: "私が乗る夕方の電車は席が埋まっていることが多いです。一本待つと少し空くこともあります。雨の日は桜町駅までどの道を通るんですか？",
        situation: "The coworker uses the train on rainy days and asks about the learner's evening train.",
        relationship: "Coworkers who regularly chat and can comfortably exchange commute experiences.",
        discourse: "The learner answers about evening crowds, then asks about the partner's rainy-day walk.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The learner answers the question before moving to a related rainy-day detail.",
          continuation: "The route question follows directly from the coworker's switch from bicycle to train.",
          register_context_fit: "A conversational question fits the established coworker relationship."
        }
      }),
      commuteBinding({
        stepId: "commute-medium-return-response",
        responseExampleId: "commute-medium-evening-wait",
        branchId: "commute-medium-rain-route",
        responseJapanese: "帰りは少し混みますが、時間に余裕がある日は一本待つこともあります。雨の日は駅まで歩いて行くんですか？",
        situation: "The coworker uses the train on rainy days and asks about the learner's evening train.",
        relationship: "Coworkers who regularly chat and can comfortably exchange commute experiences.",
        discourse: "The learner describes how they handle the evening crowd and asks about the coworker's rainy-day walk.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The learner answers with a practical personal habit before asking a related question.",
          continuation: "The partner can describe whether they still walk to the station in rain.",
          register_context_fit: "The reply remains relaxed without becoming overly familiar."
        }
      })
    ]
  };
