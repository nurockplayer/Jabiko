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

const friendlyCoworkers = "Coworkers who recognize one another from the same commute; friendly polite Japanese fits.";
const newlyMetNeighbor = "The two people have just met at a neighborhood welcome gathering; use considerate, polite Japanese and avoid assuming familiarity.";

export const commuteConversationDefinitions: readonly ConversationSessionDefinition[] = [
  {
    scenario: {
      id: "commute-short-shared-aoba-line",
      topic: "commuting and the station",
      world: "morning ride on the fictional Aoba Line",
      situation: learnerText(
        "早上通勤時，你和一位常遇見的同事搭上同一班車。對方簡單提到今天的天氣。",
        "通勤中、よく見かける同僚と同じ電車になりました。相手は今朝の天気について一言話しています。",
        "On your commute, you are on the same train as a coworker you often see. They make a brief comment about the morning weather."
      ),
      relationship: {
        learnerRole: "coworker who uses the Aoba Line",
        partnerRole: "coworker who uses the Aoba Line",
        context: learnerText(
          "你們平常只在通勤時打招呼，還不太熟。從對方簡單的天氣招呼延伸到車站或路線話題，使用親切有禮的說法。",
          "通勤中に挨拶を交わす程度で、まだ親しくはありません。相手の短い天気の挨拶から駅や路線の話題を始め、親しみのある丁寧な表現を使います。",
          "You have only exchanged greetings while commuting and are not close yet. Move from a brief weather greeting into a station or route topic, using friendly polite Japanese."
        )
      },
      length: "short",
      primarySkills: ["open"],
      difficulty: {
        linguisticComplexity: "basic",
        partnerSupport: "supportive",
        relationshipDistance: "neutral",
        topicDepth: "concrete",
        interactionPressure: "low"
      },
      objective: learnerText(
        "從簡單的天氣招呼自然轉到車站或路線話題，用一個輕鬆的問題開啟對話。",
        "短い天気の挨拶から駅や路線の話題に移り、気軽な質問で会話を始めましょう。",
        "Move from the brief weather greeting to a station or route topic with an easy opening question."
      ),
      instruction: learnerText(
        "回應天氣後，主動問一個關於車站或路線的簡單問題。",
        "天気に返事をしてから、駅や路線について簡単な質問を一つしましょう。",
        "Respond to the weather, then ask one simple question about the station or route."
      ),
      startStepId: "commute-short-shared-route",
      steps: [
        {
          id: "commute-short-shared-route",
          kind: "partner_line",
          japanese: "今朝は気持ちのいい天気ですね。通勤中も少し楽です。",
          nextStepId: "commute-short-station-opening"
        },
        {
          id: "commute-short-station-opening",
          kind: "learner_response",
          prompt: learnerText(
            "回應天氣招呼，再用簡單問題把話題帶到車站或路線。",
            "天気の挨拶に返事をしてから、簡単な質問で駅や路線の話題を始めましょう。",
            "Respond to the weather greeting, then use a simple question to open a station or route topic."
          ),
          responseExamples: [
            {
              id: "commute-short-aoba-station-walk",
              kind: "suggested",
              japanese: "そうですね。どちらの駅から乗っていらっしゃるんですか？",
              explanation: learnerText(
                "從天氣招呼自然轉到車站話題，直接詢問對方從哪一站上車。",
                "天気の挨拶から駅の話題に移り、相手がどの駅から乗るのか尋ねています。",
                "You move from the weather greeting to the station topic and ask which station the partner boards at."
              )
            },
            {
              id: "commute-short-same-line-morning",
              kind: "accepted",
              japanese: "本当ですね。こちらの路線はよく利用されるんですか？",
              explanation: learnerText(
                "回應天氣後詢問對方是否常搭這條路線，讓話題自然轉到通勤。",
                "天気に返事をしてから、この路線をよく利用するか尋ね、通勤の話題につなげています。",
                "You respond to the weather and ask whether the partner often uses this route, opening a commute topic."
              )
            }
          ],
          branches: [{ id: "commute-short-route-chat", nextStepId: "commute-short-station-reply" }]
        },
        {
          id: "commute-short-station-reply",
          kind: "partner_line",
          japanese: "普段は桜町駅からこの路線に乗っています。この時間は車内も落ち着いていて、通勤しやすいですね。",
          nextStepId: "commute-short-complete"
        },
        {
          id: "commute-short-complete",
          kind: "completion",
          summary: learnerText(
            "你從天氣招呼自然開啟車站和路線話題，了解對方常用的車站。",
            "天気の挨拶から駅や路線の話題を始め、相手がよく使う駅を聞けました。",
            "You moved from a weather greeting into a station and route topic and learned which station the coworker often uses."
          )
        }
      ]
    },
    responses: [
      commuteBinding({
        stepId: "commute-short-station-opening",
        responseExampleId: "commute-short-aoba-station-walk",
        branchId: "commute-short-route-chat",
        responseJapanese: "そうですね。どちらの駅から乗っていらっしゃるんですか？",
        situation: "A coworker makes a brief weather greeting while the two share a train commute.",
        relationship: friendlyCoworkers,
        discourse: "The learner uses a simple station question to open a commute topic after the weather greeting.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "ask", canonicalSkillId: "open" }],
        authorRationale: {
          natural: "A direct question moves naturally from a greeting into a light commute topic.",
          continuation: "The partner can name the station they usually board at.",
          register_context_fit: "The polite question is friendly without assuming close familiarity."
        }
      }),
      commuteBinding({
        stepId: "commute-short-station-opening",
        responseExampleId: "commute-short-same-line-morning",
        branchId: "commute-short-route-chat",
        responseJapanese: "本当ですね。こちらの路線はよく利用されるんですか？",
        situation: "A coworker makes a brief weather greeting while the two share a train commute.",
        relationship: friendlyCoworkers,
        discourse: "The learner follows the weather greeting with a low-pressure question about the coworker's usual route.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "ask", canonicalSkillId: "open" }],
        authorRationale: {
          natural: "The question opens a topic without claiming knowledge of the coworker's route.",
          continuation: "The partner can say whether they regularly use this line.",
          register_context_fit: "The wording remains casual in topic but polite in form."
        }
      })
    ]
  },
  {
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
  },
  {
    scenario: {
      id: "commute-long-new-neighbor-route-choice",
      topic: "commuting and neighborhood choices",
      world: "a neighborhood welcome gathering in the fictional Aoba district",
      situation: learnerText(
        "你在新住民交流會認識一位剛搬來青葉地區的人。這是架空的地區：青葉線依序經過桜町站、青葉站、中央站；桜町站前有商店街。對方還在考慮平常使用哪一站。",
        "地域の交流会で、青葉地区に引っ越してきたばかりの人と知り合いました。ここは架空の地区で、青葉線は桜町駅、青葉駅、中央駅の順に停車し、桜町駅前には商店街があります。相手は普段どちらの駅を使うか考えています。",
        "At a neighborhood welcome gathering, you meet someone who has just moved to the fictional Aoba district. The Aoba Line stops at Sakuramachi, Aoba, then Central Station; a shopping street is beside Sakuramachi Station. They are deciding which station to use regularly."
      ),
      relationship: {
        learnerRole: "local resident",
        partnerRole: "new resident deciding how to commute",
        context: learnerText(
          "你們剛在社區交流會認識，尚未熟識。以體貼、有禮的方式分享地方資訊；不替對方決定，也不假設對方的生活習慣。",
          "地域の交流会で知り合ったばかりで、まだ親しくありません。相手の生活習慣を決めつけず、丁寧に地域の情報を伝えます。",
          "You have just met at a neighborhood gathering and are not familiar yet. Share local information politely without deciding for the other person or assuming their habits."
        )
      },
      length: "long",
      primarySkills: ["share", "bounce", "expand", "opinion"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "neutral",
        topicDepth: "personal",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "先確認對方的通勤和採買需求，再用帶有條件與對比的說法說明兩站的差異，清楚回答路線疑問，並把選擇留給對方。",
        "通勤や買い物の希望を確認してから、条件や対比を使って二つの駅の違いを説明し、路線についての質問にも答えます。最後は相手が選べる形にしましょう。",
        "First clarify the person's commute and shopping needs, compare the stations with qualified contrasts, answer their route question clearly, and leave the choice to them."
      ),
      instruction: learnerText(
        "使用架空地區中已知的路線資訊。先問清楚對方重視什麼，再比較兩站；使用「如果重視通勤……，另一方面……」等有條件的說法，避免武斷地推薦單一選擇。",
        "架空の地区について示された路線情報を使います。相手が重視することを聞いてから二つの駅を比べ、「通勤を重視するなら……一方で……」のように条件を添えて説明し、一方的に決めないようにしましょう。",
        "Use the route details supplied for this fictional district. Ask what matters to the person before comparing the stations. Qualify your advice with contrasts such as 'if the commute matters most... on the other hand...' instead of making a categorical recommendation."
      ),
      startStepId: "commute-long-new-resident-question",
      steps: [
        {
          id: "commute-long-new-resident-question",
          kind: "partner_line",
          japanese: "今月こちらに越してきたばかりで、青葉駅と桜町駅のどちらを普段使いにするか迷っているんです。",
          nextStepId: "commute-long-needs-response"
        },
        {
          id: "commute-long-needs-response",
          kind: "learner_response",
          prompt: learnerText(
            "先詢問新住民的通勤與採買需求，再依回答比較兩站。",
            "新しく越してきた人の通勤や買い物の希望を聞いてから、二つの駅を比べましょう。",
            "Ask about the new resident's commuting and shopping needs before comparing the two stations."
          ),
          responseExamples: [
            {
              id: "commute-long-ask-work-direction",
              kind: "suggested",
              japanese: "駅選びは迷いますよね。通勤先は中央駅の方ですか？",
              explanation: learnerText(
                "先確認對方的通勤方向，再依工作地點比較車站。",
                "通勤先がどの方向か確認してから、駅を比べようとしています。",
                "You clarify the person's commute destination before comparing the stations."
              )
            },
            {
              id: "commute-long-ask-priority",
              kind: "accepted",
              japanese: "通勤と買い物では、どちらを優先したいですか？",
              explanation: learnerText(
                "直接詢問對方在通勤與採買之間較重視哪一項。",
                "通勤と買い物のどちらを優先したいか尋ねています。",
                "You ask which matters more to them: the commute or shopping."
              )
            }
          ],
          branches: [{ id: "commute-long-needs-heard", nextStepId: "commute-long-needs-reply" }]
        },
        {
          id: "commute-long-needs-reply",
          kind: "partner_line",
          japanese: "通勤先は中央駅の近くです。平日の通勤を優先したいですが、帰りに食材を買えると助かります。",
          nextStepId: "commute-long-station-comparison-response"
        },
        {
          id: "commute-long-station-comparison-response",
          kind: "learner_response",
          prompt: learnerText(
            "根據對方的需求比較兩站，並確認轉乘或採買等考量。",
            "相手の希望に合わせて二つの駅を比べ、乗り換えや買い物などで気になることを確認しましょう。",
            "Compare the two stations in light of their needs, then clarify any concern about transfers or shopping."
          ),
          responseExamples: [
            {
              id: "commute-long-compare-distance-shopping",
              kind: "suggested",
              japanese: "通勤を優先したいんですね。青葉駅は中央駅の一駅手前なので、通勤には便利そうです。一方、桜町駅前には商店街があります。食材の買い物は週に何度くらいですか？",
              explanation: learnerText(
                "根據對方優先通勤的需求，評估青葉站對通勤較方便，再比較桜町站的採買條件並詢問頻率。",
                "通勤を優先したいという希望に合わせて青葉駅は便利そうだと評価し、桜町駅前の商店街にも触れて買い物の頻度を尋ねています。",
                "Given the partner's commute priority, you judge Aoba Station as convenient for commuting, mention Sakuramachi's shopping street, and ask how often they shop for groceries."
              )
            },
            {
              id: "commute-long-compare-qualified-choice",
              kind: "accepted",
              japanese: "通勤が第一なんですね。青葉駅は中央駅に近く、桜町駅前は買い物に便利です。食材は週に何度くらい買いますか？",
              explanation: learnerText(
                "先確認對方優先通勤，再比較兩站，並詢問對方通常採買的頻率。",
                "通勤を優先したいという希望を受け止めて二つの駅を比べ、買い物の頻度を尋ねています。",
                "You acknowledge the commute priority, compare the stations, and ask how often they shop."
              )
            }
          ],
          branches: [{ id: "commute-long-route-clarification", nextStepId: "commute-long-transfer-question" }]
        },
        {
          id: "commute-long-transfer-question",
          kind: "partner_line",
          japanese: "食材は週に何度か買います。通勤を優先しつつ、買い物もしやすいと助かります。青葉線なら、どちらの駅からも中央駅まで乗り換えずに行けますか？",
          nextStepId: "commute-long-route-answer-response"
        },
        {
          id: "commute-long-route-answer-response",
          kind: "learner_response",
          prompt: learnerText(
            "清楚回答對方關於路線的問題，再以不武斷的方式總結兩站的差異。",
            "路線についての質問に答え、二つの駅の違いを一方的に勧めない形でまとめましょう。",
            "Answer the route question clearly, then summarize the station differences without making a one-sided recommendation."
          ),
          responseExamples: [
            {
              id: "commute-long-answer-direct-line",
              kind: "suggested",
              japanese: "はい、青葉線ならどちらの駅からも中央駅まで乗り換えずに行けます。青葉駅は中央駅の一駅手前で、桜町駅前には商店街があります。",
              explanation: learnerText(
                "先回答兩站都可直達中央站，再簡潔重述通勤距離和商店街的差異。",
                "どちらの駅からも中央駅まで乗り換えなしで行けると答え、通勤距離と商店街の違いを整理しています。",
                "You confirm that both stations reach Central without a transfer, then recap the commute and shopping differences."
              )
            },
            {
              id: "commute-long-answer-with-choice",
              kind: "accepted",
              japanese: "そうです。青葉線でそのまま中央駅方面へ行けます。通勤の近さなら青葉駅、駅前で買い物するなら桜町駅が使いやすそうですね。",
              explanation: learnerText(
                "直接確認可搭同一條線前往中央站，再把選擇連回對方的通勤與採買需求。",
                "同じ路線で中央駅方面へ行けると答え、通勤と買い物の希望に合わせて選び方を整理しています。",
                "You confirm the direct route and relate each station to the person's commute and shopping needs."
              )
            }
          ],
          branches: [{ id: "commute-long-plan-accepted", nextStepId: "commute-long-choice-reply" }]
        },
        {
          id: "commute-long-choice-reply",
          kind: "partner_line",
          japanese: "ありがとうございます。まずは青葉駅から通勤して、買い物が必要な日は桜町駅も試してみます。違いが分かって安心しました。",
          nextStepId: "commute-long-complete"
        },
        {
          id: "commute-long-complete",
          kind: "completion",
          summary: learnerText(
            "你先了解新住民的需求，再比較路線和採買條件並回答轉乘問題，讓對方自行決定從哪一站開始。",
            "新しく越してきた人の希望を聞き、路線と買い物の条件を比べて乗り換えの質問にも答え、相手が自分で選べる形にできました。",
            "You clarified the new resident's needs, compared commute and shopping tradeoffs, answered the transfer question, and left the choice to them."
          )
        }
      ]
    },
    responses: [
      commuteBinding({
        stepId: "commute-long-needs-response",
        responseExampleId: "commute-long-ask-work-direction",
        branchId: "commute-long-needs-heard",
        responseJapanese: "駅選びは迷いますよね。通勤先は中央駅の方ですか？",
        situation: "A person who has just moved to the fictional Aoba district is deciding between Aoba and Sakuramachi stations.",
        relationship: newlyMetNeighbor,
        discourse: "The learner asks where the partner commutes before comparing station options.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "ask", canonicalSkillId: "bounce" }],
        authorRationale: {
          natural: "The learner acknowledges the choice and asks one focused question about the commute destination.",
          continuation: "The answer helps establish which station tradeoffs matter.",
          register_context_fit: "The polite question respects a person they have just met."
        }
      }),
      commuteBinding({
        stepId: "commute-long-needs-response",
        responseExampleId: "commute-long-ask-priority",
        branchId: "commute-long-needs-heard",
        responseJapanese: "通勤と買い物では、どちらを優先したいですか？",
        situation: "A person who has just moved to the fictional Aoba district is deciding between Aoba and Sakuramachi stations.",
        relationship: newlyMetNeighbor,
        discourse: "The learner asks which of the two needs takes priority before offering a comparison.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "ask", canonicalSkillId: "bounce" }],
        authorRationale: {
          natural: "A direct priority question clarifies the dilemma without choosing for the new resident.",
          continuation: "The partner can describe the commute and shopping needs that shape the choice.",
          register_context_fit: "The learner remains helpful while keeping an appropriate distance."
        }
      }),
      commuteBinding({
        stepId: "commute-long-station-comparison-response",
        responseExampleId: "commute-long-compare-distance-shopping",
        branchId: "commute-long-route-clarification",
        responseJapanese: "通勤を優先したいんですね。青葉駅は中央駅の一駅手前なので、通勤には便利そうです。一方、桜町駅前には商店街があります。食材の買い物は週に何度くらいですか？",
        situation: "The new resident commutes near Central Station, prioritizes the commute, and also wants to buy groceries on the way home.",
        relationship: newlyMetNeighbor,
        discourse: "The learner evaluates Aoba as convenient for the stated commute priority, contrasts it with shopping near Sakuramachi, and asks about grocery frequency.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "opinion" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The comparison ties a conditional opinion to the partner's stated commute priority.",
          continuation: "The question about grocery frequency keeps the comparison connected to the partner's routine.",
          register_context_fit: "The learner offers useful local context without being overly familiar."
        }
      }),
      commuteBinding({
        stepId: "commute-long-station-comparison-response",
        responseExampleId: "commute-long-compare-qualified-choice",
        branchId: "commute-long-route-clarification",
        responseJapanese: "通勤が第一なんですね。青葉駅は中央駅に近く、桜町駅前は買い物に便利です。食材は週に何度くらい買いますか？",
        situation: "The new resident commutes near Central Station, prioritizes the commute, and also wants to buy groceries on the way home.",
        relationship: newlyMetNeighbor,
        discourse: "The learner recognizes the commute priority, compares station strengths, and asks about shopping frequency.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "opinion" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The comparison is framed around the priority the partner just stated.",
          continuation: "The question about shopping frequency gives the partner room to explain the other consideration.",
          register_context_fit: "The question supports the partner's decision without pressuring them."
        }
      }),
      commuteBinding({
        stepId: "commute-long-route-answer-response",
        responseExampleId: "commute-long-answer-direct-line",
        branchId: "commute-long-plan-accepted",
        responseJapanese: "はい、青葉線ならどちらの駅からも中央駅まで乗り換えずに行けます。青葉駅は中央駅の一駅手前で、桜町駅前には商店街があります。",
        situation: "The new resident asks whether either station can reach Central Station without a transfer.",
        relationship: newlyMetNeighbor,
        discourse: "The learner answers the route question first, then summarizes the difference between the two stations.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The direct answer precedes the concise route and neighborhood comparison.",
          continuation: "The summary gives the new resident useful information for choosing later.",
          register_context_fit: "The clear, polite explanation suits a first conversation."
        }
      }),
      commuteBinding({
        stepId: "commute-long-route-answer-response",
        responseExampleId: "commute-long-answer-with-choice",
        branchId: "commute-long-plan-accepted",
        responseJapanese: "そうです。青葉線でそのまま中央駅方面へ行けます。通勤の近さなら青葉駅、駅前で買い物するなら桜町駅が使いやすそうですね。",
        situation: "The new resident asks whether either station can reach Central Station without a transfer.",
        relationship: newlyMetNeighbor,
        discourse: "The learner confirms the direct line and ties each station's convenience to the partner's stated needs.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The answer is explicit and the final comparison stays conditional on the partner's priorities.",
          continuation: "The partner can choose a station or try both depending on the day.",
          register_context_fit: "The learner remains informative without telling a new acquaintance what to do."
        }
      })
    ]
  }
];
