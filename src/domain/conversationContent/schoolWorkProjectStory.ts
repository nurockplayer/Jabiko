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

export const schoolWorkProjectStory: ConversationSessionDefinition = {
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
  };
