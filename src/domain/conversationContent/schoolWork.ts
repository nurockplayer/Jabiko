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
  {
    scenario: {
      id: "schoolwork-long-first-project-story",
      topic: "workload and switching off after work",
      world: "talking with a senior coworker at the end of the day",
      situation: learnerText(
        "下班前，你和一位熟悉的前輩聊到上週第一次獨自負責企劃資料的經驗。你想按順序說明忙碌的過程，再自然轉到下班後如何轉換心情，最後有禮貌地結束交談。",
        "退勤前、親しくしている先輩と、先週初めて一人で担当した企画資料のことを話します。忙しかった経験を順序立てて伝え、仕事のあとに気持ちを切り替える話題へ自然につなぎ、最後は丁寧に会話を終えましょう。",
        "Before leaving work, you talk with a senior coworker you know well about the first project materials you handled alone last week. Tell the busy experience in sequence, transition naturally to how you switch off after work, then close politely."
      ),
      relationship: {
        learnerRole: "junior coworker",
        partnerRole: "senior coworker",
        context: learnerText(
          "同一團隊的前輩，平常相處親切，也曾在工作上提供協助。說明經驗和道謝時維持尊重的です・ます語氣。",
          "同じチームの先輩で、普段は親しく話し、仕事でも助けてもらったことがあります。経験を話すときも、お礼を言うときも、敬意のある「です・ます」で話します。",
          "Your senior coworker is friendly and has helped you at work. Keep respectful polite Japanese when describing the experience and thanking them."
        )
      },
      length: "long",
      primarySkills: ["narrate", "transition", "exit", "register_adapt"],
      difficulty: {
        linguisticComplexity: "intermediate",
        partnerSupport: "supportive",
        relationshipDistance: "neutral",
        topicDepth: "personal",
        interactionPressure: "normal"
      },
      objective: learnerText(
        "有順序地敘述一次忙碌的工作經驗，接著把話題轉到下班後的轉換方式，回應前輩的經驗並自然收尾。",
        "忙しかった仕事の経験を順序立てて話し、退勤後の切り替え方へ話題を移します。先輩の経験にも応じ、丁寧に会話を締めくくりましょう。",
        "Narrate a busy work experience in sequence, transition to how you switch off after work, respond to your senior's experience, and close naturally."
      ),
      instruction: learnerText(
        "先說明一開始遇到的困難、後來怎麼處理，以及最後的結果。前輩問到轉換心情時，再分享自己的習慣並問問對方；最後用尊重的語氣道謝或告別。",
        "最初の難しさ、どう対処したか、最後にどうなったかを伝えましょう。気持ちの切り替えについて聞かれたら、自分の習慣を話して先輩にも聞き、最後は敬意を込めてお礼や挨拶をします。",
        "Describe the initial difficulty, how you handled it, and the outcome. When your senior asks how you switch off, share your routine and ask about theirs; then thank them or say goodbye respectfully."
      ),
      startStepId: "schoolwork-long-project-opening",
      steps: [
        {
          id: "schoolwork-long-project-opening",
          kind: "partner_line",
          japanese: "この前の企画資料、締め切りぎりぎりでしたよね。初めて一人で担当してみて、どうでしたか？",
          nextStepId: "schoolwork-long-project-story"
        },
        {
          id: "schoolwork-long-project-story",
          kind: "learner_response",
          prompt: learnerText(
            "請依序說明一開始遇到的困難、途中採取的做法，以及最後的結果。",
            "最初に困ったこと、途中で取った行動、最後の結果が分かるように、経験を順番に話しましょう。",
            "Tell the experience in sequence so the initial difficulty, what you did, and the outcome are clear."
          ),
          responseExamples: [
            {
              id: "schoolwork-long-project-story-checkin",
              kind: "suggested",
              japanese: "最初は何から始めるか迷いましたが、早めに先輩に確認しながら進めました。前日に資料がまとまり、当日は無事に説明できてほっとしました。",
              explanation: learnerText(
                "先交代一開始的困難，再說明如何及早確認、完成資料，最後交代說明順利結束，敘事脈絡清楚。",
                "最初の迷いから、先輩に確認して資料をまとめ、当日の説明を終えるまでを順序立てて話しています。",
                "You sequence the initial uncertainty, checking with your senior, finishing the materials, and completing the presentation."
              )
            },
            {
              id: "schoolwork-long-project-story-structure",
              kind: "accepted",
              japanese: "初日は構成に悩みました。必要な情報を整理してから早めに先輩に見てもらい、締め切り前日に仕上げられました。当日の説明も無事に終わって安心しました。",
              explanation: learnerText(
                "用初日、期限前一天和當天交代事件順序，並說明整理資料和請前輩確認的過程。",
                "初日の悩み、締め切り前日の完成、当日の説明という流れがあり、資料を整えた過程も伝わります。",
                "You give a clear sequence from the first day's difficulty to finishing the day before and completing the explanation."
              )
            }
          ],
          branches: [{ id: "schoolwork-long-project-to-switching-off", nextStepId: "schoolwork-long-switching-off-partner" }]
        },
        {
          id: "schoolwork-long-switching-off-partner",
          kind: "partner_line",
          japanese: "早めに相談して、最後まで進められたんですね。忙しい時は仕事のあとも気が張ることがありますが、何か気分転換していますか？",
          nextStepId: "schoolwork-long-switching-off-response"
        },
        {
          id: "schoolwork-long-switching-off-response",
          kind: "learner_response",
          prompt: learnerText(
            "分享一個下班後切換心情的習慣，再詢問前輩忙碌時如何安排，讓工作經驗自然轉到個人做法。",
            "退勤後の気分転換の習慣を一つ話し、忙しいときに先輩がどうしているかも聞いてみましょう。仕事の経験から、自然に自分たちの工夫へ話題を移します。",
            "Share one way you switch off after work, then ask how your senior handles busy periods to transition naturally from the work story to personal routines."
          ),
          responseExamples: [
            {
              id: "schoolwork-long-switching-off-walk",
              kind: "suggested",
              japanese: "仕事のあと、駅まで少し歩くと気持ちが切り替わります。企画資料が終わった日も、一駅分歩いて帰りました。先輩は忙しい時、どうやって切り替えていますか？",
              explanation: learnerText(
                "分享散步如何幫助自己切換心情，也連回剛才的企劃經驗，最後自然詢問前輩的做法。",
                "散歩で気持ちを切り替える方法を話し、企画資料の経験にも触れてから、先輩のやり方を聞いています。",
                "You explain how a walk helps you switch off, connect it to the project, and ask how your senior handles busy periods."
              )
            },
            {
              id: "schoolwork-long-switching-off-notes",
              kind: "accepted",
              japanese: "私は帰る前に翌日の予定を簡単にメモすると落ち着きます。先週も優先することを書いてから帰りました。先輩は仕事のあと、何か気分転換されていますか？",
              explanation: learnerText(
                "分享一個自己實際用過的整理習慣，再詢問前輩下班後的轉換方式，語氣尊重而自然。",
                "帰る前に予定を整理する自分の習慣を、先週の経験とともに伝え、先輩にも丁寧に尋ねています。",
                "You share a practical planning habit from last week, then respectfully ask your senior about their own after-work routine."
              )
            }
          ],
          branches: [{ id: "schoolwork-long-switching-off-to-close", nextStepId: "schoolwork-long-senior-routine" }]
        },
        {
          id: "schoolwork-long-senior-routine",
          kind: "partner_line",
          japanese: "私は帰る前に翌日の優先順位を三つだけメモします。そのあと駅まで少し歩くと、仕事のことを引きずりにくいです。",
          nextStepId: "schoolwork-long-close-response"
        },
        {
          id: "schoolwork-long-close-response",
          kind: "learner_response",
          prompt: learnerText(
            "回應前輩分享的方法，可以說明自己想試試看，最後用得體的話道謝或結束交談。",
            "先輩の方法に反応し、試してみたい場合はその気持ちを伝えましょう。そうでなければ、お礼や挨拶で丁寧に会話を締めくくります。",
            "Respond to your senior's routine. If you would like to try the approach, mention that; otherwise, close politely with thanks or a goodbye."
          ),
          responseExamples: [
            {
              id: "schoolwork-long-close-try-walk",
              kind: "suggested",
              japanese: "優先順位を決めてから歩くんですね。私も今日は帰る前に試してみます。教えていただいて、ありがとうございました。",
              explanation: learnerText(
                "先回應前輩的方法，再說自己想試試看，最後有禮貌地道謝，讓長對話自然結束。",
                "先輩の方法を受け止め、自分も試すと伝えてから、お礼を言って自然に会話を終えています。",
                "You respond to the routine, say you will try it, and thank your senior to close the longer exchange naturally."
              )
            },
            {
              id: "schoolwork-long-close-thanks",
              kind: "accepted",
              japanese: "メモと短い散歩の組み合わせ、よさそうですね。お話を聞けてよかったです。それでは、今日はこのあたりで失礼します。",
              explanation: learnerText(
                "簡短回應前輩的經驗並表達感謝，接著用尊重的告別語收尾，符合下班前與前輩交談的關係。",
                "先輩の経験に短く反応して感謝を伝え、丁寧な挨拶で締めています。退勤前の会話に合う終わり方です。",
                "You briefly acknowledge your senior's experience, express thanks, and use a respectful goodbye appropriate at the end of the workday."
              )
            }
          ],
          branches: [{ id: "schoolwork-long-close-finish", nextStepId: "schoolwork-long-complete" }]
        },
        {
          id: "schoolwork-long-complete",
          kind: "completion",
          summary: learnerText(
            "你按順序分享了一次忙碌的工作經驗，轉到下班後的習慣，回應前輩的做法並有禮貌地結束交談。",
            "忙しかった仕事の経験を順序立てて話し、退勤後の習慣へ話題を移しました。先輩の工夫にも応じ、丁寧に会話を終えました。",
            "You narrated a busy work experience, transitioned to after-work routines, responded to your senior, and closed politely."
          )
        }
      ]
    },
    responses: [
      schoolWorkBinding({
        stepId: "schoolwork-long-project-story",
        responseExampleId: "schoolwork-long-project-story-checkin",
        branchId: "schoolwork-long-project-to-switching-off",
        responseJapanese: "最初は何から始めるか迷いましたが、早めに先輩に確認しながら進めました。前日に資料がまとまり、当日は無事に説明できてほっとしました。",
        situation: "A senior coworker asks how the learner felt handling project materials alone for the first time.",
        relationship: "A friendly senior coworker has helped the learner before; respectful polite Japanese fits.",
        discourse: "The learner recounts the initial uncertainty, checking in with the senior, finishing the materials, and completing the explanation.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "narrate" },
          { feature: "add", canonicalSkillId: "narrate" }
        ],
        authorRationale: {
          natural: "The sequence uses ordinary spoken phrasing and an appropriate modest tone for a junior coworker.",
          continuation: "The partner can respond to the process and then smoothly ask about the learner's after-work routine.",
          register_context_fit: "The learner speaks respectfully about asking a senior for confirmation."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-long-project-story",
        responseExampleId: "schoolwork-long-project-story-structure",
        branchId: "schoolwork-long-project-to-switching-off",
        responseJapanese: "初日は構成に悩みました。必要な情報を整理してから早めに先輩に見てもらい、締め切り前日に仕上げられました。当日の説明も無事に終わって安心しました。",
        situation: "A senior coworker asks how the learner felt handling project materials alone for the first time.",
        relationship: "A friendly senior coworker has helped the learner before; respectful polite Japanese fits.",
        discourse: "The learner narrates the first-day difficulty, preparation with the senior, and the completed explanation.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "narrate" },
          { feature: "add", canonicalSkillId: "narrate" }
        ],
        authorRationale: {
          natural: "The narration is specific and appropriately modest rather than boasting about the result.",
          continuation: "The partner can acknowledge the preparation and continue into the after-work topic.",
          register_context_fit: "The account recognizes the senior's review and maintains respectful politeness."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-long-switching-off-response",
        responseExampleId: "schoolwork-long-switching-off-walk",
        branchId: "schoolwork-long-switching-off-to-close",
        responseJapanese: "仕事のあと、駅まで少し歩くと気持ちが切り替わります。企画資料が終わった日も、一駅分歩いて帰りました。先輩は忙しい時、どうやって切り替えていますか？",
        situation: "After hearing the project story, the senior asks what the learner does to switch off after work.",
        relationship: "A friendly senior coworker has helped the learner before; respectful polite Japanese fits.",
        discourse: "The learner shares a specific walk connected to the project week and asks the senior about their routine.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "narrate" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The specific example ties the recovery habit to the just-told busy week.",
          continuation: "The reciprocal question gives the senior an easy next turn about their own routine.",
          register_context_fit: "The learner asks respectfully without making the exchange overly formal."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-long-switching-off-response",
        responseExampleId: "schoolwork-long-switching-off-notes",
        branchId: "schoolwork-long-switching-off-to-close",
        responseJapanese: "私は帰る前に翌日の予定を簡単にメモすると落ち着きます。先週も優先することを書いてから帰りました。先輩は仕事のあと、何か気分転換されていますか？",
        situation: "After hearing the project story, the senior asks what the learner does to switch off after work.",
        relationship: "A friendly senior coworker has helped the learner before; respectful polite Japanese fits.",
        discourse: "The learner shares a planning habit used during the project week and asks how the senior unwinds.",
        languageQuality: "natural",
        continuation: "enriches_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "share" },
          { feature: "add", canonicalSkillId: "narrate" },
          { feature: "ask", canonicalSkillId: "bounce" }
        ],
        authorRationale: {
          natural: "The learner describes a concrete personal routine before asking the senior in a polite way.",
          continuation: "The question invites the senior to describe any way they switch off after work.",
          register_context_fit: "The honorific question is appropriately respectful toward the senior coworker."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-long-close-response",
        responseExampleId: "schoolwork-long-close-try-walk",
        branchId: "schoolwork-long-close-finish",
        responseJapanese: "優先順位を決めてから歩くんですね。私も今日は帰る前に試してみます。教えていただいて、ありがとうございました。",
        situation: "The senior shares that they note three priorities and take a short walk after work.",
        relationship: "A friendly senior coworker has helped the learner before; respectful polite Japanese fits.",
        discourse: "The learner acknowledges the routine, says they may try it, and thanks the senior to close.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "share" }
        ],
        authorRationale: {
          natural: "The acknowledgment and thanks are natural responses to advice from a supportive senior.",
          continuation: "The response closes this exchange warmly while leaving future conversation welcome.",
          register_context_fit: "いただいて and ありがとうございました show suitable respect without sounding distant."
        }
      }),
      schoolWorkBinding({
        stepId: "schoolwork-long-close-response",
        responseExampleId: "schoolwork-long-close-thanks",
        branchId: "schoolwork-long-close-finish",
        responseJapanese: "メモと短い散歩の組み合わせ、よさそうですね。お話を聞けてよかったです。それでは、今日はこのあたりで失礼します。",
        situation: "The senior shares that they note three priorities and take a short walk after work.",
        relationship: "A friendly senior coworker has helped the learner before; respectful polite Japanese fits.",
        discourse: "The learner acknowledges both parts of the routine, expresses appreciation, and politely ends the conversation.",
        languageQuality: "natural",
        continuation: "opens_thread",
        registerContextFit: "fits",
        composition: [
          { feature: "answer", canonicalSkillId: "react" },
          { feature: "add", canonicalSkillId: "exit" }
        ],
        authorRationale: {
          natural: "The brief evaluation, appreciation, and exit formula form a natural closing sequence.",
          continuation: "The learner closes the current talk without implying that future conversation is unwelcome.",
          register_context_fit: "The polite exit phrase is suitable for a junior coworker leaving a senior's conversation."
        }
      })
    ]
  }
];
