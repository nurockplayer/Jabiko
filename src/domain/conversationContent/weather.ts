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

interface WeatherBindingInput {
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

function weatherBinding(input: WeatherBindingInput): ConversationSessionResponseBinding {
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

export const weatherConversationDefinitions: readonly ConversationSessionDefinition[] = [
  {
    scenario: {
      id: "weather-short-morning-heat",
      topic: "weather",
      world: "office entrance",
      situation: {
        textZh: "夏天早上，你和同事剛走進公司，對方提起外面的熱氣。",
        textI18n: {
          ja: "夏の朝、同僚と会社に入ったところで、相手が外の暑さについて話しかけてきました。",
          en: "On a summer morning, you enter the office with a coworker who comments on the heat outside."
        }
      },
      relationship: {
        learnerRole: "coworker",
        partnerRole: "coworker",
        context: {
          textZh: "同一個團隊、平常會閒聊的同事。語氣可以輕鬆，仍使用です・ます。",
          textI18n: {
            ja: "同じチームで、普段から雑談をする同僚です。親しみのある「です・ます」で話します。",
            en: "You work on the same team and often chat. Use friendly, polite Japanese."
          }
        }
      },
      length: "short",
      primarySkills: ["react", "expand"],
      difficulty: {
        linguisticComplexity: "basic",
        partnerSupport: "supportive",
        relationshipDistance: "familiar",
        topicDepth: "concrete",
        interactionPressure: "low"
      },
      objective: {
        textZh: "先回應對方的感受，再補充一點經驗或追問一句，留下能接話的內容。",
        textI18n: {
          ja: "相手の気持ちに反応し、自分の体験やひと言の質問を加えて、会話のきっかけを作りましょう。",
          en: "Acknowledge the partner's experience, then offer a detail or follow-up to give them something to respond to."
        }
      },
      instruction: {
        textZh: "比較三種自然的回應。這次練習讓話題延續；真實聊天時，簡短附和也可以。",
        textI18n: {
          ja: "三つの自然な返事を比べましょう。今回は話を続ける練習ですが、実際の雑談では短い相づちだけでもかまいません。",
          en: "Compare three natural replies. Practice continuing the topic here; a brief acknowledgment can also be appropriate in real conversation."
        }
      },
      startStepId: "weather-short-heat-opening",
      steps: [
        {
          id: "weather-short-heat-opening",
          kind: "partner_line",
          japanese: "今日も暑いですね。駅から歩くだけで汗をかいちゃいました。",
          nextStepId: "weather-short-heat-reply"
        },
        {
          id: "weather-short-heat-reply",
          kind: "learner_response",
          prompt: {
            textZh: "回應同事，試著留下一個可以接話的線索。",
            textI18n: {
              ja: "同僚に返事をして、話を続けるきっかけを作りましょう。",
              en: "Respond to your coworker and try to leave an opening for more conversation."
            }
          },
          responseExamples: [
            {
              id: "weather-short-heat-acknowledge",
              kind: "suggested",
              japanese: "そうですね。暑いですね。",
              explanation: {
                textZh: "這是自然的附和，並沒有說錯。以這次延續話題的目標來看，它還沒有提供新的接話線索。",
                textI18n: {
                  ja: "自然な相づちで、間違いではありません。ただ、今回の「話を続ける」という目標では、新しい話のきっかけはまだありません。",
                  en: "This is a natural acknowledgment, not an error. For this exercise's continuation goal, it adds no new opening yet."
                }
              }
            },
            {
              id: "weather-short-heat-detail",
              kind: "accepted",
              japanese: "本当ですね。会社に来る途中で、アイスコーヒーを買いました。",
              explanation: {
                textZh: "補充自己的小經驗，對方就能接著聊飲料或店家。不一定每次都要反問。",
                textI18n: {
                  ja: "自分の体験を少し加えると、相手は飲み物やお店の話を続けられます。毎回質問する必要はありません。",
                  en: "A small personal detail gives the partner a drink or shop to talk about. You do not need to ask a question every time."
                }
              }
            },
            {
              id: "weather-short-heat-followup",
              kind: "accepted",
              japanese: "本当に暑いですね。私も汗だくです。駅からここまで、どのくらい歩くんですか？",
              explanation: {
                textZh: "先共感並補充自己的狀況，再接著對方提到的步行通勤追問，讓對方容易回答。",
                textI18n: {
                  ja: "共感して自分の様子を伝え、相手が話した通勤について質問しています。相手が答えやすい聞き方です。",
                  en: "You acknowledge the heat, share your experience, and follow up on the walk the partner mentioned with an easy-to-answer question."
                }
              }
            }
          ],
          branches: [
            { id: "weather-short-heat-finish", nextStepId: "weather-short-heat-complete" }
          ]
        },
        {
          id: "weather-short-heat-complete",
          kind: "completion",
          summary: {
            textZh: "練習了附和、補充經驗與追問。依對方的精神和時間，選擇合適的延續方式。",
            textI18n: {
              ja: "相づち、自分の体験、ひと言の質問を練習しました。相手の元気や時間に合わせて、話の続け方を選びましょう。",
              en: "You practiced acknowledging, sharing a detail, and following up. Choose how to continue according to the partner's energy and available time."
            }
          }
        }
      ]
    },
    responses: [
      {
        stepId: "weather-short-heat-reply",
        responseExampleId: "weather-short-heat-acknowledge",
        branchId: "weather-short-heat-finish",
        feedback: {
          id: "weather-short-heat-acknowledge-feedback",
          responseJapanese: "そうですね。暑いですね。",
          context: {
            situation: "Two coworkers enter the office after walking in summer heat.",
            relationship: "Familiar teammates using friendly polite Japanese.",
            discourse: "The partner comments on the heat and sweating on the walk from the station."
          },
          feedback: {
            languageQuality: "natural",
            continuation: "dead_end",
            registerContextFit: "fits",
            composition: [{ feature: "answer", canonicalSkillId: "react" }],
            authorRationale: {
              natural: "Brief agreement is ordinary and appropriate; no language error is implied.",
              continuation: "For the explicit continuation goal this adds no new material; brief acknowledgment remains valid in real interaction."
            }
          }
        }
      },
      {
        stepId: "weather-short-heat-reply",
        responseExampleId: "weather-short-heat-detail",
        branchId: "weather-short-heat-finish",
        feedback: {
          id: "weather-short-heat-detail-feedback",
          responseJapanese: "本当ですね。会社に来る途中で、アイスコーヒーを買いました。",
          context: {
            situation: "Two coworkers enter the office after walking in summer heat.",
            relationship: "Familiar teammates using friendly polite Japanese.",
            discourse: "The partner mentions the heat; the learner offers a relevant personal detail."
          },
          feedback: {
            languageQuality: "natural",
            continuation: "opens_thread",
            registerContextFit: "fits",
            composition: [
              { feature: "answer", canonicalSkillId: "react" },
              { feature: "add", canonicalSkillId: "share" }
            ],
            authorRationale: {
              continuation: "The coffee purchase offers a concrete conversational handle without requiring a question."
            }
          }
        }
      },
      {
        stepId: "weather-short-heat-reply",
        responseExampleId: "weather-short-heat-followup",
        branchId: "weather-short-heat-finish",
        feedback: {
          id: "weather-short-heat-followup-feedback",
          responseJapanese: "本当に暑いですね。私も汗だくです。駅からここまで、どのくらい歩くんですか？",
          context: {
            situation: "Two coworkers enter the office after walking in summer heat.",
            relationship: "Familiar teammates using friendly polite Japanese.",
            discourse: "The partner mentions sweating on the walk; the learner shares that experience and asks about the walk's duration."
          },
          feedback: {
            languageQuality: "natural",
            continuation: "enriches_thread",
            registerContextFit: "fits",
            composition: [
              { feature: "answer", canonicalSkillId: "react" },
              { feature: "add", canonicalSkillId: "share" },
              { feature: "ask", canonicalSkillId: "expand" }
            ],
            authorRationale: {
              continuation: "Shared experience and a specific follow-up support both empathy and further commute talk."
            }
          }
        }
      }
    ]
  },
  {
    scenario: {
      id: "weather-medium-summer-nights",
      topic: "weather",
      world: "walk home after club activities",
      situation: learnerText(
        "夏天放學後，你和常一起回家的同學聊到最近夜裡悶熱、睡不好的情況。",
        "夏の放課後、よく一緒に帰るクラスメートと、夜の蒸し暑さや寝苦しさについて話します。",
        "After school on a summer evening, you talk with a classmate you often walk home with about humid nights and poor sleep."
      ),
      relationship: {
        learnerRole: "classmate",
        partnerRole: "classmate",
        context: learnerText(
          "平常會一起走一段路、能自在閒聊的同學。使用親切的です・ます，不必刻意正式。",
          "よく一緒に帰り、気軽に雑談できるクラスメートです。かしこまりすぎず、親しみのある「です・ます」で話します。",
          "You often walk part of the way home together and can chat comfortably. Use friendly polite Japanese without sounding formal."
        )
      },
      length: "medium",
      primarySkills: ["share", "expand", "bounce"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "familiar",
        topicDepth: "personal",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "沿著夜裡太熱、睡眠受影響的共同話題，分享自己的做法，再接住對方的經驗並把話題交還給對方。",
        "夜の暑さと睡眠という共通の話題を続けます。自分の工夫を伝え、相手の経験を受けて話題を返しましょう。",
        "Sustain one shared thread about hot nights and sleep: share what works for you, respond to the partner's experience, and return the turn."
      ),
      instruction: learnerText(
        "先說一個實際做法或習慣，接著回應對方的困擾。可以追問，也可以分享另一個相關細節；不需要照著範例逐句說。",
        "まず自分の工夫や習慣を一つ伝え、次に相手の悩みに応じましょう。質問しても、関連する情報を加えてもかまいません。例文をそのまま順番に言う必要はありません。",
        "Share one practical habit, then respond to the partner's concern. You can ask a follow-up or add another relevant detail; you do not need to reproduce the examples in order."
      ),
      startStepId: "weather-medium-night-opening",
      steps: [
        {
          id: "weather-medium-night-opening",
          kind: "partner_line",
          japanese: "最近ずっと暑くないですか？夜も寝苦しくて、朝起きても疲れが残ってるんですよ。",
          nextStepId: "weather-medium-night-routine"
        },
        {
          id: "weather-medium-night-routine",
          kind: "learner_response",
          prompt: learnerText(
            "回應對方的感受，分享一個讓自己比較好睡的做法，或接著問對方怎麼調整。",
            "相手の気持ちに反応し、自分が少し眠りやすくなる工夫を伝えるか、相手がどう工夫しているか聞きましょう。",
            "Acknowledge how the partner feels, share one thing that helps you sleep, or ask how they manage the heat."
          ),
          responseExamples: [
            {
              id: "weather-medium-night-cool-room",
              kind: "suggested",
              japanese: "わかります。寝る前に部屋を少し冷やして、タイマーをかけています。",
              explanation: learnerText(
                "先表示理解，再補充具體習慣。對方可以接著聊使用冷氣的時間或自己的方法。",
                "共感してから具体的な習慣を加えています。相手は冷房を使う時間や自分の工夫について続けられます。",
                "You acknowledge the shared experience and add a specific habit, giving the partner room to discuss timing or their own routine."
              )
            },
            {
              id: "weather-medium-night-ask-back",
              kind: "accepted",
              japanese: "そうですよね。私は扇風機を使うことが多いです。寝る時は冷房をつけていますか？",
              explanation: learnerText(
                "先回答並補充自己的做法，再問一個和睡眠習慣直接相關的問題。這只是自然選項之一。",
                "自分の習慣を伝えてから、睡眠に関係する質問をしています。自然な選択肢の一つで、唯一の答えではありません。",
                "You share your routine before asking a directly related question. This is one natural option, not the only possible response."
              )
            }
          ],
          branches: [{ id: "weather-medium-night-continue", nextStepId: "weather-medium-partner-routine" }]
        },
        {
          id: "weather-medium-partner-routine",
          kind: "partner_line",
          japanese: "つけっぱなしだと少し気になるので、タイマーにしています。でも朝方に暑くて目が覚めることもあって。",
          nextStepId: "weather-medium-night-followup"
        },
        {
          id: "weather-medium-night-followup",
          kind: "learner_response",
          prompt: learnerText(
            "接住對方朝方醒來的經驗。你可以分享另一種調整方式，或問一個容易回答的延續問題。",
            "朝方に目が覚めるという相手の経験を受け止めましょう。別の工夫を伝えても、答えやすい質問をしてもかまいません。",
            "Respond to the partner waking up early. You can share another adjustment or ask an easy follow-up question."
          ),
          responseExamples: [
            {
              id: "weather-medium-night-setting",
              kind: "suggested",
              japanese: "それはつらいですね。私は少し高めに設定して、風が直接当たらないようにしています。",
              explanation: learnerText(
                "先關心對方，再分享與冷氣設定相關的經驗，維持在同一個生活話題。",
                "相手を気遣ってから、冷房の設定について自分の経験を加えています。同じ生活の話題を保てます。",
                "You show concern, then add your experience with the air-conditioner setting while staying on the same everyday topic."
              )
            },
            {
              id: "weather-medium-night-fan-question",
              kind: "accepted",
              japanese: "朝方に目が覚めると大変ですよね。私は寝る前に部屋を換気しています。扇風機も使いますか？",
              explanation: learnerText(
                "回應對方後分享自己的睡前做法，再用簡單問題把說話機會交回去。",
                "相手に反応し、自分の寝る前の工夫を伝えてから、簡単な質問で話す番を返しています。",
                "You respond, share a bedtime routine, and return the turn with a simple question."
              )
            }
          ],
          branches: [{ id: "weather-medium-night-finish", nextStepId: "weather-medium-night-complete" }]
        },
        {
          id: "weather-medium-night-complete",
          kind: "completion",
          summary: learnerText(
            "你沿著夜裡太熱的共同話題分享了做法，也回應了對方的睡眠經驗。實際聊天時，分享、追問或簡短附和都可以依情境選擇。",
            "夜の暑さという共通の話題で、自分の工夫を伝え、相手の睡眠の経験にも応じました。実際の会話では、共有、質問、短い相づちを状況に合わせて選べます。",
            "You shared a routine and responded to the partner's experience while staying with one thread. In real conversation, sharing, asking, or briefly agreeing can each fit the moment."
          )
        }
      ]
    },
    responses: [
      weatherBinding({
        stepId: "weather-medium-night-routine",
        responseExampleId: "weather-medium-night-cool-room",
        branchId: "weather-medium-night-continue",
        responseJapanese: "わかります。寝る前に部屋を少し冷やして、タイマーをかけています。",
        situation: "Two classmates walk home on a humid summer evening after one says the heat has been disturbing their sleep.",
        relationship: "Classmates who often walk home together, using friendly polite Japanese.",
        discourse: "The learner acknowledges the shared difficulty and offers a specific bedtime routine.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: { continuation: "The concrete timer routine gives the partner an easy point to pick up." }
      }),
      weatherBinding({
        stepId: "weather-medium-night-routine",
        responseExampleId: "weather-medium-night-ask-back",
        branchId: "weather-medium-night-continue",
        responseJapanese: "そうですよね。私は扇風機を使うことが多いです。寝る時は冷房をつけていますか？",
        situation: "Two classmates talk about difficulty sleeping during a hot spell.",
        relationship: "Classmates who often walk home together, using friendly polite Japanese.",
        discourse: "The learner adds a personal routine and asks about the partner's directly related habit.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: { continuation: "The focused question gives the partner a clear turn without demanding personal details." }
      }),
      weatherBinding({
        stepId: "weather-medium-night-followup",
        responseExampleId: "weather-medium-night-setting",
        branchId: "weather-medium-night-finish",
        responseJapanese: "それはつらいですね。私は少し高めに設定して、風が直接当たらないようにしています。",
        situation: "The partner says they sometimes wake early because the room becomes hot after the air-conditioner timer stops.",
        relationship: "Classmates who often walk home together, using friendly polite Japanese.",
        discourse: "The learner shows concern and shares a related adjustment.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: { continuation: "The response stays with the partner's concern and offers a comparable routine." }
      }),
      weatherBinding({
        stepId: "weather-medium-night-followup",
        responseExampleId: "weather-medium-night-fan-question",
        branchId: "weather-medium-night-finish",
        responseJapanese: "朝方に目が覚めると大変ですよね。私は寝る前に部屋を換気しています。扇風機も使いますか？",
        situation: "The partner says they sometimes wake early because the room becomes hot after the air-conditioner timer stops.",
        relationship: "Classmates who often walk home together, using friendly polite Japanese.",
        discourse: "The learner acknowledges the difficulty, offers a related routine, and returns the turn with a simple question.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: { continuation: "The question connects to the partner's sleep routine and leaves room for a short answer." }
      })
    ]
  },
  {
    scenario: {
      id: "weather-long-summer-routines",
      topic: "weather",
      world: "leaving an evening community class",
      situation: learnerText(
        "夏日傍晚的社區課程結束後，你和一位已經聊過幾次的同學一起走回家，從避暑習慣聊到適合居住的氣候。",
        "夏の夕方、何度か話したことのある地域講座の参加者と帰り道を歩きながら、暑さへの対処から住みやすい気候の好みへ話題を広げます。",
        "On the walk home after an evening community class, you move from summer routines with a familiar participant to preferences about comfortable places to live."
      ),
      relationship: {
        learnerRole: "community class participant",
        partnerRole: "community class participant",
        context: learnerText(
          "在社區課程碰過幾次面、正逐漸熟悉的同齡學員。用親切的「です・ます」語氣交談。",
          "地域の講座で何度か一緒になり、少しずつ親しくなった同年代の参加者です。親しみのある「です・ます」で話します。",
          "You are peers who have met several times at a community class and are getting to know each other. Use friendly polite Japanese."
        )
      },
      length: "long",
      primarySkills: ["narrate", "opinion", "transition", "bounce"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "neutral",
        topicDepth: "personal",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "先用一段生活經驗談夏天的作息，再談舒適與電費等取捨，最後自然轉到氣候與居住偏好，並留一個問題讓對方接話。",
        "夏の生活習慣を短く語り、過ごしやすさと電気代などのバランスについて話した後、気候や住む場所の好みに自然につなげます。最後に相手へ話題を返しましょう。",
        "Tell a brief summer routine, discuss trade-offs such as comfort and electricity use, then transition to climate and living preferences while leaving the partner room to continue."
      ),
      instruction: learnerText(
        "依序完成幾個來回：分享一段經驗、說明自己的取捨，再回應對方不同的偏好。可以改變話題方向，但要讓前後有關聯；不必使用艱深的天氣詞彙。",
        "経験を一つ話し、自分なりのバランスを伝え、相手の異なる好みにも応じましょう。話題を移しても、前後のつながりを示します。難しい天気の語彙は必要ありません。",
        "Complete several exchanges: share an experience, explain your trade-off, and respond to a different preference. You may shift topics when you make the connection clear; advanced weather vocabulary is not needed."
      ),
      startStepId: "weather-long-summer-opening",
      steps: [
        {
          id: "weather-long-summer-opening",
          kind: "partner_line",
          japanese: "夏って、帰ってからも部屋が暑いですよね。最近は外を歩く時間を少しずらしています。",
          nextStepId: "weather-long-summer-routine"
        },
        {
          id: "weather-long-summer-routine",
          kind: "learner_response",
          prompt: learnerText(
            "先接住對方的經驗，再分享一段自己夏天回家或通勤時的實際做法。",
            "相手の経験を受け止めてから、夏の帰宅や通勤で自分がしていることを短く話しましょう。",
            "Acknowledge the partner's experience, then briefly narrate what you do on a summer commute or after getting home."
          ),
          responseExamples: [
            {
              id: "weather-long-routine-evening",
              kind: "suggested",
              japanese: "そうなんですよね。私は日が落ちてから帰ることが多いんですが、それでも駅から歩くと汗をかきます。帰ったらまず水を飲んで少し休みます。",
              explanation: learnerText(
                "簡短敘述通勤時的情況，再說到回家後的習慣，讓下一個問題有生活經驗可以接。",
                "通勤中の様子を簡単に語り、帰宅後の習慣も加えています。次のやりとりにつながる具体的な経験があります。",
                "You briefly describe the commute and add an after-work habit, giving the next exchange a concrete personal experience to build on."
              )
            },
            {
              id: "weather-long-routine-walk",
              kind: "accepted",
              japanese: "わかります。先週は昼間に出かけて、帰りは日陰を選んで歩きました。思ったより疲れて、その日は早く寝ました。",
              explanation: learnerText(
                "以一件小經驗說明自己如何應付炎熱，也交代了結果。這是可用的敘述方式之一。",
                "小さな経験を通して暑さへの対処とその結果を伝えています。自然な語り方の一つです。",
                "A small story explains how you handled the heat and what happened afterward. It is one natural way to tell it."
              )
            }
          ],
          branches: [{ id: "weather-long-after-routine", nextStepId: "weather-long-cooling-cost" }]
        },
        {
          id: "weather-long-cooling-cost",
          kind: "partner_line",
          japanese: "日が落ちてからでも暑いですよね。冷房を使う時間も増えますし、電気代もちょっと気になります。",
          nextStepId: "weather-long-cooling-choice"
        },
        {
          id: "weather-long-cooling-choice",
          kind: "learner_response",
          prompt: learnerText(
            "談談舒適和用電之間你怎麼取捨。回應時不要假設對方的預算或家庭狀況。",
            "過ごしやすさと電気の使用について、自分がどうバランスを取っているか話しましょう。相手の予算や家庭事情を決めつけないようにします。",
            "Explain how you balance comfort and electricity use. Avoid assuming anything about the partner's budget or household."
          ),
          responseExamples: [
            {
              id: "weather-long-cooling-sleep",
              kind: "suggested",
              japanese: "そうですね。電気代は気になりますが、寝不足になると翌日つらいので、寝る時は無理に我慢しないようにしています。",
              explanation: learnerText(
                "表達兩種考量後說明自己的取捨，沒有把這種選擇說成每個人都應該照做。",
                "二つの考えを示してから自分の選択を説明しています。この選択を誰にでも勧めているわけではありません。",
                "You name both concerns and explain your own choice without presenting it as a rule for everyone."
              )
            },
            {
              id: "weather-long-cooling-adjust",
              kind: "accepted",
              japanese: "わかります。私は帰宅したら冷房をつけて、部屋が落ち着いたら設定を少し調整しています。暑さ対策って人によって違いますね。",
              explanation: learnerText(
                "分享一個自己做的調整，再承認每個人的方法不同，讓對話能順勢轉到偏好。",
                "自分の調整方法を伝え、人によって違うことも認めています。好みの話題へ自然につなげられます。",
                "You share one adjustment and recognize that routines differ, creating a natural bridge to preferences."
              )
            }
          ],
          branches: [{ id: "weather-long-after-choice", nextStepId: "weather-long-climate" }]
        },
        {
          id: "weather-long-climate",
          kind: "partner_line",
          japanese: "ほんと、人によって違いますね。私は冬より夏の暑さの方が苦手です。住む場所を選べるなら、少し涼しい地域もいいなと思います。",
          nextStepId: "weather-long-place-preference"
        },
        {
          id: "weather-long-place-preference",
          kind: "learner_response",
          prompt: learnerText(
            "回應對方不同的偏好，說明自己喜歡的氣候或生活環境，再把話題自然交還給對方。",
            "相手と違う好みに応じ、自分が好きな気候や暮らしやすい環境を説明してから、自然に相手へ話題を返しましょう。",
            "Respond to the partner's different preference, explain what climate or living environment you like, then naturally return the topic."
          ),
          responseExamples: [
            {
              id: "weather-long-preference-commute",
              kind: "suggested",
              japanese: "そうなんですね。私は冬の寒さが苦手なので、今くらい暖かい方が過ごしやすいです。でも通勤を考えると、朝晩が涼しい場所にも惹かれます。住む場所を選ぶなら、気候以外に何を大切にしますか？",
              explanation: learnerText(
                "先接受對方的想法，再說明自己的理由和另一個考量，最後問對方更重視什麼，完成自然的話題轉換。",
                "相手の考えを受け止め、自分の理由と別の観点を加えています。最後に相手が大切にすることを聞き、自然に話題を広げています。",
                "You acknowledge the partner, explain your reasons and another consideration, then ask what matters to them to complete a natural topic shift."
              )
            },
            {
              id: "weather-long-preference-seasons",
              kind: "accepted",
              japanese: "私は季節の変化がある方が好きなので、夏が少し暑くても今の地域が合っています。とはいえ、通勤しやすさも大事ですよね。どんな環境が理想ですか？",
              explanation: learnerText(
                "從不同的偏好談到季節和通勤環境，既能表達自己的看法，也留出空間讓對方說明理想生活。",
                "違う好みから季節や通勤環境の話へ移っています。自分の意見を伝えつつ、相手が理想の暮らしを話せる余地もあります。",
                "You move from differing preferences to seasons and commuting, sharing your view while leaving room for the partner to describe an ideal setting."
              )
            }
          ],
          branches: [{ id: "weather-long-finish", nextStepId: "weather-long-complete" }]
        },
        {
          id: "weather-long-complete",
          kind: "completion",
          summary: learnerText(
            "你分享了夏天的生活經驗，說明舒適與用電之間的個人取捨，也把共同的天氣話題轉到居住偏好。不同選擇都可能自然；重點是說出理由並讓對話繼續。",
            "夏の経験を語り、過ごしやすさと電気の使い方について自分なりの考えを伝え、天気の話から住みやすさの好みへつなげました。選択は人それぞれです。理由を伝え、会話を続けることが大切です。",
            "You shared a summer experience, explained your own comfort trade-off, and moved from weather to living preferences. Different choices can all sound natural; the goal is to give a reason and keep the exchange going."
          )
        }
      ]
    },
    responses: [
      weatherBinding({
        stepId: "weather-long-summer-routine",
        responseExampleId: "weather-long-routine-evening",
        branchId: "weather-long-after-routine",
        responseJapanese: "そうなんですよね。私は日が落ちてから帰ることが多いんですが、それでも駅から歩くと汗をかきます。帰ったらまず水を飲んで少し休みます。",
        situation: "Two familiar participants leave an evening class after the partner mentions shifting their walk to avoid the strongest daytime heat.",
        relationship: "Peers who have met several times at a community class, using friendly polite Japanese.",
        discourse: "The learner narrates a commute and a small after-work routine connected to the partner's experience.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "narrate" }
        ],
        authorRationale: { continuation: "The brief routine gives the partner material to ask about without requiring an elaborate story." }
      }),
      weatherBinding({
        stepId: "weather-long-summer-routine",
        responseExampleId: "weather-long-routine-walk",
        branchId: "weather-long-after-routine",
        responseJapanese: "わかります。先週は昼間に出かけて、帰りは日陰を選んで歩きました。思ったより疲れて、その日は早く寝ました。",
        situation: "Two familiar participants leave an evening class after the partner mentions shifting their walk to avoid the strongest daytime heat.",
        relationship: "Peers who have met several times at a community class, using friendly polite Japanese.",
        discourse: "The learner recounts one recent outing and its effect on their evening.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "narrate" }
        ],
        authorRationale: { continuation: "The short sequence of outing, route choice, and result forms a complete but open-ended anecdote." }
      }),
      weatherBinding({
        stepId: "weather-long-cooling-choice",
        responseExampleId: "weather-long-cooling-sleep",
        branchId: "weather-long-after-choice",
        responseJapanese: "そうですね。電気代は気になりますが、寝不足になると翌日つらいので、寝る時は無理に我慢しないようにしています。",
        situation: "The partner brings up increased air-conditioner use and the electricity bill during summer.",
        relationship: "Peers who have met several times at a community class, using friendly polite Japanese.",
        discourse: "The learner acknowledges the trade-off and explains a personal priority without assuming the partner's circumstances.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "opinion" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: { continuation: "A personal reason makes the trade-off discussable without implying a universal recommendation." }
      }),
      weatherBinding({
        stepId: "weather-long-cooling-choice",
        responseExampleId: "weather-long-cooling-adjust",
        branchId: "weather-long-after-choice",
        responseJapanese: "わかります。私は帰宅したら冷房をつけて、部屋が落ち着いたら設定を少し調整しています。暑さ対策って人によって違いますね。",
        situation: "The partner brings up increased air-conditioner use and the electricity bill during summer.",
        relationship: "Peers who have met several times at a community class, using friendly polite Japanese.",
        discourse: "The learner shares a routine, then generalizes gently to different personal approaches.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: { continuation: "The observation about different routines provides a bridge from practical habits to preferences." }
      }),
      weatherBinding({
        stepId: "weather-long-place-preference",
        responseExampleId: "weather-long-preference-commute",
        branchId: "weather-long-finish",
        responseJapanese: "そうなんですね。私は冬の寒さが苦手なので、今くらい暖かい方が過ごしやすいです。でも通勤を考えると、朝晩が涼しい場所にも惹かれます。住む場所を選ぶなら、気候以外に何を大切にしますか？",
        situation: "The partner prefers a cooler region because summer heat bothers them more than winter cold.",
        relationship: "Peers who have met several times at a community class, using friendly polite Japanese.",
        discourse: "The learner accepts the different preference, explains two personal considerations, and asks about the partner's priorities.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "opinion" },
          { feature: "add", canonicalSkillId: "transition" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: { continuation: "The shift from weather to commute and living priorities is signposted and invites the partner's own view." }
      }),
      weatherBinding({
        stepId: "weather-long-place-preference",
        responseExampleId: "weather-long-preference-seasons",
        branchId: "weather-long-finish",
        responseJapanese: "私は季節の変化がある方が好きなので、夏が少し暑くても今の地域が合っています。とはいえ、通勤しやすさも大事ですよね。どんな環境が理想ですか？",
        situation: "The partner prefers a cooler region because summer heat bothers them more than winter cold.",
        relationship: "Peers who have met several times at a community class, using friendly polite Japanese.",
        discourse: "The learner expresses a distinct preference, recognizes another consideration, and invites the partner to elaborate.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "opinion" },
          { feature: "add", canonicalSkillId: "transition" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: { continuation: "The learner can disagree about climate preferences while maintaining rapport and returning the turn." }
      })
    ]
  }
];
