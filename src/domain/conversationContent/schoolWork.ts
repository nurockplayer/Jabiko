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

import { schoolWorkProjectStory } from "./schoolWorkProjectStory";
function learnerText(textZh: string, ja: string, en: string): ConversationLearnerText {
  return { textZh, textI18n: { ja, en } };
}

interface SchoolWorkBindingInput {
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

function schoolWorkBinding(input: SchoolWorkBindingInput): ConversationSessionResponseBinding {
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

export const schoolWorkConversationDefinitions: readonly ConversationSessionDefinition[] = [
  {
    scenario: {
      id: "schoolwork-short-busy-week",
      topic: "school and part-time work",
      world: "conversation after class",
      situation: learnerText(
        "下課後，你和常聊天的同學一起走出教室。對方提到最近課業和打工都很忙，你想先表示理解，不急著給建議。",
        "授業のあと、よく話すクラスメートと教室を出るところです。相手は最近、授業とアルバイトで忙しいと話しています。すぐに助言せず、まず気持ちを受け止めましょう。",
        "After class, you are leaving with a classmate you often talk with. They mention that school and their part-time job have both been busy; acknowledge them without jumping to advice."
      ),
      relationship: {
        learnerRole: "student and classmate",
        partnerRole: "student with a part-time job",
        context: learnerText(
          "年齡相仿、平常會輕鬆聊天的同學。使用親切自然的です・ます語氣。",
          "年齢の近いクラスメートで、普段から気軽に話します。親しみのある自然な「です・ます」で話します。",
          "You are classmates of a similar age who chat casually. Use friendly, natural polite Japanese."
        )
      },
      length: "short",
      primarySkills: ["react"],
      difficulty: {
        linguisticComplexity: "basic",
        partnerSupport: "supportive",
        relationshipDistance: "familiar",
        topicDepth: "personal",
        interactionPressure: "low"
      },
      objective: learnerText(
        "用簡短、體貼的方式回應同學最近很忙的狀況，讓對方感到被理解，也留一點空間讓對方自行決定是否多說。不要急著替對方安排做法。",
        "最近忙しいという相手の話に、短く思いやりをもって反応しましょう。理解を示し、相手が話を続けたければ話せる余地を残します。助言を急ぐ必要はありません。",
        "Respond briefly and considerately to your classmate's busy week. Show understanding and leave room for them to say more if they choose; you do not need to suggest what they should do."
      ),
      instruction: learnerText(
        "挑一句符合你平常說話方式的回應即可；不必追問或提出解決方法。",
        "普段の自分らしい返事を一つ選びましょう。質問を重ねたり、解決策を提案したりする必要はありません。",
        "Choose one response that sounds like you. You do not need to ask more questions or propose a solution."
      ),
      startStepId: "schoolwork-short-busy-opening",
      steps: [
        {
          id: "schoolwork-short-busy-opening",
          kind: "partner_line",
          japanese: "今週は授業とアルバイトが重なって、少し忙しいんです。",
          nextStepId: "schoolwork-short-busy-response"
        },
        {
          id: "schoolwork-short-busy-response",
          kind: "learner_response",
          prompt: learnerText(
            "先表示理解和關心即可，不用立刻給建議。",
            "すぐに助言せず、まず理解や気遣いを伝えましょう。",
            "Show understanding and care without jumping to advice."
          ),
          responseExamples: [
            {
              id: "schoolwork-short-busy-empathy",
              kind: "suggested",
              japanese: "それは大変ですね。授業とアルバイトが続くと、ゆっくりできる時間も少なそうですね。",
              explanation: learnerText(
                "先同理課業與打工並行的辛苦，再提到可能較少有空休息，讓對方可以自行補充近況。",
                "授業とアルバイトを両立する大変さに共感し、休む時間も少なそうだと気遣っています。相手が詳しく話す余地を残し、助言はしていません。",
                "You empathize with the effort of balancing classes and work and show concern about having little time to rest, leaving room for the classmate to elaborate without giving advice."
              )
            },
            {
              id: "schoolwork-short-busy-understanding",
              kind: "accepted",
              japanese: "授業とアルバイトを両立しているんですね。忙しくなるのも無理ないですよ。",
              explanation: learnerText(
                "肯定課業與打工同時進行確實忙碌，讓對方感受到理解，也可自行決定是否多說。",
                "授業とアルバイトの両立が忙しいのは自然だと受け止めています。理解を示す返事なので、相手が望めば話を続けられます。",
                "You validate that balancing classes and work is demanding, showing understanding while letting the classmate decide whether to say more."
              )
            },
            {
              id: "schoolwork-short-busy-week-observation",
              kind: "accepted",
              japanese: "今週は予定が詰まっているんですね。毎日あっという間に過ぎそうですね。",
              explanation: learnerText(
                "留意到對方本週行程緊湊，輕輕回應這種忙碌可能讓每天一下子就過去，留下分享細節的空間。",
                "今週の予定が詰まっていることを受け止め、毎日があっという間に過ぎそうだと共感しています。相手が望めば近況を付け加えられる返事です。",
                "You notice that their week is packed and empathize that the days may fly by, leaving room for them to share more if they choose."
              )
            }
          ],
          branches: [{ id: "schoolwork-short-busy-finish", nextStepId: "schoolwork-short-busy-complete" }]
        },
        {
          id: "schoolwork-short-busy-complete",
          kind: "completion",
          summary: learnerText(
            "你先體貼地回應同學的忙碌，讓對方感到被理解，沒有急著給出未受邀的建議。",
            "相手の忙しさを思いやりをもって受け止め、求められていない助言を急がずに理解を示しました。",
            "You responded with care and showed understanding without rushing into advice the classmate did not ask for."
          )
        }
      ]
    },
    responses: [
      schoolWorkBinding({
        stepId: "schoolwork-short-busy-response",
        responseExampleId: "schoolwork-short-busy-empathy",
        branchId: "schoolwork-short-busy-finish",
        responseJapanese: "それは大変ですね。授業とアルバイトが続くと、ゆっくりできる時間も少なそうですね。",
        situation: "A classmate says classes and a part-time job overlap this week and feel busy.",
        relationship: "Classmates of similar age who chat casually; friendly polite Japanese fits.",
        discourse: "The learner empathizes with balancing classes and work and shows concern about limited time to rest, leaving room for the classmate to elaborate.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "answer", canonicalSkillId: "react" }],
        authorRationale: {
          natural: "The acknowledgement and short reflection are idiomatic in a familiar classmate conversation.",
          continuation: "The empathic observation leaves room for the classmate to add more about their schedule if they wish; no question is required.",
          register_context_fit: "The polite, warm wording suits classmates who are on friendly terms."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-short-busy-response",
        responseExampleId: "schoolwork-short-busy-understanding",
        branchId: "schoolwork-short-busy-finish",
        responseJapanese: "授業とアルバイトを両立しているんですね。忙しくなるのも無理ないですよ。",
        situation: "A classmate says classes and a part-time job overlap this week and feel busy.",
        relationship: "Classmates of similar age who chat casually; friendly polite Japanese fits.",
        discourse: "The learner validates that balancing school and work feels busy, showing understanding while leaving the classmate room to continue.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "answer", canonicalSkillId: "react" }],
        authorRationale: {
          natural: "A brief validation that balancing both commitments is demanding sounds natural between familiar classmates.",
          continuation: "The validation shows understanding and leaves the classmate room to add more; the learner does not need to ask a follow-up.",
          register_context_fit: "The familiar but polite register matches the classmates' relationship."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-short-busy-response",
        responseExampleId: "schoolwork-short-busy-week-observation",
        branchId: "schoolwork-short-busy-finish",
        responseJapanese: "今週は予定が詰まっているんですね。毎日あっという間に過ぎそうですね。",
        situation: "A classmate says classes and a part-time job overlap this week and feel busy.",
        relationship: "Classmates of similar age who chat casually; friendly polite Japanese fits.",
        discourse: "The learner empathizes with the pace of a packed week, leaving the classmate room to add details if they want.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [{ feature: "answer", canonicalSkillId: "react" }],
        authorRationale: {
          natural: "The brief observation is a natural response to hearing that a classmate has been busy.",
          continuation: "The observation leaves room for the classmate to elaborate on their week without requiring a question.",
          register_context_fit: "The tone is warm without presuming an unusually close relationship."
        }
      })
    ]
  },
  {
    scenario: {
      id: "schoolwork-medium-report-week",
      topic: "school workload",
      world: "chatting after a seminar",
      situation: learnerText(
        "研討課結束後，你和熟識的同學聊到報告期限。你也有作業要完成，想分享自己的近況，並把話題自然交還給對方。",
        "ゼミのあと、よく話すクラスメートとレポートの締め切りについて話しています。自分にも課題があり、近況を伝えながら自然に相手へ話題を返したい場面です。",
        "After a seminar, you talk with a familiar classmate about report deadlines. You also have coursework to finish and want to share your situation while naturally returning the conversation to them."
      ),
      relationship: {
        learnerRole: "student and seminar classmate",
        partnerRole: "student working on reports",
        context: learnerText(
          "同一研討課的同學，常一起討論課業，但私下不是很親密。用親切的です・ます語氣。",
          "同じゼミのクラスメートで、課題についてよく話しますが、特別に親しいわけではありません。親しみのある「です・ます」で話します。",
          "You are classmates in the same seminar and often discuss coursework, but are not especially close outside class. Use friendly polite Japanese."
        )
      },
      length: "medium",
      primarySkills: ["share", "bounce", "expand"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "balanced",
        relationshipDistance: "neutral",
        topicDepth: "personal",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "沿著報告和期限這一條課業話題，分享自己正在做的事，再用自然的問題了解對方的進度和週末安排，把話題交還給對方。",
        "レポートの締め切りという話題を続け、自分の課題について話したあと、自然な質問で相手の進み具合や週末の予定を聞き、話題を相手に返しましょう。",
        "Sustain one thread about reports and deadlines: share what you are working on, ask natural questions about the partner's progress and weekend plans, and return the ball to them."
      ),
      instruction: learnerText(
        "先分享一件自己正在完成的課業，並問對方報告進度。聽到對方的回答後，再補充一點自己的經驗，並把話題交回給對方。",
        "まず自分が取り組んでいる課題を一つ話し、相手のレポートの進み具合を聞きましょう。返事を聞いたら、自分の経験を少し加えて、もう一度相手に話題を返します。",
        "Share one piece of coursework you are handling and ask how the partner's report is going. Respond to their answer with a related detail, then return the topic to them."
      ),
      startStepId: "schoolwork-medium-report-opening",
      steps: [
        {
          id: "schoolwork-medium-report-opening",
          kind: "partner_line",
          japanese: "今週はレポートの締め切りが二つ重なっていて、少し忙しいです。",
          nextStepId: "schoolwork-medium-report-response"
        },
        {
          id: "schoolwork-medium-report-response",
          kind: "learner_response",
          prompt: learnerText(
            "回應同學的忙碌，分享一項自己也在處理的課業，再自然地問問對方的進度。",
            "相手の忙しさに応じ、自分も取り組んでいる課題を一つ話してから、自然に進み具合を聞きましょう。",
            "Respond to the busy week, share one assignment you are also handling, then naturally ask about their progress."
          ),
          responseExamples: [
            {
              id: "schoolwork-medium-report-presentation",
              kind: "suggested",
              japanese: "私も今週は発表の準備があって、少し慌ただしいです。レポートはどのくらい進みましたか？",
              explanation: learnerText(
                "分享自己的課業近況，再以一個簡單問題邀請對方說說進度，沒有把談話變成連續盤問。",
                "自分の課題について話してから、質問を一つ添えて相手の進み具合を聞いています。質問を重ねてはいません。",
                "You share your own workload and ask one simple question about their progress without turning the exchange into an interview."
              )
            },
            {
              id: "schoolwork-medium-report-seminar",
              kind: "accepted",
              japanese: "締め切りが続くと落ち着かないですよね。私は今週、ゼミの資料をまとめています。レポートは今、どのくらい進んでいますか？",
              explanation: learnerText(
                "先回應期限重疊的壓力，再分享自己的課業，接著詢問報告目前的進度，讓同學能自然地說明做到哪裡。",
                "締め切りが続く大変さに触れ、自分の課題も共有してから、レポートの現在の進み具合を聞いています。",
                "You acknowledge overlapping deadlines, share your own work, and ask how far the classmate has progressed on the report."
              )
            }
          ],
          branches: [{ id: "schoolwork-medium-report-to-progress", nextStepId: "schoolwork-medium-report-progress" }]
        },
        {
          id: "schoolwork-medium-report-progress",
          kind: "partner_line",
          japanese: "まだ資料を集めているところです。週末に少し進めようと思います。",
          nextStepId: "schoolwork-medium-weekend-response"
        },
        {
          id: "schoolwork-medium-weekend-response",
          kind: "learner_response",
          prompt: learnerText(
            "接住對方目前還在找資料、週末打算繼續的回答，分享一點相近經驗，再問一個與週末安排相關的問題。",
            "資料を集めていて週末に進めるという返事を受け、自分の似た経験を少し話してから、週末の過ごし方を一つ聞きましょう。",
            "The partner is still gathering sources and plans to continue working on the report over the weekend. Share a related experience, then ask one question about the plan."
          ),
          responseExamples: [
            {
              id: "schoolwork-medium-weekend-library",
              kind: "suggested",
              japanese: "資料を集めるところが大変ですよね。私も課題の時は、必要なものを先に整理しています。週末は図書館で進める予定ですか？",
              explanation: learnerText(
                "理解對方目前的進度，分享自己整理資料的習慣，再問一個具體但不強迫的週末問題。",
                "相手の進み具合に理解を示し、自分のやり方も話してから、答えやすい週末の質問をしています。",
                "You acknowledge their progress, share your own approach, then ask an easy, specific question about the weekend."
              )
            },
            {
              id: "schoolwork-medium-weekend-rest",
              kind: "accepted",
              japanese: "週末に少し進めるんですね。私も締め切り前は家で作業することがあります。土日のどちらかは休めそうですか？",
              explanation: learnerText(
                "承接對方的安排並分享自己的類似經驗，最後關心對方是否能留一點休息時間。",
                "相手の予定を受け止めて自分の経験を加え、週末に休める時間があるかを尋ねています。",
                "You acknowledge the plan, add a related experience, and ask whether they might have time to rest."
              )
            }
          ],
          branches: [{ id: "schoolwork-medium-weekend-finish", nextStepId: "schoolwork-medium-weekend-plan" }]
        },
        {
          id: "schoolwork-medium-weekend-plan",
          kind: "partner_line",
          japanese: "土曜は図書館で少し進めて、日曜は気分転換に近所を歩こうと思います。",
          nextStepId: "schoolwork-medium-complete"
        },
        {
          id: "schoolwork-medium-complete",
          kind: "completion",
          summary: learnerText(
            "你分享了自己的課業近況，了解同學報告的進度和週末計畫，讓課業話題保持自然的來回。",
            "自分の課題について話し、相手のレポートの進み具合や週末の予定を聞いて、課題の話題を自然に行き来させました。",
            "You shared your coursework, learned about the partner's report progress and weekend plans, and kept the schoolwork thread reciprocal."
          )
        }
      ]
    },
    responses: [
      schoolWorkBinding({
        stepId: "schoolwork-medium-report-response",
        responseExampleId: "schoolwork-medium-report-presentation",
        branchId: "schoolwork-medium-report-to-progress",
        responseJapanese: "私も今週は発表の準備があって、少し慌ただしいです。レポートはどのくらい進みましたか？",
        situation: "A familiar seminar classmate has two reports due this week; the learner also has coursework.",
        relationship: "Seminar classmates who often discuss coursework but are not close friends; friendly polite Japanese fits.",
        discourse: "The learner shares their own workload and asks one open progress question.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "A brief personal update followed by one relevant question fits this peer conversation.",
          continuation: "The partner can say where they are in the report without needing to defend their workload.",
          register_context_fit: "The sentence endings are friendly but still polite for seminar classmates."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-medium-report-response",
        responseExampleId: "schoolwork-medium-report-seminar",
        branchId: "schoolwork-medium-report-to-progress",
        responseJapanese: "締め切りが続くと落ち着かないですよね。私は今週、ゼミの資料をまとめています。レポートは今、どのくらい進んでいますか？",
        situation: "A familiar seminar classmate has two reports due this week; the learner also has coursework.",
        relationship: "Seminar classmates who often discuss coursework but are not close friends; friendly polite Japanese fits.",
        discourse: "The learner empathizes, shares a current assignment, and asks how far the partner has progressed on the report.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "expand" }
        ],
        authorRationale: {
          natural: "The empathy and personal detail lead naturally into a single progress question.",
          continuation: "The question invites a description of the current work stage.",
          register_context_fit: "The polite question and acknowledgement suit classmates who know each other through seminar."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-medium-weekend-response",
        responseExampleId: "schoolwork-medium-weekend-library",
        branchId: "schoolwork-medium-weekend-finish",
        responseJapanese: "資料を集めるところが大変ですよね。私も課題の時は、必要なものを先に整理しています。週末は図書館で進める予定ですか？",
        situation: "The classmate is still gathering sources and plans to continue working on the report over the weekend.",
        relationship: "Seminar classmates who often discuss coursework but are not close friends; friendly polite Japanese fits.",
        discourse: "The learner acknowledges the current research stage, shares a related habit, and asks whether the classmate will work at the library over the weekend.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The response acknowledges the partner's stage before adding a comparable routine.",
          continuation: "The question follows from the partner's weekend work plan and returns conversational responsibility.",
          register_context_fit: "The learner asks rather than directing how the classmate should work."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-medium-weekend-response",
        responseExampleId: "schoolwork-medium-weekend-rest",
        branchId: "schoolwork-medium-weekend-finish",
        responseJapanese: "週末に少し進めるんですね。私も締め切り前は家で作業することがあります。土日のどちらかは休めそうですか？",
        situation: "The classmate is still gathering sources and plans to continue working on the report over the weekend.",
        relationship: "Seminar classmates who often discuss coursework but are not close friends; friendly polite Japanese fits.",
        discourse: "The learner acknowledges the weekend plan, shares a similar experience, and asks whether the classmate can leave time to rest.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The response follows the weekend plan and shows personal interest without becoming an interview.",
          continuation: "The partner can answer about rest or add how they plan to spend the weekend.",
          register_context_fit: "The question is considerate and appropriate between seminar classmates."
        }
      })
    ]
  },
  schoolWorkProjectStory
];
