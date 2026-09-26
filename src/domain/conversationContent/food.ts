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

export const foodConversationDefinitions: readonly ConversationSessionDefinition[] = [
  {
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
  },
  {
    scenario: {
      id: "food-medium-lunch-recommendation",
      topic: "recommending a lunch restaurant",
      world: "chatting after a language class",
      situation: learnerText(
        "日語課下課後，熟識的同學說朋友最近要來附近找他，想請你推薦適合一起吃午餐的店。",
        "日本語の講座のあと、よく話すクラスメートから、近くに来る友人との昼食におすすめの店を聞かれました。",
        "After a Japanese class, a classmate you know well asks for a lunch recommendation for a friend who will be visiting nearby."
      ),
      relationship: {
        learnerRole: "classmate who knows local lunch spots",
        partnerRole: "classmate planning lunch with a visiting friend",
        context: learnerText(
          "熟識的課堂同學，平常會交換附近餐廳資訊；使用親切自然且有禮的說法。",
          "よく話すクラスメートで、近所の店について情報交換をします。親しみのある自然な「です・ます」で話します。",
          "You are classmates who often exchange tips about nearby places. Use friendly, natural polite Japanese."
        )
      },
      length: "medium",
      primarySkills: ["share", "bounce"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "familiar",
        topicDepth: "concrete",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "分享自己熟悉的午餐選擇，先了解對方的用餐需求，再根據條件推薦一間店並詢問對方的想法。",
        "知っている昼食の店を紹介し、相手の希望を聞いてから条件に合う店を提案し、感想を尋ねましょう。",
        "Share a lunch spot you know, learn what matters to the partner, then make a fitting recommendation and ask what they think."
      ),
      instruction: learnerText(
        "先用一個問題了解對方想找什麼樣的店。聽到回答後，再提出符合條件的午餐選擇，讓對方有機會回應。",
        "まず、どんな店を探しているか一つ質問しましょう。返事を聞いてから条件に合う昼食の店を提案し、相手が意見を返せるようにします。",
        "Ask one question about what kind of place they want. After hearing the answer, suggest a lunch spot that fits and invite their response."
      ),
      startStepId: "food-medium-lunch-opening",
      steps: [
        {
          id: "food-medium-lunch-opening",
          kind: "partner_line",
          japanese: "今度、友人が近くに来るんですが、駅のあたりで昼ごはんを食べるならどこがいいでしょう？",
          nextStepId: "food-medium-lunch-preference-response"
        },
        {
          id: "food-medium-lunch-preference-response",
          kind: "learner_response",
          prompt: learnerText(
            "分享一間你熟悉的店，並確認對方想找可以坐下來慢慢聊天的地方嗎？",
            "知っている店を一つ挙げてから、座ってゆっくり話せる場所がよいか尋ねましょう。",
            "Mention a place you know, then ask whether they want somewhere they can sit and talk at an easy pace."
          ),
          responseExamples: [
            {
              id: "food-medium-lunch-fish-set",
              kind: "suggested",
              japanese: "駅前の魚定食の店は、席が広くて落ち着けます。食事をしながらゆっくり話せるところがよさそうですか？",
              explanation: learnerText(
                "先分享具體的店，再詢問對方是否重視能坐著聊天，沒有假定朋友的喜好。",
                "具体的な店を紹介してから、座って話せる場所がよいか聞いています。友人の好みは決めつけていません。",
                "You share a specific option and ask whether a place for sitting and talking matters, without assuming the friend's preference."
              )
            },
            {
              id: "food-medium-lunch-japanese-diner",
              kind: "accepted",
              japanese: "商店街の和食食堂は入りやすいですよ。食事をしながらゆっくり話せる場所を探していますか？",
              explanation: learnerText(
                "分享一間方便進入的午餐店，再確認對方是否希望邊吃邊聊，讓建議能配合實際需求。",
                "入りやすい昼食の店を一つ紹介し、食事をしながら話したいかを確認しています。相手の希望に合わせて提案できます。",
                "You suggest an accessible lunch place and check whether they want time to talk over the meal, so the recommendation can fit."
              )
            }
          ],
          branches: [{ id: "food-medium-lunch-preference-heard", nextStepId: "food-medium-lunch-preference" }]
        },
        {
          id: "food-medium-lunch-preference",
          kind: "partner_line",
          japanese: "はい、久しぶりに会うので、座ってゆっくり話せるところがいいです。友人は魚料理が好きで、予算は一人千五百円くらいです。",
          nextStepId: "food-medium-lunch-recommendation-response"
        },
        {
          id: "food-medium-lunch-recommendation-response",
          kind: "learner_response",
          prompt: learnerText(
            "接住對方想慢慢聊天、喜歡魚料理且預算約一千五百日圓的條件，提出合適的推薦，再問對方覺得如何。",
            "ゆっくり話したいこと、魚料理が好きなこと、予算が一人千五百円ほどという希望を受け、合う店を提案して感想を聞きましょう。",
            "Use the partner's preferences for a relaxed meal, fish, and a budget around 1,500 yen to recommend a fitting place and ask what they think."
          ),
          responseExamples: [
            {
              id: "food-medium-lunch-recommend-fish-set",
              kind: "suggested",
              japanese: "それなら、駅前の魚定食の店が合いそうです。焼き魚定食は千二百円くらいで、テーブル席もあります。ここならゆっくり話せそうですか？",
              explanation: learnerText(
                "把魚料理、價格和座位條件都連到具體推薦，最後詢問同學的看法。",
                "魚料理、値段、席の条件を具体的な店につなげ、最後に相手の感想を尋ねています。",
                "You connect the fish, price, and seating preferences to a concrete recommendation, then ask for the classmate's view."
              )
            },
            {
              id: "food-medium-lunch-recommend-japanese",
              kind: "accepted",
              japanese: "商店街の和食食堂なら、魚の日替わり定食が千三百円くらいで、席の間も広いですよ。友人にも合いそうでしょうか？",
              explanation: learnerText(
                "依照同學轉述的魚料理、預算和座位需求提出合適的餐廳，並邀請對方判斷是否符合朋友的需要。",
                "魚料理、予算、席の希望に合う店を提案し、友人に合いそうか相手に尋ねています。",
                "You suggest a restaurant matching the fish, budget, and seating needs, and invite the partner to judge whether it fits."
              )
            }
          ],
          branches: [{ id: "food-medium-lunch-recommendation-heard", nextStepId: "food-medium-lunch-response" }]
        },
        {
          id: "food-medium-lunch-response",
          kind: "partner_line",
          japanese: "そのお店なら、友人の好みや予算にも合いそうですね。落ち着いて話せそうですし、そこにしてみます。",
          nextStepId: "food-medium-lunch-complete"
        },
        {
          id: "food-medium-lunch-complete",
          kind: "completion",
          summary: learnerText(
            "你先了解用餐需求，再根據魚料理、預算和聊天空間提出推薦，並聽到同學選擇合適的店。",
            "食事の希望を聞いてから、魚料理、予算、話しやすさに合う店を提案し、相手が選ぶところまで会話を進めました。",
            "You learned what mattered, recommended a place matching the fish, budget, and seating needs, and helped your classmate choose."
          )
        }
      ]
    },
    responses: [
      foodBinding({
        stepId: "food-medium-lunch-preference-response",
        responseExampleId: "food-medium-lunch-fish-set",
        branchId: "food-medium-lunch-preference-heard",
        responseJapanese: "駅前の魚定食の店は、席が広くて落ち着けます。食事をしながらゆっくり話せるところがよさそうですか？",
        situation: "A classmate asks for a lunch recommendation for a visiting friend; the friend has not yet shared specific preferences.",
        relationship: "Classmates who know each other well and exchange neighborhood tips; friendly polite Japanese fits.",
        discourse: "The learner shares a familiar local option, then asks whether a relaxed place to talk is important.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The suggestion and follow-up question form a natural recommendation exchange.",
          continuation: "The partner can answer about the desired atmosphere before the learner recommends more precisely.",
          register_context_fit: "The conversational question suits familiar classmates."
        }
      }),
      foodBinding({
        stepId: "food-medium-lunch-preference-response",
        responseExampleId: "food-medium-lunch-japanese-diner",
        branchId: "food-medium-lunch-preference-heard",
        responseJapanese: "商店街の和食食堂は入りやすいですよ。食事をしながらゆっくり話せる場所を探していますか？",
        situation: "A classmate asks for a lunch recommendation for a visiting friend; the friend has not yet shared specific preferences.",
        relationship: "Classmates who know each other well and exchange neighborhood tips; friendly polite Japanese fits.",
        discourse: "The learner shares an approachable lunch option and checks whether the partner wants time to talk.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "A specific local suggestion followed by one needs question is clear and natural.",
          continuation: "The partner's answer will make the next recommendation more useful.",
          register_context_fit: "The friendly tone and polite question fit classmates who know each other."
        }
      }),
      foodBinding({
        stepId: "food-medium-lunch-recommendation-response",
        responseExampleId: "food-medium-lunch-recommend-fish-set",
        branchId: "food-medium-lunch-recommendation-heard",
        responseJapanese: "それなら、駅前の魚定食の店が合いそうです。焼き魚定食は千二百円くらいで、テーブル席もあります。ここならゆっくり話せそうですか？",
        situation: "The classmate wants a relaxed lunch with fish dishes and a budget around 1,500 yen per person.",
        relationship: "Classmates who know each other well and exchange neighborhood tips; friendly polite Japanese fits.",
        discourse: "The learner matches the stated food, budget, and seating preferences with a familiar restaurant and asks for the partner's view.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The concrete price and seating details make the recommendation useful rather than generic.",
          continuation: "The final question gives the classmate room to accept or refine the suggestion.",
          register_context_fit: "The learner offers advice as a suggestion rather than deciding for the classmate."
        }
      }),
      foodBinding({
        stepId: "food-medium-lunch-recommendation-response",
        responseExampleId: "food-medium-lunch-recommend-japanese",
        branchId: "food-medium-lunch-recommendation-heard",
        responseJapanese: "商店街の和食食堂なら、魚の日替わり定食が千三百円くらいで、席の間も広いですよ。友人にも合いそうでしょうか？",
        situation: "The classmate wants a relaxed lunch with fish dishes and a budget around 1,500 yen per person.",
        relationship: "Classmates who know each other well and exchange neighborhood tips; friendly polite Japanese fits.",
        discourse: "The learner connects the partner's preferences to a suitable restaurant and asks whether it sounds right for the friend.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The recommendation is concrete and stays within the preferences the partner shared.",
          continuation: "The closing question invites the partner to decide whether the option fits.",
          register_context_fit: "The learner leaves the final choice to the friend and classmate."
        }
      })
    ]
  },
  {
    scenario: {
      id: "food-long-lunch-time-negotiation",
      topic: "choosing a practical lunch",
      world: "invited to lunch by a senior coworker",
      situation: learnerText(
        "午休時，熟識的前輩邀你去一家熱門拉麵店。你下午一點有會議，午休只有三十分鐘；你想委婉說明時間限制，協商今天先選較方便的餐點，並把拉麵邀約留到改天。",
        "昼休みに、親しくしている先輩から人気のラーメン店に誘われました。午後一時から会議があり、昼休みは三十分ほどです。時間の制約を丁寧に伝え、今日は手早く食べられる方法を相談し、ラーメンは別の日にする場面です。",
        "At lunch, a senior coworker you know well invites you to a popular ramen shop. You have a 1 p.m. meeting and only thirty minutes for lunch. Explain the time limit tactfully, agree on a quicker option today, and save ramen for another day."
      ),
      relationship: {
        learnerRole: "junior coworker",
        partnerRole: "senior coworker",
        context: learnerText(
        "同一團隊中平常相處親切的前輩。即使無法接受今天的安排，也要先感謝邀請，並以尊重、有禮的方式說明。",
          "同じチームの親しい先輩です。今日の提案に難色を示すときも、まず誘いに感謝し、敬意のある「です・ます」で話します。",
          "Your senior coworker is friendly and on your team. Even when you cannot accept today's plan, thank them for inviting you and keep respectful polite Japanese."
        )
      },
      length: "long",
      primarySkills: ["negotiate", "share", "register_adapt"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "neutral",
        topicDepth: "personal",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "先感謝前輩的邀請，再清楚說明三十分鐘午休和會議時間的限制，委婉協商今天的替代方案，並以尊重的方式接受安排。",
        "先輩の誘いに感謝してから、三十分の昼休みと会議の時間を伝え、今日の代案を丁寧に相談し、敬意を保って決めましょう。",
        "Thank your senior for the invitation, explain the thirty-minute break and meeting constraint, negotiate a practical option for today, and settle the plan respectfully."
      ),
      instruction: learnerText(
        "不要一開始就直接拒絕邀請。先說明今天的時間限制，提出附近的員工餐廳作為替代，也表示改天想一起吃拉麵，最後禮貌回應前輩的安排。",
        "誘いをすぐに断るのではなく、今日の時間の制約を説明し、近くの社食を提案しましょう。ラーメンは余裕のある日に行きたいと伝えてから、先輩の返事に丁寧に応じます。",
        "Do not dismiss the invitation outright. Explain today's time limit, suggest the nearby cafeteria as an alternative, leave ramen for a less rushed day, and respond politely to your senior."
      ),
      startStepId: "food-long-lunch-opening",
      steps: [
        {
          id: "food-long-lunch-opening",
          kind: "partner_line",
          japanese: "今日の昼、駅前のラーメン屋に行こうと思うんですが、よかったら一緒にどうですか？",
          nextStepId: "food-long-time-constraint-response"
        },
        {
          id: "food-long-time-constraint-response",
          kind: "learner_response",
          prompt: learnerText(
            "先感謝邀請，再委婉說明下午會議和三十分鐘的午休限制；可以詢問熱門店的等候時間。",
            "まず誘いに感謝し、午後の会議と三十分の昼休みを丁寧に伝えましょう。店の待ち時間を尋ねてもかまいません。",
            "Thank them for inviting you, then explain the afternoon meeting and thirty-minute lunch break tactfully. You may ask about the wait."
          ),
          responseExamples: [
            {
              id: "food-long-lunch-time-question",
              kind: "suggested",
              japanese: "お誘いありがとうございます。今日は午後一時から打ち合わせで、昼休みが三十分ほどしかないんです。昼どきは待ち時間が長いでしょうか？",
              explanation: learnerText(
                "先感謝邀請，再交代真實的時間限制並詢問等候時間，讓前輩能一起判斷是否來得及。",
                "誘いに感謝し、実際の時間制約を伝えて待ち時間を確認しています。先輩と一緒に間に合うか判断できます。",
                "You thank them, explain the real time limit, and check the wait so you can decide together whether the trip will fit."
              )
            },
            {
              id: "food-long-lunch-time-concern",
              kind: "accepted",
              japanese: "お誘いありがとうございます。ぜひご一緒したいです。ただ、今日は昼休みが三十分ほどで、一時から会議があるので、食べ終わって戻れるか少し心配です。",
              explanation: learnerText(
                "表達想一起用餐，也說明擔心無法準時回到會議，委婉指出問題而非直接拒絕。",
                "一緒に行きたい気持ちを示しつつ、会議に間に合うか心配だと伝えています。誘いを一方的に断ってはいません。",
                "You show interest in going while explaining concern about getting back for the meeting, rather than rejecting the invitation outright."
              )
            }
          ],
          branches: [{ id: "food-long-time-constraint-heard", nextStepId: "food-long-time-reply" }]
        },
        {
          id: "food-long-time-reply",
          kind: "partner_line",
          japanese: "人気店なので、昼どきは少し並ぶことが多いです。今日は食べ終わるまでに三十分では慌ただしいかもしれません。",
          nextStepId: "food-long-lunch-negotiation-response"
        },
        {
          id: "food-long-lunch-negotiation-response",
          kind: "learner_response",
          prompt: learnerText(
            "接住店家可能需要等候的資訊，提出今天能快速用餐的社內餐廳，並表示拉麵可以改天再約。",
            "待つ可能性を受け、今日は早く食べられる社食を提案しましょう。ラーメンは別の日にしたいと伝えます。",
            "Use the likely wait to suggest the nearby cafeteria for today, and leave the ramen outing for another day."
          ),
          responseExamples: [
            {
              id: "food-long-lunch-negotiate-cafeteria",
              kind: "suggested",
              japanese: "そうなんですね。午後の会議に間に合うよう、近くの社食で早めに食べるのはどうでしょう。ラーメンは余裕のある日にぜひご一緒したいです。",
              explanation: learnerText(
                "把會議時間作為理由，提出今天先去社內餐廳的方案，也保留改天一起吃拉麵的意願。",
                "会議の時間を理由に今日は社食を提案し、ラーメンは別の日に一緒に行きたいと伝えています。",
                "You use the meeting time to suggest the cafeteria today while making clear that you still want to go for ramen another day."
              )
            },
            {
              id: "food-long-lunch-negotiate-quick",
              kind: "accepted",
              japanese: "教えてくださってありがとうございます。今日は午後の準備もあるので、待たずに食べられる社食にしませんか。ラーメンは別の日にぜひお願いします。",
              explanation: learnerText(
                "先感謝前輩提供資訊，再提出不用等候的社內餐廳，並用正面方式延後拉麵邀約。",
                "情報に感謝してから、待たずに済む社食を提案し、ラーメンは別の日にしたいと前向きに伝えています。",
                "You thank them for the information, suggest the cafeteria to avoid waiting, and positively defer ramen to another day."
              )
            }
          ],
          branches: [{ id: "food-long-lunch-plan-agreed", nextStepId: "food-long-lunch-plan" }]
        },
        {
          id: "food-long-lunch-plan",
          kind: "partner_line",
          japanese: "そうしましょう。今日は社食で早めに済ませて、ラーメンはまた今度ゆっくり行きましょう。",
          nextStepId: "food-long-lunch-confirmation-response"
        },
        {
          id: "food-long-lunch-confirmation-response",
          kind: "learner_response",
          prompt: learnerText(
            "回應前輩同意今天改去社內餐廳、改天再吃拉麵的安排，並禮貌地確認計畫。",
            "今日は社食、ラーメンは別の日という先輩の提案に応じ、丁寧に予定を確認しましょう。",
            "Respond to your senior's plan for the cafeteria today and ramen another day, then confirm it politely."
          ),
          responseExamples: [
            {
              id: "food-long-lunch-confirm-thanks",
              kind: "suggested",
              japanese: "ありがとうございます。今日は社食で早めに食べて、打ち合わせに備えます。ラーメンは次回楽しみにしています。",
              explanation: learnerText(
                "感謝前輩配合時間安排，確認今天的計畫，也正面回應改天吃拉麵的邀約。",
                "時間に合わせてもらったことに感謝し、今日の予定と次回のラーメンを確認しています。",
                "You thank your senior for accommodating the schedule, confirm today's plan, and respond positively to ramen another time."
              )
            },
            {
              id: "food-long-lunch-confirm-agree",
              kind: "accepted",
              japanese: "助かります。社食なら余裕をもって戻れそうですね。ぜひご一緒させてください。ラーメンはまた今度お願いします。",
              explanation: learnerText(
                "表示社內餐廳能解決趕時間的問題，接受前輩的安排並再次確認改天的邀約。",
                "社食なら時間に余裕をもって戻れそうだと伝え、今日の予定と次回の誘いを丁寧に受けています。",
                "You note that the cafeteria should leave enough time, accept today's plan politely, and confirm the future invitation."
              )
            }
          ],
          branches: [{ id: "food-long-lunch-confirmed", nextStepId: "food-long-lunch-complete" }]
        },
        {
          id: "food-long-lunch-complete",
          kind: "completion",
          summary: learnerText(
            "你尊重前輩的邀請，清楚說明時間限制，協商出今天可行的午餐方案，也保留了改天一起吃拉麵的約定。",
            "先輩の誘いを尊重しながら時間の制約を伝え、今日の現実的な昼食を相談し、ラーメンは別の日にする約束も残しました。",
            "You respected the invitation, explained the time constraint, agreed on a practical lunch for today, and kept the ramen plan for another day."
          )
        }
      ]
    },
    responses: [
      foodBinding({
        stepId: "food-long-time-constraint-response",
        responseExampleId: "food-long-lunch-time-question",
        branchId: "food-long-time-constraint-heard",
        responseJapanese: "お誘いありがとうございます。今日は午後一時から打ち合わせで、昼休みが三十分ほどしかないんです。昼どきは待ち時間が長いでしょうか？",
        situation: "A senior coworker invites the learner to a popular ramen shop; the learner has a 1 p.m. meeting and a thirty-minute lunch break.",
        relationship: "Friendly senior and junior coworkers; the learner thanks the senior and keeps respectful polite Japanese.",
        discourse: "The learner appreciates the invitation, shares the actual time limit, and asks about the wait.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The thanks, brief explanation, and question form a coherent reply to the invitation.",
          continuation: "The senior can answer about the likely wait before they choose a plan together.",
          register_context_fit: "お誘いありがとうございます maintains respect while still sounding conversational."
        }
      }),
      foodBinding({
        stepId: "food-long-time-constraint-response",
        responseExampleId: "food-long-lunch-time-concern",
        branchId: "food-long-time-constraint-heard",
        responseJapanese: "お誘いありがとうございます。ぜひご一緒したいです。ただ、今日は昼休みが三十分ほどで、一時から会議があるので、食べ終わって戻れるか少し心配です。",
        situation: "A senior coworker invites the learner to a popular ramen shop; the learner has a 1 p.m. meeting and a thirty-minute lunch break.",
        relationship: "Friendly senior and junior coworkers; the learner thanks the senior and keeps respectful polite Japanese.",
        discourse: "The learner expresses interest in joining but raises a practical concern about returning for the meeting.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: {
          natural: "ぜひご一緒したいです softens the concern and communicates genuine interest.",
          continuation: "The partner can respond to the time concern and help find a workable plan.",
          register_context_fit: "The learner is candid without sounding blunt toward a senior coworker."
        }
      }),
      foodBinding({
        stepId: "food-long-lunch-negotiation-response",
        responseExampleId: "food-long-lunch-negotiate-cafeteria",
        branchId: "food-long-lunch-plan-agreed",
        responseJapanese: "そうなんですね。午後の会議に間に合うよう、近くの社食で早めに食べるのはどうでしょう。ラーメンは余裕のある日にぜひご一緒したいです。",
        situation: "The senior says the ramen shop often has a lunch queue, making a thirty-minute break tight.",
        relationship: "Friendly senior and junior coworkers; the learner proposes an alternative with respectful polite Japanese.",
        discourse: "The learner suggests the nearby cafeteria today while affirming interest in ramen another day.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "negotiate" },
          { feature: "ask", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The alternative is linked directly to the time concern, and the future invitation remains warm.",
          continuation: "The senior can accept or adjust the practical plan for today.",
          register_context_fit: "どうでしょう softens the counterproposal for a more senior coworker."
        }
      }),
      foodBinding({
        stepId: "food-long-lunch-negotiation-response",
        responseExampleId: "food-long-lunch-negotiate-quick",
        branchId: "food-long-lunch-plan-agreed",
        responseJapanese: "教えてくださってありがとうございます。今日は午後の準備もあるので、待たずに食べられる社食にしませんか。ラーメンは別の日にぜひお願いします。",
        situation: "The senior says the ramen shop often has a lunch queue, making a thirty-minute break tight.",
        relationship: "Friendly senior and junior coworkers; the learner proposes an alternative with respectful polite Japanese.",
        discourse: "The learner thanks the senior for the information and proposes the cafeteria today, leaving ramen for another day.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "negotiate" },
          { feature: "ask", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The thanks acknowledges the senior's information before the counterproposal.",
          continuation: "The senior has a clear proposal to accept or modify.",
          register_context_fit: "くださってありがとうございます and にしませんか balance respect with a collaborative tone."
        }
      }),
      foodBinding({
        stepId: "food-long-lunch-confirmation-response",
        responseExampleId: "food-long-lunch-confirm-thanks",
        branchId: "food-long-lunch-confirmed",
        responseJapanese: "ありがとうございます。今日は社食で早めに食べて、打ち合わせに備えます。ラーメンは次回楽しみにしています。",
        situation: "The senior agrees to eat at the cafeteria today and save the ramen shop for another day.",
        relationship: "Friendly senior and junior coworkers; a warm, respectful confirmation fits.",
        discourse: "The learner thanks the senior, confirms today's plan, and looks forward to ramen another time.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: {
          natural: "The thanks and brief recap make the agreed plan clear.",
          continuation: "Looking forward to ramen next time leaves the future lunch invitation open.",
          register_context_fit: "The learner remains warm and respectful toward the senior coworker."
        }
      }),
      foodBinding({
        stepId: "food-long-lunch-confirmation-response",
        responseExampleId: "food-long-lunch-confirm-agree",
        branchId: "food-long-lunch-confirmed",
        responseJapanese: "助かります。社食なら余裕をもって戻れそうですね。ぜひご一緒させてください。ラーメンはまた今度お願いします。",
        situation: "The senior agrees to eat at the cafeteria today and save the ramen shop for another day.",
        relationship: "Friendly senior and junior coworkers; a warm, respectful confirmation fits.",
        discourse: "The learner accepts the cafeteria plan, confirms the timing works, and looks forward to ramen another day.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: {
          natural: "助かります acknowledges the accommodation and the rest confirms the shared plan.",
          continuation: "Accepting another ramen outing keeps the future lunch invitation open.",
          register_context_fit: "ご一緒させてください and お願いします show suitable respect without excessive distance."
        }
      })
    ]
  }
];
