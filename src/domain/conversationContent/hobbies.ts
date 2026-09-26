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

interface HobbyBindingInput {
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

function hobbyBinding(input: HobbyBindingInput): ConversationSessionResponseBinding {
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

const familiarGroup = "Members of a small neighborhood photo club who have chatted a few times; friendly polite Japanese fits.";
const familiarClassmates = "Classmates who have been talking about new interests during their break; natural polite Japanese fits.";
const newlyMetPeer = "The two people have just met at a community hobby gathering; stay considerate and avoid presuming closeness or commitment.";

export const hobbiesConversationDefinitions: readonly ConversationSessionDefinition[] = [
  {
    scenario: {
      id: "hobbies-short-join-photo-chat",
      topic: "joining a conversation about hobbies",
      world: "a small neighborhood photo club sharing recent interests",
      situation: learnerText(
        "在社區攝影同好會的休息時間，大家正在分享最近的興趣。你剛好聽到一位成員說自己喜歡散步時拍照。",
        "地域の写真サークルの休憩中、みんなが最近の趣味について話しています。あるメンバーが散歩中に写真を撮るのが好きだと話しているところです。",
        "During a break at a neighborhood photo club, members are sharing recent interests. You have just heard one member say they enjoy taking photos while walking."
      ),
      relationship: {
        learnerRole: "member who is joining an ongoing hobby conversation",
        partnerRole: "photo club member sharing a hobby",
        context: learnerText(
          "你們在同一個小型社團見過幾次。自然加入正在進行的話題，分享一點相關經驗，再追問對方的興趣。",
          "小さなサークルで何度か顔を合わせています。続いている話題に自然に加わり、関連する経験を少し話して相手の趣味について尋ねます。",
          "You have met a few times in a small club. Join the ongoing topic naturally, share a related detail, and ask about the partner's interest."
        )
      },
      length: "short",
      primarySkills: ["join", "share", "bounce"],
      difficulty: {
        linguisticComplexity: "basic",
        partnerSupport: "supportive",
        relationshipDistance: "familiar",
        topicDepth: "concrete",
        interactionPressure: "low"
      },
      objective: learnerText(
        "接續正在進行的攝影話題，分享一項相關興趣，並用一個輕鬆的問題讓對方繼續聊。",
        "写真の話題に自然に加わり、関連する趣味を一つ話して、気軽な質問で相手に話を続けてもらいましょう。",
        "Join the ongoing photo conversation, share one related interest, and invite the partner to continue with an easy question."
      ),
      instruction: learnerText(
        "先接住對方的攝影話題，再簡短分享自己的相關興趣，最後詢問對方開始攝影的契機。",
        "相手の写真の話を受け止め、自分の関連する趣味を短く話してから、写真を始めたきっかけを尋ねましょう。",
        "Acknowledge the photo topic, briefly share a related interest, then ask what got the partner started with photography."
      ),
      startStepId: "hobbies-short-photo-topic",
      steps: [
        {
          id: "hobbies-short-photo-topic",
          kind: "partner_line",
          japanese: "最近は散歩しながら写真を撮るのが楽しいんです。季節の花を見つけると、つい撮りたくなります。",
          nextStepId: "hobbies-short-join-response"
        },
        {
          id: "hobbies-short-join-response",
          kind: "learner_response",
          prompt: learnerText(
            "自然加入對方的攝影話題，分享相關興趣，並問問對方怎麼開始攝影。",
            "相手の写真の話題に自然に加わり、関連する趣味を話して、写真を始めたきっかけを尋ねましょう。",
            "Join the photo topic naturally, share a related interest, and ask what got the partner started."
          ),
          responseExamples: [
            {
              id: "hobbies-short-sketch-and-photo",
              kind: "suggested",
              japanese: "花の写真、いいですね。私は最近、喫茶店の窓辺をスケッチするのが好きです。写真を始めたきっかけは何だったんですか？",
              explanation: learnerText(
                "先回應花朵照片，再分享自己最近的速寫興趣，並詢問對方開始攝影的契機。",
                "花の写真に反応し、最近のスケッチの趣味を話してから、写真を始めたきっかけを尋ねています。",
                "You react to the flower photos, share your recent sketching interest, and ask what inspired the partner to start photography."
              )
            },
            {
              id: "hobbies-short-walk-and-photo",
              kind: "accepted",
              japanese: "散歩中に季節の花を見つけるの、楽しそうですね。私は最近、道端の草花の名前を調べています。写真を撮るようになったのは、何かきっかけがあったんですか？",
              explanation: learnerText(
                "分享自己觀察路邊植物的興趣，並用自然的追問延續攝影話題。",
                "道端の草花を調べる趣味を話し、自然な質問で写真の話題を続けています。",
                "You share your interest in identifying roadside plants and use a natural follow-up to continue the photo topic."
              )
            }
          ],
          branches: [{ id: "hobbies-short-photo-origin", nextStepId: "hobbies-short-photo-origin-reply" }]
        },
        {
          id: "hobbies-short-photo-origin-reply",
          kind: "partner_line",
          japanese: "友人に古いカメラを借りたのがきっかけです。散歩の途中で気に入ったものを撮るくらいなので、気軽に続けられています。",
          nextStepId: "hobbies-short-complete"
        },
        {
          id: "hobbies-short-complete",
          kind: "completion",
          summary: learnerText(
            "你自然加入攝影話題，分享相關興趣，並了解對方開始拍照的契機。",
            "写真の話題に自然に加わり、関連する趣味を話して、相手が写真を始めたきっかけを聞けました。",
            "You joined the photo conversation, shared a related interest, and learned what got the partner started."
          )
        }
      ]
    },
    responses: [
      hobbyBinding({
        stepId: "hobbies-short-join-response",
        responseExampleId: "hobbies-short-sketch-and-photo",
        branchId: "hobbies-short-photo-origin",
        responseJapanese: "花の写真、いいですね。私は最近、喫茶店の窓辺をスケッチするのが好きです。写真を始めたきっかけは何だったんですか？",
        situation: "A member is sharing an ongoing interest in taking photos while walking; the learner joins a small club conversation.",
        relationship: familiarGroup,
        discourse: "The learner acknowledges the partner's photos, contributes a related personal interest, and asks a follow-up about the partner's starting point.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "join" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The reaction and related sketching detail make the learner's entry feel connected to the group's current topic.",
          continuation: "The partner can explain how the photography hobby began.",
          register_context_fit: "Friendly polite wording suits club members who have met a few times."
        }
      }),
      hobbyBinding({
        stepId: "hobbies-short-join-response",
        responseExampleId: "hobbies-short-walk-and-photo",
        branchId: "hobbies-short-photo-origin",
        responseJapanese: "散歩中に季節の花を見つけるの、楽しそうですね。私は最近、道端の草花の名前を調べています。写真を撮るようになったのは、何かきっかけがあったんですか？",
        situation: "A member is sharing an ongoing interest in taking photos while walking; the learner joins a small club conversation.",
        relationship: familiarGroup,
        discourse: "The learner connects their interest in plants to the current walk-and-photo topic before asking about the partner's motivation.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "join" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The learner adds a related observation rather than switching to an unrelated hobby.",
          continuation: "The follow-up invites the partner to explain their reason for starting photography.",
          register_context_fit: "The polite question is conversational without sounding overly formal."
        }
      })
    ]
  },
  {
    scenario: {
      id: "hobbies-medium-recent-interests",
      topic: "recent hobbies and what makes them enjoyable",
      world: "classmates exchanging updates about new interests during a break",
      situation: learnerText(
        "課堂休息時，你和同學聊到最近開始的新興趣。對方最近開始編織，並問你最近有沒有開始做什麼。",
        "授業の休み時間に、最近始めた趣味についてクラスメートと話しています。相手は最近編み物を始め、あなたにも何か新しいことを始めたか尋ねています。",
        "During a class break, you and a classmate are talking about recent interests. They recently started knitting and ask whether you have started anything new."
      ),
      relationship: {
        learnerRole: "classmate sharing a recent hobby",
        partnerRole: "classmate who recently started knitting",
        context: learnerText(
          "你們常在課堂休息時聊天。各自分享最近開始的興趣和喜歡的地方，並把問題自然地交回對方。",
          "授業の休み時間によく話すクラスメートです。最近始めた趣味や楽しいところを互いに話し、自然に質問を返します。",
          "You often chat during class breaks. Share recent interests and what you enjoy about them, then naturally return a question to the partner."
        )
      },
      length: "medium",
      primarySkills: ["share", "expand"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "familiar",
        topicDepth: "personal",
        interactionPressure: "low"
      },
      objective: learnerText(
        "分享一項最近開始的興趣和喜歡的地方，再詢問同學開始編織的契機與下一個作品，維持同一段話題。",
        "最近始めた趣味と楽しいところを話し、編み物を始めたきっかけや次の作品について尋ねながら、一つの話題を続けましょう。",
        "Share a recent interest and what you enjoy about it, then ask what inspired your classmate to knit and what they plan to make next."
      ),
      instruction: learnerText(
        "第一回合分享你最近開始的興趣並詢問對方的契機；第二回合再說明自己喜歡的地方，並把話題交回對方。",
        "最初の返答では最近始めた趣味を話して、相手が編み物を始めたきっかけを尋ねます。次は楽しいところを伝え、相手にも質問を返しましょう。",
        "First share a recent interest and ask what inspired your classmate to knit. Then explain what you enjoy about your own interest and ask back."
      ),
      startStepId: "hobbies-medium-new-interest-question",
      steps: [
        {
          id: "hobbies-medium-new-interest-question",
          kind: "partner_line",
          japanese: "最近、編み物を始めたんです。少しずつ形になっていくのが楽しくて。何か新しく始めたことありますか？",
          nextStepId: "hobbies-medium-share-interest-response"
        },
        {
          id: "hobbies-medium-share-interest-response",
          kind: "learner_response",
          prompt: learnerText(
            "分享一項最近開始的興趣，並詢問同學開始編織的契機。",
            "最近始めた趣味を話して、相手が編み物を始めたきっかけを尋ねましょう。",
            "Share something you recently started and ask what inspired your classmate to take up knitting."
          ),
          responseExamples: [
            {
              id: "hobbies-medium-soup-interest",
              kind: "suggested",
              japanese: "最近、野菜のスープを作り始めました。季節の野菜を組み合わせるのが面白いです。編み物を始めたきっかけは何だったんですか？",
              explanation: learnerText(
                "說明最近開始做蔬菜湯，再詢問同學開始編織的原因。",
                "最近野菜スープ作りを始めたことを話し、編み物を始めたきっかけを尋ねています。",
                "You share that you recently started making vegetable soup and ask what inspired your classmate to knit."
              )
            },
            {
              id: "hobbies-medium-soup-bean-vegetable-interest",
              kind: "accepted",
              japanese: "最近、豆と野菜のスープを作り始めました。煮込むうちに味が変わるのが楽しいです。編み物はどうして始めたんですか？",
              explanation: learnerText(
                "分享自己最近開始煮湯的興趣，並詢問同學開始編織的契機。",
                "最近スープ作りを始めたと話し、編み物を始めた理由を尋ねています。",
                "You share that you recently started making soup and ask what inspired your classmate to knit."
              )
            }
          ],
          branches: [{ id: "hobbies-medium-knitting-origin", nextStepId: "hobbies-medium-knitting-reply" }]
        },
        {
          id: "hobbies-medium-knitting-reply",
          kind: "partner_line",
          japanese: "友人が余っていた毛糸をくれたのがきっかけです。何を作ろうか考えるのも楽しいですね。その趣味のどんなところが好きですか？",
          nextStepId: "hobbies-medium-enjoyment-response"
        },
        {
          id: "hobbies-medium-enjoyment-response",
          kind: "learner_response",
          prompt: learnerText(
            "說明自己最喜歡這項興趣的地方，再詢問同學接下來想編織什麼。",
            "自分がその趣味のどんなところを好きか話し、相手が次に何を編みたいか尋ねましょう。",
            "Explain what you enjoy about your interest, then ask what your classmate would like to knit next."
          ),
          responseExamples: [
            {
              id: "hobbies-medium-soup-enjoyment",
              kind: "suggested",
              japanese: "スープは材料を少し変えるだけで味が変わるのが面白いです。次はどんなものを編む予定ですか？",
              explanation: learnerText(
                "簡短補充做菜有趣的地方，並詢問對方下一個編織計畫。",
                "料理の面白さを少し補足し、次に編むものを尋ねています。",
                "You add what makes cooking interesting to you and ask about the partner's next knitting project."
              )
            },
            {
              id: "hobbies-medium-soup-flavor-enjoyment",
              kind: "accepted",
              japanese: "野菜を煮込むと味が深まるところが好きです。次はどんな作品を作ってみたいですか？",
              explanation: learnerText(
                "分享煮湯時味道逐漸融合的樂趣，再詢問同學下一個作品。",
                "スープを煮込む楽しさを話し、相手が次に作りたい作品を尋ねています。",
                "You share what you enjoy about making soup and ask what the partner would like to make next."
              )
            }
          ],
          branches: [{ id: "hobbies-medium-next-project", nextStepId: "hobbies-medium-project-reply" }]
        },
        {
          id: "hobbies-medium-project-reply",
          kind: "partner_line",
          japanese: "まずは短いマフラーを作ってみたいです。少しずつ編めば、忙しい週でも続けられそうです。",
          nextStepId: "hobbies-medium-complete"
        },
        {
          id: "hobbies-medium-complete",
          kind: "completion",
          summary: learnerText(
            "你分享了最近開始的興趣和喜歡的地方，也了解同學開始編織的契機與下一個作品。",
            "最近始めた趣味と好きなところを話し、相手が編み物を始めたきっかけや次の作品について聞けました。",
            "You shared a recent interest and what you enjoy about it, and learned how your classmate started knitting and what they plan to make next."
          )
        }
      ]
    },
    responses: [
      hobbyBinding({
        stepId: "hobbies-medium-share-interest-response",
        responseExampleId: "hobbies-medium-soup-interest",
        branchId: "hobbies-medium-knitting-origin",
        responseJapanese: "最近、野菜のスープを作り始めました。季節の野菜を組み合わせるのが面白いです。編み物を始めたきっかけは何だったんですか？",
        situation: "A classmate asks about recent interests while sharing that they have begun knitting.",
        relationship: familiarClassmates,
        discourse: "The learner shares a specific new cooking interest and asks the classmate what prompted their knitting hobby.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "A concrete detail about seasonal vegetables makes the new interest easy to respond to.",
          continuation: "The question invites the classmate to explain why they started knitting.",
          register_context_fit: "Friendly polite speech suits classmates talking during a break."
        }
      }),
      hobbyBinding({
        stepId: "hobbies-medium-share-interest-response",
        responseExampleId: "hobbies-medium-soup-bean-vegetable-interest",
        branchId: "hobbies-medium-knitting-origin",
        responseJapanese: "最近、豆と野菜のスープを作り始めました。煮込むうちに味が変わるのが楽しいです。編み物はどうして始めたんですか？",
        situation: "A classmate asks about recent interests while sharing that they have begun knitting.",
        relationship: familiarClassmates,
        discourse: "The learner shares a recent soup-making interest and asks what prompted the classmate to start knitting.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "A concrete detail about recently making soup answers the partner's question naturally.",
          continuation: "The follow-up asks about the origin of the classmate's knitting hobby.",
          register_context_fit: "A friendly polite question fits an everyday classmate conversation."
        }
      }),
      hobbyBinding({
        stepId: "hobbies-medium-enjoyment-response",
        responseExampleId: "hobbies-medium-soup-enjoyment",
        branchId: "hobbies-medium-next-project",
        responseJapanese: "スープは材料を少し変えるだけで味が変わるのが面白いです。次はどんなものを編む予定ですか？",
        situation: "The classmate has explained what inspired their knitting and asked what the learner enjoys about their new hobby.",
        relationship: familiarClassmates,
        discourse: "The learner answers what they enjoy about cooking and asks about the partner's next knitting project.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The learner answers the partner's broad question with a concrete reason cooking stays interesting.",
          continuation: "The follow-up asks about the next knitting project the classmate is considering.",
          register_context_fit: "The straightforward polite question fits the familiar peer relationship."
        }
      }),
      hobbyBinding({
        stepId: "hobbies-medium-enjoyment-response",
        responseExampleId: "hobbies-medium-soup-flavor-enjoyment",
        branchId: "hobbies-medium-next-project",
        responseJapanese: "野菜を煮込むと味が深まるところが好きです。次はどんな作品を作ってみたいですか？",
        situation: "The classmate has explained what inspired their knitting and asked what the learner enjoys about their new hobby.",
        relationship: familiarClassmates,
        discourse: "The learner answers what they enjoy about making soup and asks what the classmate hopes to make next.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The learner explains a specific rewarding part of making soup rather than giving a generic answer.",
          continuation: "The follow-up asks about the next knitting project the classmate is considering.",
          register_context_fit: "Friendly polite speech is appropriate between classmates who chat regularly."
        }
      })
    ]
  },
  {
    scenario: {
      id: "hobbies-long-gentle-interest-bridge",
      topic: "finding common ground between different leisure preferences",
      world: "a first conversation at a community hobby gathering",
      situation: learnerText(
        "在社區興趣交流會上，你剛認識一位喜歡健行的人。對方提到最近工作忙，暫時不太想安排遠行。",
        "地域の趣味交流会で、ハイキングが好きな人と初めて話します。相手は最近仕事が忙しく、しばらく遠出は控えたいと話しています。",
        "At a community hobby gathering, you have just met someone who enjoys hiking. They mention that work has been busy and they would rather avoid a long trip for now."
      ),
      relationship: {
        learnerRole: "new acquaintance who prefers nearby walks and photography",
        partnerRole: "new acquaintance who enjoys hiking but has limited energy for trips",
        context: learnerText(
          "你們剛認識，彼此還不熟。尊重對方想減少遠行的狀況，說明自己的偏好，再提出容易婉拒的輕鬆替代方式，最後不施壓地收尾。",
          "二人は初対面で、まだ親しくありません。相手が遠出を控えたい状況を尊重し、自分の好みも伝えたうえで、断りやすい気軽な代案を出し、最後は無理に決めずに話を締めます。",
          "You have just met and are not close. Respect their wish to avoid trips, share your own preference, offer an easy-to-decline alternative, and close without pressuring them to decide."
        )
      },
      length: "long",
      primarySkills: ["share", "expand", "negotiate", "exit"],
      difficulty: {
        linguisticComplexity: "advanced",
        partnerSupport: "balanced",
        relationshipDistance: "neutral",
        topicDepth: "personal",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "先分享自己的休閒偏好，並詢問對方健行時印象最深的景色；再從對方委婉提到工作繁忙的說法中理解其不便，提出保留餘地的近處方案，最後不追問時間地點而自然收尾。",
        "自分の休日の好みを話し、ハイキングで特に印象に残った景色を尋ねます。仕事が立て込んでいるという言葉から予定を決めにくいことをくみ取り、条件を添えた近場の案を出したうえで、日時を迫らずに会話を締めましょう。",
        "Share your leisure preference and ask about a specific memorable view from hiking. Infer from the partner's indirect comment about a busy period that plans are difficult, offer a qualified nearby idea, and close without pressing for a date."
      ),
      instruction: learnerText(
        "對方提到最近工作繁忙、想減少遠行。理解對方目前可能沒有餘裕安排長時間外出，再有條件地提出近處短程散步，並讓下次再聊也很自然。",
        "相手は最近仕事が忙しく、遠出を控えたい様子です。長く歩く余裕がない可能性をくみ取り、近場の短い散歩を条件付きで提案し、今すぐ約束を求めず次の機会へつなげてください。",
        "The partner says work has been busy and they want to avoid long trips. Recognize that they may have little energy for a long walk, suggest a short nearby option conditionally, and leave room to talk another time without asking for a commitment now."
      ),
      startStepId: "hobbies-long-first-meeting",
      steps: [
        {
          id: "hobbies-long-first-meeting",
          kind: "partner_line",
          japanese: "休日はよくハイキングに行きます。山の景色を見るのが好きなんですが、最近は仕事が立て込んでいて、遠出は少し控えたいんです。そちらは休日に何をすることが多いですか？",
          nextStepId: "hobbies-long-share-preference-response"
        },
        {
          id: "hobbies-long-share-preference-response",
          kind: "learner_response",
          prompt: learnerText(
            "分享自己偏好的休閒方式，並詢問對方健行時印象最深的具體景色。",
            "自分の休日の過ごし方を話し、ハイキングで特に印象に残った景色を尋ねましょう。",
            "Share how you spend free time and ask about a specific memorable view from hiking."
          ),
          responseExamples: [
            {
              id: "hobbies-long-photo-preference",
              kind: "suggested",
              japanese: "私は近所を歩きながら古い建物の写真を撮るのが好きです。山の景色の中で、今でも印象に残っている眺めはありますか？",
              explanation: learnerText(
                "分享自己喜歡拍攝街景，並請對方說說至今仍印象深刻的山景。",
                "街の建物を撮る趣味を話し、今でも印象に残っている山の景色を尋ねています。",
                "You share your interest in photographing local buildings and ask about a mountain view that has stayed with the partner."
              )
            },
            {
              id: "hobbies-long-neighborhood-walk",
              kind: "accepted",
              japanese: "遠くまで行くより、近所をゆっくり歩くのが好きです。山歩きで出会った景色のうち、特に心に残ったものはありますか？",
              explanation: learnerText(
                "說明自己偏好在附近散步，並詢問對方健行途中難忘的景色。",
                "近所をゆっくり歩く好みを話し、ハイキング中に心に残った景色を尋ねています。",
                "You explain that you prefer a slow walk nearby and ask about a memorable view from a hike."
              )
            }
          ],
          branches: [{ id: "hobbies-long-understand-hiking", nextStepId: "hobbies-long-hiking-reply" }]
        },
        {
          id: "hobbies-long-hiking-reply",
          kind: "partner_line",
          japanese: "雨上がりに霧が晴れて、山の向こうに湖が見えた景色は今でも印象に残っています。ただ最近は仕事が立て込んでいて、長く歩く余裕はあまりなくて。近場で気分転換できればと思うこともあります。",
          nextStepId: "hobbies-long-gentle-plan-response"
        },
        {
          id: "hobbies-long-gentle-plan-response",
          kind: "learner_response",
          prompt: learnerText(
            "聽出對方工作繁忙、暫時不便遠行的暗示，提出對方可以婉拒或延後的近處短程散步邀請，並不催促現在決定。",
            "仕事が忙しく遠出を控えたいという話をくみ取り、断ったり先に延ばしたりしやすい形で近場の短い散歩に誘い、今すぐ決めるよう求めないでください。",
            "Infer from the partner's busy schedule that a long trip may be difficult. Offer a nearby short walk they can decline or defer, without pressing them to decide now."
          ),
          responseExamples: [
            {
              id: "hobbies-long-propose-riverside",
              kind: "suggested",
              japanese: "そうなんですね。お仕事が少し落ち着いた頃に、もしご負担でなければ、駅近くの川沿いを少し歩くのはいかがでしょう。景色を眺めるだけでも気分転換になりそうですし、疲れそうでしたらすぐ切り上げられます。",
              explanation: learnerText(
                "聽出對方工作繁忙、不方便走遠的暗示，提出可等工作告一段落再考慮的短程散步，並保留提前結束的選項。",
                "仕事が忙しく長く歩く余裕がないという話をくみ取り、仕事が落ち着いてからの短い散歩を条件付きで提案し、早めに切り上げる余地も残しています。",
                "You infer from the partner's busy schedule that a long walk may be difficult, make the short walk conditional on work settling down, and leave room to end early."
              )
            },
            {
              id: "hobbies-long-soft-riverside-option",
              kind: "accepted",
              japanese: "今は長く歩く余裕がないようでしたら、駅の近くを少し散歩するのはどうでしょう。もし差し支えなければ、お仕事が落ち着いた頃にご一緒できたらうれしいです。",
              explanation: learnerText(
                "聽出對方目前可能沒有餘裕長時間步行，提出近處散步，並把邀請留到對方工作告一段落後。",
                "長く歩く余裕がない可能性をくみ取り、近場の散歩を条件付きで提案し、誘いを仕事が落ち着いた後へと開いています。",
                "You recognize that the partner may have little energy for a long walk, suggest a nearby option conditionally, and leave the invitation open until work settles down."
              )
            }
          ],
          branches: [{ id: "hobbies-long-nearby-plan", nextStepId: "hobbies-long-plan-reply" }]
        },
        {
          id: "hobbies-long-plan-reply",
          kind: "partner_line",
          japanese: "そのくらいなら気分転換になりそうですね。ただ、来週以降の予定はまだ見通しが立たなくて、今は何とも言えないんです。またこの会でお会いしたときに、余裕があればお話しできたらうれしいです。",
          nextStepId: "hobbies-long-close-response"
        },
        {
          id: "hobbies-long-close-response",
          kind: "learner_response",
          prompt: learnerText(
            "不急著當場約定，親切回應對方想下次再聊的提議並自然收尾。",
            "その場で予定を決めようとせず、また今度話したいという相手の提案に応じて自然に締めましょう。",
            "Do not press for a commitment now. Respond warmly to the partner's wish to talk again and close naturally."
          ),
          responseExamples: [
            {
              id: "hobbies-long-close-next-time",
              kind: "suggested",
              japanese: "そうですね、予定が見えてからで大丈夫です。またこの会でお会いしたときに、もしお互い余裕があれば散歩のお話をしましょう。今日はお話しできてよかったです。",
              explanation: learnerText(
                "理解對方目前無法預測行程，接受下次活動再聊，並自然結束初次交談。",
                "今は予定を決めにくいという相手の話を受け止め、次の会で話す余地を残して自然に締めています。",
                "You accept that the partner cannot predict their schedule and leave room to talk at another gathering before closing naturally."
              )
            },
            {
              id: "hobbies-long-close-event",
              kind: "accepted",
              japanese: "もちろんです。予定が分からないうちは無理に決めず、またこの会でお会いしたときにお話ししましょう。今日はお話しできてよかったです。",
              explanation: learnerText(
                "不催促對方決定日期，呼應下次活動碰面時再聊的提議，並禮貌收尾。",
                "日程を決めるよう迫らず、次の会で話す提案に応じて初対面の会話を丁寧に締めています。",
                "You do not press for a date, accept the suggestion to talk at another gathering, and close the first conversation politely."
              )
            }
          ],
          branches: [{ id: "hobbies-long-close", nextStepId: "hobbies-long-complete" }]
        },
        {
          id: "hobbies-long-complete",
          kind: "completion",
          summary: learnerText(
            "你尊重對方最近不想遠行的狀況，找到輕鬆的近處替代方案，也在不施壓的情況下自然收尾。",
            "相手が最近は遠出を控えたい状況を尊重し、近場の気軽な代案を見つけて、無理に約束を迫らず自然に会話を締められました。",
            "You respected the partner's wish to avoid trips, found an easy nearby alternative, and closed without pressuring them to commit."
          )
        }
      ]
    },
    responses: [
      hobbyBinding({
        stepId: "hobbies-long-share-preference-response",
        responseExampleId: "hobbies-long-photo-preference",
        branchId: "hobbies-long-understand-hiking",
        responseJapanese: "私は近所を歩きながら古い建物の写真を撮るのが好きです。山の景色の中で、今でも印象に残っている眺めはありますか？",
        situation: "A newly met person enjoys hiking scenery but indirectly hints that work leaves little room for long walks or firm plans.",
        relationship: newlyMetPeer,
        discourse: "The learner shares a distinct leisure preference and asks for a specific memorable landscape before making a proposal.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The learner offers a related but different way of enjoying scenery instead of claiming to share the same hobby.",
          continuation: "The question invites a specific story about a memorable view rather than reconfirming a stated preference.",
          register_context_fit: "The respectful question avoids presuming how close the newly met people are."
        }
      }),
      hobbyBinding({
        stepId: "hobbies-long-share-preference-response",
        responseExampleId: "hobbies-long-neighborhood-walk",
        branchId: "hobbies-long-understand-hiking",
        responseJapanese: "遠くまで行くより、近所をゆっくり歩くのが好きです。山歩きで出会った景色のうち、特に心に残ったものはありますか？",
        situation: "A newly met person enjoys hiking scenery but indirectly hints that work leaves little room for long walks or firm plans.",
        relationship: newlyMetPeer,
        discourse: "The learner contrasts their preference for nearby walks with the partner's hikes and asks for a specific memorable landscape.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The learner shares a preference without rejecting the partner's enjoyment of hiking.",
          continuation: "The specific question invites the partner to describe a memorable landscape rather than repeat what they enjoy.",
          register_context_fit: "The polite form suits an initial conversation with a new acquaintance."
        }
      }),
      hobbyBinding({
        stepId: "hobbies-long-gentle-plan-response",
        responseExampleId: "hobbies-long-propose-riverside",
        branchId: "hobbies-long-nearby-plan",
        responseJapanese: "そうなんですね。お仕事が少し落ち着いた頃に、もしご負担でなければ、駅近くの川沿いを少し歩くのはいかがでしょう。景色を眺めるだけでも気分転換になりそうですし、疲れそうでしたらすぐ切り上げられます。",
        situation: "The partner describes a memorable mountain lake but indirectly hints that work leaves little room for a long walk.",
        relationship: newlyMetPeer,
        discourse: "The learner infers reluctance from an indirect hint, qualifies a proposal around the partner's energy, and makes it easy to stop early.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "negotiate" },
          { feature: "ask", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The qualified suggestion responds to the implied constraint while preserving the partner's interest in scenery.",
          continuation: "The partner can accept the low-effort idea or defer without rejecting the shared interest.",
          register_context_fit: "The learner frames the invitation as optional and includes an easy way to stop early."
        }
      }),
      hobbyBinding({
        stepId: "hobbies-long-gentle-plan-response",
        responseExampleId: "hobbies-long-soft-riverside-option",
        branchId: "hobbies-long-nearby-plan",
        responseJapanese: "今は長く歩く余裕がないようでしたら、駅の近くを少し散歩するのはどうでしょう。もし差し支えなければ、お仕事が落ち着いた頃にご一緒できたらうれしいです。",
        situation: "The partner describes a memorable mountain lake but indirectly hints that work leaves little room for a long walk.",
        relationship: newlyMetPeer,
        discourse: "The learner interprets the partner's limited time and energy, proposes a short nearby walk conditionally, and leaves the timing open.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "negotiate" },
          { feature: "ask", canonicalSkillId: "negotiate" }
        ],
        authorRationale: {
          natural: "The conditional wording responds to the partner's stated busy period and limited energy without presuming they cannot walk.",
          continuation: "The partner can respond to an invitation that is explicitly contingent on convenience.",
          register_context_fit: "The softened invitation is appropriate for people who have just met."
        }
      }),
      hobbyBinding({
        stepId: "hobbies-long-close-response",
        responseExampleId: "hobbies-long-close-next-time",
        branchId: "hobbies-long-close",
        responseJapanese: "そうですね、予定が見えてからで大丈夫です。またこの会でお会いしたときに、もしお互い余裕があれば散歩のお話をしましょう。今日はお話しできてよかったです。",
        situation: "The partner appreciates the idea but indirectly says their schedule is uncertain and suggests talking again at another gathering.",
        relationship: newlyMetPeer,
        discourse: "The learner accepts postponing plans and closes the conversation warmly without asking for a commitment.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "exit" },
          { feature: "add", canonicalSkillId: "exit" }
        ],
        authorRationale: {
          natural: "The learner accepts the partner's uncertain schedule and leaves a future conversation available without pressure.",
          continuation: "The learner positively leaves room to resume the topic at another gathering.",
          register_context_fit: "The considerate close respects that the two people have only just met."
        }
      }),
      hobbyBinding({
        stepId: "hobbies-long-close-response",
        responseExampleId: "hobbies-long-close-event",
        branchId: "hobbies-long-close",
        responseJapanese: "もちろんです。予定が分からないうちは無理に決めず、またこの会でお会いしたときにお話ししましょう。今日はお話しできてよかったです。",
        situation: "The partner appreciates the idea but indirectly says their schedule is uncertain and suggests talking again at another gathering.",
        relationship: newlyMetPeer,
        discourse: "The learner follows the partner's suggestion to revisit the idea later and ends the first conversation naturally.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "exit" },
          { feature: "add", canonicalSkillId: "exit" }
        ],
        authorRationale: {
          natural: "The learner accepts the uncertain timing instead of pushing for a separate meeting.",
          continuation: "The response leaves room to resume the topic at the next gathering.",
          register_context_fit: "The polite wording is warm without implying a closer relationship."
        }
      })
    ]
  }
];
