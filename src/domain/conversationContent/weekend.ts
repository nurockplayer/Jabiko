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

export const weekendConversationDefinitions: readonly ConversationSessionDefinition[] = [
  {
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
  },
  {
    scenario: {
      id: "weekend-medium-days-off-routine",
      topic: "days off",
      world: "conversation after a community class",
      situation: learnerText(
        "社區課程結束後，你和一位常見面的同學聊到休假時通常怎麼過。對方最近有些累，可能不會一直主動帶話題。",
        "地域の講座が終わったあと、よく顔を合わせる参加者と休みの日の過ごし方について話しています。相手は最近少し疲れていて、会話を積極的に広げないかもしれません。",
        "After a community class, you talk with a familiar participant about how you spend days off. They have been a little tired lately and may not do much to carry the conversation."
      ),
      relationship: {
        learnerRole: "community class participant",
        partnerRole: "community class participant",
        context: learnerText(
          "在課程中常碰面的同學，彼此熟悉但不是親密朋友。用親切的です・ます語氣。",
          "講座でよく会う参加者同士です。親しくなりつつありますが、まだ親友ではありません。親しみのある「です・ます」で話します。",
          "You are regular participants who know each other but are not close friends. Use friendly polite Japanese."
        )
      },
      length: "medium",
      primarySkills: ["share", "bounce", "react"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "low_support",
        relationshipDistance: "neutral",
        topicDepth: "personal",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "沿著休假生活這一條話題，先分享自己的日常，再回應對方較低能量的回答。可以溫和追問一個問題，也可以分享相近的想法並用體貼的話收尾，依對方當下的反應選擇。",
        "休みの日の過ごし方という一つの話題を続けます。自分の習慣を伝え、相手の控えめな返事に応じましょう。やさしく質問しても、似た考えを話して気遣いの言葉で締めてもかまいません。",
        "Sustain one thread about days off by sharing your routine and responding to the partner's low-energy reply. You can ask a gentle question or share a related thought and close with care, depending on the moment."
      ),
      instruction: learnerText(
        "第一輪分享一個自己的休假習慣，可以把問題自然地交還給對方。對方說最近累、常在家休息後，先表示理解，再用輕柔的方式延續同一話題。",
        "最初の返事では、自分の休みの日の習慣を一つ伝え、自然なら相手にも聞き返しましょう。相手が最近疲れていて家で休むことが多いと言ったら、まず理解を示し、同じ話題を無理なく続けます。",
        "First share one days-off routine and, if it feels natural, ask the partner in return. When they say they have been tired and mostly rest at home, acknowledge that and gently continue the same thread."
      ),
      startStepId: "weekend-medium-routine-opening",
      steps: [
        {
          id: "weekend-medium-routine-opening",
          kind: "partner_line",
          japanese: "休みの日って、何をして過ごすことが多いですか？",
          nextStepId: "weekend-medium-routine-response"
        },
        {
          id: "weekend-medium-routine-response",
          kind: "learner_response",
          prompt: learnerText(
            "回答自己的休假習慣，補充一點具體內容；若合適，也可以問問對方。",
            "自分の休みの日の過ごし方を答え、具体的なことを少し加えましょう。自然なら相手にも聞いてみてください。",
            "Answer with one of your days-off routines and add a concrete detail; you can also ask the partner in return if it feels natural."
          ),
          responseExamples: [
            {
              id: "weekend-medium-routine-walk",
              kind: "suggested",
              japanese: "最近は近所の公園を歩くことが多いです。外に出ると気分転換になります。休みの日は出かける方ですか？",
              explanation: learnerText(
                "先回答自己的習慣，再補充散步的感受，最後問對方偏好的休假方式，能把話題自然交回去。",
                "自分の習慣に気分転換という理由を加え、最後に相手の過ごし方を聞いています。話題を自然に相手へ返せます。",
                "You answer, add why the walk helps, then ask about the partner's routine to return the conversation naturally."
              )
            },
            {
              id: "weekend-medium-routine-cooking",
              kind: "accepted",
              japanese: "このごろは家で料理しています。時間を気にせず作れるのが楽しいです。何か家で楽しんでいることはありますか？",
              explanation: learnerText(
                "分享最近在做的事和喜歡它的理由，再用開放式問題邀請對方分享自己的休假生活。",
                "最近していることと、その楽しさを伝えています。開かれた質問で相手の休みの日の話も聞けます。",
                "You share a recent activity and why you enjoy it, then invite the partner to talk about their own time off."
              )
            }
          ],
          branches: [{ id: "weekend-medium-routine-to-rest", nextStepId: "weekend-medium-rest-partner" }]
        },
        {
          id: "weekend-medium-rest-partner",
          kind: "partner_line",
          japanese: "いいですね。私は最近ちょっと疲れていて、休みの日も家でゆっくりすることが多いです。",
          nextStepId: "weekend-medium-rest-response"
        },
        {
          id: "weekend-medium-rest-response",
          kind: "learner_response",
          prompt: learnerText(
            "對對方最近較累的情況表示理解，再分享一個相近的想法或問一個不勉強的問題。",
            "最近少し疲れているという相手の話に理解を示し、似た考えを話すか、答えやすい質問を一つ添えましょう。",
            "Acknowledge that the partner has been tired, then share a related thought or ask one easy, considerate question."
          ),
          responseExamples: [
            {
              id: "weekend-medium-rest-empathy",
              kind: "suggested",
              japanese: "お疲れさまです。休みの日にゆっくりできると、少し気持ちが楽になりますよね。家で休むときは、何をすることが多いですか？",
              explanation: learnerText(
                "先關心對方，再認同休息的作用，最後以對方容易回答的問題延續原本的休假話題。",
                "まず相手を気遣い、休むことへの共感を示してから、答えやすい質問で同じ話題を続けています。",
                "You show concern, empathize with the need to rest, then continue the same topic with an easy question."
              )
            },
            {
              id: "weekend-medium-rest-share",
              kind: "accepted",
              japanese: "そうなんですね。私も予定を入れずに過ごす日が好きです。無理せず休めるといいですね。",
              explanation: learnerText(
                "先承接對方的疲累，再分享自己也喜歡保留空白的休假，最後用體貼的話收尾；不追問也很自然。",
                "相手の疲れを受け止め、自分も予定を入れない日が好きだと伝えています。質問を重ねず、気遣いの言葉で返すのも自然です。",
                "You acknowledge their tiredness and share that you also enjoy an unscheduled day. Ending with care instead of another question is natural here."
              )
            }
          ],
          branches: [{ id: "weekend-medium-rest-finish", nextStepId: "weekend-medium-complete" }]
        },
        {
          id: "weekend-medium-complete",
          kind: "completion",
          summary: learnerText(
            "你分享了自己的休假習慣，也理解對方最近較累。可以用輕柔的問題延續話題，也可以分享相近想法並以體貼的話回應。",
            "自分の休みの日の過ごし方を伝え、相手の疲れにも理解を示しました。やさしく質問して会話を続けても、似た考えを話して気遣いの言葉で締めても自然です。",
            "You shared your routine and acknowledged the partner's tiredness. You can continue with a gentle question or share a related thought and close with care."
          )
        }
      ]
    },
    responses: [
      weekendBinding({
        stepId: "weekend-medium-routine-response",
        responseExampleId: "weekend-medium-routine-walk",
        branchId: "weekend-medium-routine-to-rest",
        responseJapanese: "最近は近所の公園を歩くことが多いです。外に出ると気分転換になります。休みの日は出かける方ですか？",
        situation: "After class, a familiar participant asks how the learner usually spends days off.",
        relationship: "Regular community-class participants who are friendly but not close friends; polite Japanese fits.",
        discourse: "The learner shares a routine, explains its benefit, and returns the same topic with a broad question.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "A routine, its benefit, and a reciprocal question form a natural response to this open prompt.",
          continuation: "The partner can answer about their own routine or ask about the nearby park.",
          register_context_fit: "The polite forms suit participants who know each other through class.",
          understandable: "The routine and its effect are expressed in a clear sequence."
        }
      }),
      weekendBinding({
        stepId: "weekend-medium-routine-response",
        responseExampleId: "weekend-medium-routine-cooking",
        branchId: "weekend-medium-routine-to-rest",
        responseJapanese: "このごろは家で料理しています。時間を気にせず作れるのが楽しいです。何か家で楽しんでいることはありますか？",
        situation: "After class, a familiar participant asks how the learner usually spends days off.",
        relationship: "Regular community-class participants who are friendly but not close friends; polite Japanese fits.",
        discourse: "The learner shares a current home activity, gives a reason, and invites a reciprocal personal answer.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The activity and personal reason answer the prompt conversationally rather than as a bare list.",
          continuation: "The open question gives the partner room to mention any at-home activity.",
          register_context_fit: "The question and sentence endings preserve friendly politeness."
        }
      }),
      weekendBinding({
        stepId: "weekend-medium-rest-response",
        responseExampleId: "weekend-medium-rest-empathy",
        branchId: "weekend-medium-rest-finish",
        responseJapanese: "お疲れさまです。休みの日にゆっくりできると、少し気持ちが楽になりますよね。家で休むときは、何をすることが多いですか？",
        situation: "The partner says they have been tired and often rest at home on days off.",
        relationship: "Regular community-class participants who are friendly but not close friends; polite Japanese fits.",
        discourse: "The learner recognizes the partner's tiredness, empathizes with rest, and asks one gentle question about their routine.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "react" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The expression of concern and shared understanding fit a familiar person's low-energy reply.",
          continuation: "The question follows from the partner's home-resting routine without abruptly changing topics.",
          register_context_fit: "The response is warm and polite without implying excessive intimacy."
        }
      }),
      weekendBinding({
        stepId: "weekend-medium-rest-response",
        responseExampleId: "weekend-medium-rest-share",
        branchId: "weekend-medium-rest-finish",
        responseJapanese: "そうなんですね。私も予定を入れずに過ごす日が好きです。無理せず休めるといいですね。",
        situation: "The partner says they have been tired and often rest at home on days off.",
        relationship: "Regular community-class participants who are friendly but not close friends; polite Japanese fits.",
        discourse: "The learner acknowledges the low-energy reply, shares a similar preference, and closes supportively without pressing for details.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: {
          natural: "A short acknowledgement, parallel experience, and considerate closing suit this subdued moment.",
          continuation: "The shared preference allows the partner to continue, while the supportive close also permits the topic to rest.",
          register_context_fit: "The caring wish is appropriate for familiar classmates and does not overstep."
        }
      })
    ]
  },
  {
    scenario: {
      id: "weekend-long-plan-negotiation",
      topic: "making weekend plans",
      world: "planning an outing with a familiar acquaintance",
      situation: learnerText(
        "活動結束後，你和一位漸漸熟悉的同學約週末見面。你們一起討論避開人潮的輕鬆行程，並配合對方的時間，談出彼此都自在的安排。",
        "イベントのあと、少しずつ親しくなった参加者と週末に会う約束をします。人混みを避けてゆっくり過ごせる案を考え、相手の時間にも配慮しながら、二人とも無理のない予定を相談します。",
        "After an event, you make weekend plans with a participant you are getting to know. You discuss a relaxed, uncrowded outing and account for their schedule to find a plan that feels comfortable for both of you."
      ),
      relationship: {
        learnerRole: "community event participant",
        partnerRole: "community event participant",
        context: learnerText(
          "在幾次活動中聊過、正在變熟的同學。不是親密朋友，提出建議或改變安排時維持親切的です・ます語氣。",
          "何度かイベントで話し、少しずつ親しくなっている参加者同士です。まだ親友ではないため、提案や調整も親しみのある「です・ます」で伝えます。",
          "You have talked at several events and are getting to know each other, but are not close friends yet. Keep suggestions and adjustments friendly and polite."
        )
      },
      length: "long",
      primarySkills: ["negotiate", "opinion", "register_adapt"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "neutral",
        topicDepth: "personal",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "協調一次週末出遊：理解對方想避開人潮的偏好，提出可調整的方案，回應時間限制，最後確認兩人都能接受的安排。",
        "週末のお出かけを相談します。人混みを避けたい相手の希望を受け止め、調整できる案を出し、時間の制約にも応じて、二人が納得できる予定を決めましょう。",
        "Negotiate a weekend outing: understand the partner's wish to avoid crowds, offer an adjustable plan, respond to a time constraint, and settle on an arrangement that works for both of you."
      ),
      instruction: learnerText(
        "先表示理解，再提出具體但可商量的提議。聽到對方時間有限時，縮短或調整計畫，並用委婉語氣確認安排。",
        "まず相手の希望を理解したことを伝え、具体的で調整可能な案を出しましょう。時間が限られていると分かったら、予定を短くしたり変えたりして、柔らかい言い方で具体的な点を確認します。",
        "First show that you understand the partner's preference, then make a concrete but flexible proposal. When you learn they have limited time, adjust the plan and confirm details with considerate wording."
      ),
      startStepId: "weekend-long-quiet-outing-opening",
      steps: [
        {
          id: "weekend-long-quiet-outing-opening",
          kind: "partner_line",
          japanese: "今度の土曜日、少し出かけませんか。人混みは避けたいので、近場でのんびりしたいです。",
          nextStepId: "weekend-long-first-proposal"
        },
        {
          id: "weekend-long-first-proposal",
          kind: "learner_response",
          prompt: learnerText(
            "回應對方想避開人潮的偏好，提出一個附近、行程較輕鬆的選項。",
            "人混みを避けて近場で過ごしたいという相手の希望に応じ、ゆったりできそうな案を一つ出しましょう。",
            "Respond to the wish to avoid crowds and suggest one nearby, relaxed option."
          ),
          responseExamples: [
            {
              id: "weekend-long-proposal-garden",
              kind: "suggested",
              japanese: "いいですね。私も遠出より近場がいいです。駅の近くに小さな庭園があるそうですが、少し歩いて、余裕があればお茶しませんか？",
              explanation: learnerText(
                "先認同對方，再補充自己的偏好，提出附近的庭園散步，並把喝茶留作可選安排。",
                "相手に賛同し、自分の希望も伝えたうえで、近くの庭園を歩き、余裕があればお茶をする案を丁寧に提案しています。",
                "You align with the partner, share your preference, and suggest a garden walk with tea as an optional addition."
              )
            },
            {
              id: "weekend-long-proposal-garden-light",
              kind: "accepted",
              japanese: "そうですね。私も静かな場所で散歩するのが好きです。駅の近くの小さな庭園を少し歩いて、時間に余裕があればお茶するのはどうでしょう。短い時間でも大丈夫です。",
              explanation: learnerText(
                "說明自己喜歡在安靜的地方散步，再提出附近的庭園；有餘裕時再喝茶，短暫碰面也可以。",
                "静かな場所を散歩するのが好きだと伝えてから、近くの庭園を歩く案を出しています。お茶は時間に余裕がある場合にし、短時間でもよいと添えています。",
                "You share that you enjoy walking in quiet places, then suggest the nearby garden with tea as an optional addition if time allows."
              )
            }
          ],
          branches: [{ id: "weekend-long-proposal-to-schedule", nextStepId: "weekend-long-schedule-partner" }]
        },
        {
          id: "weekend-long-schedule-partner",
          kind: "partner_line",
          japanese: "庭園もよさそうですね。ただ、土曜日の午後は用事があって、あまり長くはいられなさそうです。",
          nextStepId: "weekend-long-adjust-plan"
        },
        {
          id: "weekend-long-adjust-plan",
          kind: "learner_response",
          prompt: learnerText(
            "回應對方的時間限制，調整提議或提出備選方案，讓對方能自在地接受或婉拒。",
            "相手の時間の制約を受けて、予定を調整するか別の案を出しましょう。相手が気兼ねなく受けたり断ったりできる言い方にします。",
            "Respond to the time constraint by adjusting the plan or offering an alternative in a way that makes it easy for the partner to accept or decline."
          ),
          responseExamples: [
            {
              id: "weekend-long-adjust-short-walk",
              kind: "suggested",
              japanese: "では、午前中に一時間ほど庭園を歩いて、余裕があれば近くでお茶しませんか。難しければ、また別の日でも大丈夫です。",
              explanation: learnerText(
                "縮短主要行程並保留彈性，再明確讓對方知道改天也可以，協商時不會造成壓力。",
                "中心の予定を短くして余裕があればお茶する形にし、別の日でもよいと添えています。相手に圧力をかけない調整です。",
                "You shorten the main activity, make tea optional, and offer another day so the partner is not pressured."
              )
            },
            {
              id: "weekend-long-adjust-garden-short",
              kind: "accepted",
              japanese: "そうなんですね。では、今回は庭園を少し歩いて、時間があれば駅の近くでお茶しませんか。短い時間でも大丈夫です。",
              explanation: learnerText(
                "接受對方的時間限制，改成短暫散步，只有時間允許時才喝茶，保留彈性。",
                "相手の時間に合わせて庭園の散歩を短くし、お茶は時間があればにしています。無理のない調整です。",
                "You accept the time limit, shorten the garden walk, and keep tea optional so the plan remains flexible."
              )
            }
          ],
          branches: [{ id: "weekend-long-adjust-to-confirm", nextStepId: "weekend-long-confirm-partner" }]
        },
        {
          id: "weekend-long-confirm-partner",
          kind: "partner_line",
          japanese: "午前なら大丈夫です。短い時間でも会えたらうれしいです。駅で待ち合わせましょうか。",
          nextStepId: "weekend-long-confirm-plan"
        },
        {
          id: "weekend-long-confirm-plan",
          kind: "learner_response",
          prompt: learnerText(
            "確認雙方都能接受的時間和集合地點，為這次協商做自然的收尾。",
            "二人が無理なく参加できる時間と待ち合わせ場所を確認し、相談を自然にまとめましょう。",
            "Confirm a time and meeting place that work for both of you, bringing the negotiation to a natural close."
          ),
          responseExamples: [
            {
              id: "weekend-long-confirm-ten",
              kind: "suggested",
              japanese: "ありがとうございます。では、土曜日の十時に駅の改札前でどうでしょう。庭園を歩いてから、お茶するかはその時に決めましょう。",
              explanation: learnerText(
                "感謝後提出明確的時間和地點，並把後續活動留有彈性，確認行程但不過度安排。",
                "お礼のあと時間と場所を具体的に確認し、その後の予定には余地を残しています。決定事項と柔軟さのバランスがあります。",
                "You thank the partner, confirm a clear time and place, and leave the later activity flexible."
              )
            },
            {
              id: "weekend-long-confirm-time",
              kind: "accepted",
              japanese: "助かります。では、十時ごろ駅で待ち合わせて、庭園を一周してから、お茶するか決めませんか？",
              explanation: learnerText(
                "用約略時間和共同確認的說法敲定碰面方式，也讓喝茶與否由當天狀況決定。",
                "おおよその時間と待ち合わせを確認し、お茶するかは当日の様子で決める提案です。相手と相談しながら予定をまとめています。",
                "You confirm an approximate time and meeting place, leaving the optional tea stop to decide together on the day."
              )
            }
          ],
          branches: [{ id: "weekend-long-plan-finish", nextStepId: "weekend-long-complete" }]
        },
        {
          id: "weekend-long-complete",
          kind: "completion",
          summary: learnerText(
            "你理解對方避開人潮和時間有限的需求，提出並調整方案，最後用親切有禮的方式確認共同安排。",
            "人混みを避けたい希望と時間の制約を受け止め、案を出して調整し、親しみのある丁寧な言い方で二人の予定を確認しました。",
            "You respected the wish to avoid crowds and the time limit, adjusted your proposal, and confirmed a shared plan in friendly, polite language."
          )
        }
      ]
    },
    responses: [
      weekendBinding({
        stepId: "weekend-long-first-proposal",
        responseExampleId: "weekend-long-proposal-garden",
        branchId: "weekend-long-proposal-to-schedule",
        responseJapanese: "いいですね。私も遠出より近場がいいです。駅の近くに小さな庭園があるそうですが、少し歩いて、余裕があればお茶しませんか？",
        situation: "A familiar acquaintance invites the learner to go out Saturday and wants a nearby, uncrowded outing.",
        relationship: "People getting to know each other through events; suggestions should stay friendly and politely tentative.",
        discourse: "The learner aligns with the preference, adds their own view, and proposes a garden walk with tea as an optional addition.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "agree_disagree" },
          { feature: "add", canonicalSkillId: "opinion" },
          { feature: "ask", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The agreement, shared preference, and tentative proposal follow the partner's invitation naturally.",
          continuation: "The partner can accept the garden walk, decline tea, or adjust the timing.",
          register_context_fit: "The soft proposal is suitably polite for an acquaintance who is not yet a close friend."
        }
      }),
      weekendBinding({
        stepId: "weekend-long-first-proposal",
        responseExampleId: "weekend-long-proposal-garden-light",
        branchId: "weekend-long-proposal-to-schedule",
        responseJapanese: "そうですね。私も静かな場所で散歩するのが好きです。駅の近くの小さな庭園を少し歩いて、時間に余裕があればお茶するのはどうでしょう。短い時間でも大丈夫です。",
        situation: "A familiar acquaintance invites the learner to go out Saturday and wants a nearby, uncrowded outing.",
        relationship: "People getting to know each other through events; suggestions should stay friendly and politely tentative.",
        discourse: "The learner shares a preference for quiet walks, proposes the nearby garden, and makes tea optional if time allows.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "opinion" },
          { feature: "ask", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The personal preference gives context for a natural garden suggestion and optional tea stop.",
          continuation: "The partner can accept the short garden walk, adjust timing, or skip tea.",
          register_context_fit: "The polite wording and explicit flexibility respect the relationship distance."
        }
      }),
      weekendBinding({
        stepId: "weekend-long-adjust-plan",
        responseExampleId: "weekend-long-adjust-short-walk",
        branchId: "weekend-long-adjust-to-confirm",
        responseJapanese: "では、午前中に一時間ほど庭園を歩いて、余裕があれば近くでお茶しませんか。難しければ、また別の日でも大丈夫です。",
        situation: "The partner likes the garden idea but says they cannot stay long on Saturday afternoon.",
        relationship: "People getting to know each other through events; suggestions should stay friendly and politely tentative.",
        discourse: "The learner shortens the outing, makes the optional activity conditional, and explicitly leaves room to reschedule.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "negotiate" },
          { feature: "add", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The reduced plan responds directly to the partner's constraint and sounds collaborative.",
          continuation: "The partner can choose the shorter outing or reschedule without losing face.",
          register_context_fit: "The explicit flexibility and polite forms avoid making the partner defend their schedule."
        }
      }),
      weekendBinding({
        stepId: "weekend-long-adjust-plan",
        responseExampleId: "weekend-long-adjust-garden-short",
        branchId: "weekend-long-adjust-to-confirm",
        responseJapanese: "そうなんですね。では、今回は庭園を少し歩いて、時間があれば駅の近くでお茶しませんか。短い時間でも大丈夫です。",
        situation: "The partner likes the garden idea but says they cannot stay long on Saturday afternoon.",
        relationship: "People getting to know each other through events; suggestions should stay friendly and politely tentative.",
        discourse: "The learner shortens the garden walk and makes tea conditional on the partner having enough time.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "negotiate" },
          { feature: "add", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The shorter garden walk and optional tea respond naturally to the partner's time limit.",
          continuation: "The partner can agree to the shortened walk or decide whether tea fits the available time.",
          register_context_fit: "The invitation is tentative and leaves the partner an easy choice."
        }
      }),
      weekendBinding({
        stepId: "weekend-long-confirm-plan",
        responseExampleId: "weekend-long-confirm-ten",
        branchId: "weekend-long-plan-finish",
        responseJapanese: "ありがとうございます。では、土曜日の十時に駅の改札前でどうでしょう。庭園を歩いてから、お茶するかはその時に決めましょう。",
        situation: "The partner agrees to meet in the morning and asks whether to meet at the station.",
        relationship: "People getting to know each other through events; suggestions should stay friendly and politely tentative.",
        discourse: "The learner confirms the time and place, then keeps the optional next activity flexible.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "negotiate" },
          { feature: "add", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The thanks and concrete confirmation close the planning sequence clearly.",
          continuation: "The optional tea decision remains a small shared choice for later.",
          register_context_fit: "The wording is friendly and polite rather than presumptuous."
        }
      }),
      weekendBinding({
        stepId: "weekend-long-confirm-plan",
        responseExampleId: "weekend-long-confirm-time",
        branchId: "weekend-long-plan-finish",
        responseJapanese: "助かります。では、十時ごろ駅で待ち合わせて、庭園を一周してから、お茶するか決めませんか？",
        situation: "The partner agrees to meet in the morning and asks whether to meet at the station.",
        relationship: "People getting to know each other through events; suggestions should stay friendly and politely tentative.",
        discourse: "The learner proposes an approximate time and shared decision about what to do afterward.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "negotiate" },
          { feature: "ask", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The approximate time and joint suggestion sound natural when finalizing plans collaboratively.",
          continuation: "The partner can agree to the time or adjust the proposed sequence.",
          register_context_fit: "The question invites agreement and preserves the partner's agency."
        }
      })
    ]
  }
];
