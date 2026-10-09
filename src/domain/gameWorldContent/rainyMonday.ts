import type { ConversationSessionDefinition } from "../conversationSession";
import type { ConversationLearnerText } from "../conversationScenario";
import type { GameWorldDefinition } from "../gameWorld";
import { commuteTrainBicycle } from "../conversationContent/commuteTrainBicycle";
import { foodDailySpecial } from "../conversationContent/foodDailySpecial";
import { schoolWorkProjectStory } from "../conversationContent/schoolWorkProjectStory";
import { weekendShortMoviePlans } from "../conversationContent/weekendShortMoviePlans";

function learnerText(textZh: string, ja: string, en: string): ConversationLearnerText {
  return { textZh, textI18n: { ja, en } };
}

function bridgeDefinition({
  id,
  topic,
  situation,
  instruction,
  partnerLine,
  prompt,
  responses,
  summary,
  secondPartnerLine,
  secondPrompt,
  secondResponses
}: {
  id: string;
  topic: string;
  situation: ConversationLearnerText;
  instruction: ConversationLearnerText;
  partnerLine: string;
  prompt: ConversationLearnerText;
  responses: readonly {
    id: string;
    japanese: string;
    explanation: ConversationLearnerText;
    continuation: "opens_thread" | "enriches_thread";
    rationale: string;
    composition: readonly { feature: "answer" | "add" | "ask"; canonicalSkillId: "react" | "share" | "expand" | "bounce" }[];
    turn?: 1 | 2;
  }[];
  summary: ConversationLearnerText;
  secondPartnerLine?: string;
  secondPrompt?: ConversationLearnerText;
  secondResponses?: readonly {
    id: string;
    japanese: string;
    explanation: ConversationLearnerText;
    continuation: "opens_thread" | "enriches_thread";
    rationale: string;
    composition: readonly { feature: "answer" | "add" | "ask"; canonicalSkillId: "react" | "share" | "expand" | "bounce" }[];
    turn: 2;
  }[];
}): ConversationSessionDefinition {
  const scenarioId = id;
  const responseStepId = `${id}-response`;
  const followupOpeningId = `${id}-followup-opening`;
  const followupResponseStepId = `${id}-followup-response`;
  const continueBranchId = `${id}-continue`;
  const finishBranchId = `${id}-finish`;
  const completionId = `${id}-complete`;
  const allResponses = [...responses, ...(secondResponses ?? [])];
  return {
    scenario: {
      id: scenarioId,
      topic,
      world: "Rainy Monday at a neighborhood office",
      situation,
      relationship: {
        learnerRole: "coworker",
        partnerRole: "coworker",
        context: learnerText(
          "你們是常聊天的同事，彼此熟悉；使用親切自然的有禮語氣。",
          "普段からよく話す同僚です。親しみのある自然な丁寧語で話します。",
          "You are coworkers who often talk. Use friendly, natural polite Japanese."
        )
      },
      length: id === "rainy-monday-covered-route" ? "medium" : "short",
      primarySkills: id === "rainy-monday-covered-route" ? ["share", "bounce"] : ["react", "share", "expand"],
      difficulty: {
        linguisticComplexity: id === "rainy-monday-covered-route" ? "intermediate" : "basic",
        partnerSupport: "supportive",
        relationshipDistance: "familiar",
        topicDepth: "concrete",
        interactionPressure: "low"
      },
      objective: learnerText(
        "回應雨天通勤的情況，分享一點自己的經驗，繼續和同事聊天。",
        "雨の日の通勤について、自分の経験を少し添えて同僚との会話を続けましょう。",
        "Acknowledge the rainy commute and add a little of your own experience to keep the coworker conversation going."
      ),
      instruction,
      startStepId: `${id}-opening`,
      steps: [
        { id: `${id}-opening`, kind: "partner_line", japanese: partnerLine, nextStepId: responseStepId },
        {
          id: responseStepId,
          kind: "learner_response",
          prompt,
          responseExamples: responses.map(({ id: responseId, japanese, explanation }) => ({
            id: responseId,
            kind: responseId.endsWith("-rich") ? "accepted" as const : "suggested" as const,
            japanese,
            explanation
          })),
          branches: [{ id: continueBranchId, nextStepId: secondPartnerLine ? followupOpeningId : completionId }]
        },
        ...(secondPartnerLine && secondPrompt && secondResponses ? [
          { id: followupOpeningId, kind: "partner_line" as const, japanese: secondPartnerLine, nextStepId: followupResponseStepId },
          {
            id: followupResponseStepId,
            kind: "learner_response" as const,
            prompt: secondPrompt,
            responseExamples: secondResponses.map(({ id: responseId, japanese, explanation }) => ({
              id: responseId,
              kind: responseId.endsWith("-rich") ? "accepted" as const : "suggested" as const,
              japanese,
              explanation
            })),
            branches: [{ id: finishBranchId, nextStepId: completionId }]
          }
        ] : []),
        { id: completionId, kind: "completion", summary }
      ]
    },
    responses: allResponses.map((response) => ({
      stepId: response.turn === 2 ? followupResponseStepId : responseStepId,
      responseExampleId: response.id,
      branchId: response.turn === 2 ? finishBranchId : continueBranchId,
      feedback: {
        id: `${response.id}-feedback`,
        responseJapanese: response.japanese,
        context: {
          situation: `A coworker makes a fixed comment about rain during ${topic}.`,
          relationship: "Familiar coworkers who use friendly polite Japanese.",
          discourse: "The learner responds to the comment and leaves room for a natural next turn."
        },
        feedback: {
          languageQuality: "natural" as const,
          continuation: response.continuation,
          registerContextFit: "fits" as const,
          composition: response.composition,
          authorRationale: { natural: response.rationale }
        }
      }
    }))
  };
}

const entry = bridgeDefinition({
  id: "rainy-monday-entry",
  topic: "a rainy Monday morning",
  situation: learnerText(
    "星期一早上，你在青葉站入口遇到熟悉的同事。雨勢比剛才大了一些，對方提起路上的積水。",
    "月曜日の朝、青葉駅の入口でよく話す同僚に会いました。さっきより雨が強くなり、道に水たまりができていると話しています。",
    "On Monday morning, you meet a familiar coworker at Aoba Station. The rain has grown heavier, and they mention puddles on the walk."
  ),
  instruction: learnerText(
    "先回應雨勢或路上的情況。簡短分享也可以；如果自然，再問一句同事的路況。",
    "雨や道の様子にまず反応しましょう。短い経験を添えてもかまいません。自然なら、相手の道の様子を一つ尋ねてみましょう。",
    "First respond to the rain or the walk. A brief personal detail is enough; ask about their route if it feels natural."
  ),
  partnerLine: "さっきより雨が強くなりましたね。駅までの道に水たまりができていました。",
  prompt: learnerText(
    "回應雨勢或路況，讓對話自然地繼續下去。",
    "雨や道の様子に返事をして、会話を続けましょう。",
    "Respond to the rain or the walk, and keep the conversation going."
  ),
  responses: [
    {
      id: "rainy-entry-short",
      japanese: "本当ですね。傘を持ってきてよかったです。",
      explanation: learnerText("簡短承接雨勢並分享自己的準備。", "雨に短く反応し、自分の準備を伝えています。", "A brief response to the rain with a small personal detail."),
      continuation: "opens_thread",
      rationale: "A concise, relevant reply acknowledges the rain and leaves the partner room to respond.",
      composition: [{ feature: "answer", canonicalSkillId: "react" }, { feature: "add", canonicalSkillId: "share" }]
    },
    {
      id: "rainy-entry-rich",
      japanese: "そうですね。私は商店街の屋根のある道を通りました。駅までの道は歩きやすかったですか？",
      explanation: learnerText("分享自己走過有遮蔽的路線，再詢問同事的路況。", "屋根のある道を通った経験を話し、相手の道の様子を尋ねています。", "Share that you used a covered route, then ask how their walk was."),
      continuation: "enriches_thread",
      rationale: "The learner adds a relevant route detail and asks a low-pressure follow-up that deepens the shared topic.",
      composition: [
        { feature: "answer", canonicalSkillId: "react" },
        { feature: "add", canonicalSkillId: "share" },
        { feature: "ask", canonicalSkillId: "expand" }
      ]
    }
  ],
  summary: learnerText("你接住了同事對雨勢的話題，開始了星期一的對話。", "雨の話を受け止め、月曜日の会話を始めました。", "You picked up the coworker's comment about the rain and started the Monday conversation.")
});

const coveredRoute = bridgeDefinition({
  id: "rainy-monday-covered-route",
  topic: "a covered route in the rain",
  situation: learnerText(
    "你和熟悉的同事在青葉站附近聊到雨天的通勤路線。對方說商店街的屋簷可以遮住其中一段路。",
    "青葉駅の近くで、よく話す同僚と雨の日の通勤路について話しています。相手は商店街の屋根の下なら、道の一部で雨を避けられると話します。",
    "Near Aoba Station, you talk with a familiar coworker about rainy-day commuting routes. They mention that the shopping street's awnings cover part of the walk."
  ),
  instruction: learnerText(
    "分享一個實際的雨天通勤做法，再把話題交回同事。沒有特別做法也可以直接說。",
    "雨の日の通勤でしていることを一つ話し、相手にも話を返しましょう。特別な工夫がなければ、そのまま伝えてかまいません。",
    "Share one practical way you handle a rainy commute, then invite your coworker back into the exchange. It is fine to say you do not have a special routine."
  ),
  partnerLine: "商店街の屋根の下を通ると、しばらく雨にぬれずに歩けますよ。",
  prompt: learnerText("說說自己雨天通勤的做法，也可以先回應同事提到的路線。", "雨の日の通勤について、自分の経験を交えて返事をしましょう。", "Share how you handle a rainy commute, responding to the route your coworker mentioned."),
  responses: [
    {
      id: "covered-route-short",
      japanese: "そうなんですね。特別な工夫はありませんが、折りたたみ傘を持ち歩いています。",
      explanation: learnerText("回應同事的建議，簡單說明自己沒有特別的安排。", "同僚の話に反応し、特別な工夫はないと簡潔に伝えています。", "Acknowledge the tip and briefly say you do not have a special routine."),
      continuation: "opens_thread",
      rationale: "The reply acknowledges the tip and shares a relevant, ordinary routine.",
      composition: [{ feature: "answer", canonicalSkillId: "share" }]
    },
    {
      id: "covered-route-share",
      japanese: "いいですね。私は駅まで歩くので、雨の日は屋根のある道を選ぶことがあります。",
      explanation: learnerText("分享自己步行和選路的經驗。", "歩くときの経験を話し、道の選び方を添えています。", "Share how you choose a walking route."),
      continuation: "enriches_thread",
      rationale: "The learner connects their walking routine to the partner's tip.",
      composition: [{ feature: "answer", canonicalSkillId: "share" }]
    }
  ],
  secondPartnerLine: "雨が強いときは助かりますね。駅まで歩く日は、どの道を通ることが多いですか？",
  secondPrompt: learnerText("說說平常走的路線，再自然地問同事的經驗。", "普段通る道について話し、同僚の経験も尋ねましょう。", "Share your usual route, then ask about your coworker's experience."),
  secondResponses: [
    {
      id: "covered-route-followup-short",
      japanese: "商店街を通ることが多いです。屋根が続いているので歩きやすいですね。",
      explanation: learnerText("回答同事的問題，補充一個實際感受。", "質問に答えて、実際に歩いたときの感想を添えています。", "Answer and add a practical observation."),
      continuation: "opens_thread",
      rationale: "The learner answers the question and shares one useful detail.",
      composition: [{ feature: "answer", canonicalSkillId: "share" }, { feature: "add", canonicalSkillId: "share" }],
      turn: 2
    },
    {
      id: "covered-route-followup-rich",
      japanese: "商店街を通ることが多いです。屋根が続いていて助かります。そちらは帰りも同じ道ですか？",
      explanation: learnerText("回答問題、補充路線的細節，再詢問同事回程時是否走同一條路。", "質問に答えて道の特徴を加え、帰りも同じ道を通るか尋ねています。", "Answer, add a route detail, and ask whether your coworker takes the same route home."),
      continuation: "enriches_thread",
      rationale: "The learner answers, adds a route detail, and asks a relevant follow-up.",
      composition: [{ feature: "answer", canonicalSkillId: "share" }, { feature: "add", canonicalSkillId: "share" }, { feature: "ask", canonicalSkillId: "bounce" }],
      turn: 2
    }
  ],
  summary: learnerText("你們交換了實際的雨天通勤做法。", "雨の日の通勤について、実際の工夫を話し合いました。", "You exchanged practical ideas for commuting in the rain.")
});

const sharedAkiContext = learnerText(
  "你們常聊天，也曾在下雨的早晨聊過通勤。",
  "よく話す同僚です。雨の朝に通勤の話をしたことがあります。",
  "A coworker you often talk with; you have already chatted about a rainy commute."
);
const stageAki = ["aki-familiar", "aki-shared-morning"] as const;

export const rainyMondayContent = {
  profile: "jabiko-game-content/v1" as const,
  world: {
    id: "rainy-monday",
    locations: [
      { id: "aoba-station", name: learnerText("青葉站", "青葉駅", "Aoba Station"), description: learnerText("社區裡的車站入口，也是通勤路線的起點。", "地域の駅の入口で、通勤路の起点です。", "A neighborhood station entrance and a starting point for the commute."), category: "transit" },
      { id: "office", name: learnerText("辦公室", "オフィス", "Office"), description: learnerText("同事們工作的社區辦公室。", "同僚が働く地域のオフィスです。", "A neighborhood office where the coworkers work."), category: "other" },
      { id: "cafeteria", name: learnerText("員工餐廳", "社員食堂", "Cafeteria"), description: learnerText("午休時同事一起用餐的員工餐廳。", "昼休みに同僚と食事をする社員食堂です。", "The staff cafeteria where coworkers eat during lunch."), category: "food" }
    ],
    npcs: [
      { id: "aki", displayName: learnerText("あき", "あき", "Aki"), presentation: learnerText("常一起聊天的同事。", "よく話す同僚です。", "A coworker you often chat with."), role: "coworker", defaultRelationshipContext: sharedAkiContext, relationshipStageIds: [...stageAki] },
      { id: "sato", displayName: learnerText("佐藤さん", "佐藤さん", "Sato"), presentation: learnerText("熟悉的前輩同事。", "親しくしている先輩です。", "A senior coworker you know well."), role: "senior coworker", defaultRelationshipContext: learnerText("同一團隊中熟悉的前輩同事。", "同じチームの先輩です。", "A senior coworker on your team."), relationshipStageIds: ["sato-familiar"] }
    ],
    relationshipStages: [
      { id: "aki-familiar", npcId: "aki", order: 0, context: learnerText("常聊天的同事。", "よく話す同僚です。", "A coworker you often talk with.") },
      { id: "aki-shared-morning", npcId: "aki", order: 1, context: sharedAkiContext },
      { id: "sato-familiar", npcId: "sato", order: 0, context: learnerText("同一團隊中熟悉的前輩同事。", "同じチームの親しい先輩です。", "A familiar senior coworker on your team.") }
    ],
    sessionDefinitions: [entry, weekendShortMoviePlans, foodDailySpecial, commuteTrainBicycle, schoolWorkProjectStory, coveredRoute],
    moments: [
      {
        id: "rain-entry", locationId: "aoba-station", npcId: "aki", relationshipStageId: "aki-familiar", scenarioId: entry.scenario.id,
        objective: entry.scenario.objective,
        availability: { requiredCompletedMomentIds: [], requiredRelationshipStageIds: [] },
        onCompletion: { unlockLocationIds: ["office"], unlockMomentIds: ["movie-plans"], relationshipStageUpdates: [{ npcId: "aki", relationshipStageId: "aki-shared-morning" }] },
        conditionalOutcomes: [{ id: "shared-route-detail", responseRequirement: { stepId: "rainy-monday-entry-response", minimumContinuationQuality: "enriches_thread" }, unlockMomentIds: ["covered-route-optional"] }]
      },
      {
        id: "movie-plans", locationId: "office", npcId: "aki", relationshipStageId: "aki-shared-morning", scenarioId: weekendShortMoviePlans.scenario.id,
        objective: weekendShortMoviePlans.scenario.objective,
        availability: { requiredCompletedMomentIds: ["rain-entry"], requiredRelationshipStageIds: ["aki-shared-morning"] },
        onCompletion: { unlockLocationIds: ["cafeteria"], unlockMomentIds: ["daily-special"], relationshipStageUpdates: [] }, conditionalOutcomes: []
      },
      {
        id: "daily-special", locationId: "cafeteria", npcId: "aki", relationshipStageId: "aki-shared-morning", scenarioId: foodDailySpecial.scenario.id,
        objective: foodDailySpecial.scenario.objective,
        availability: { requiredCompletedMomentIds: ["movie-plans"], requiredRelationshipStageIds: ["aki-shared-morning"] },
        onCompletion: { unlockLocationIds: [], unlockMomentIds: ["commute-chat"], relationshipStageUpdates: [] }, conditionalOutcomes: []
      },
      {
        id: "commute-chat", locationId: "cafeteria", npcId: "aki", relationshipStageId: "aki-shared-morning", scenarioId: commuteTrainBicycle.scenario.id,
        objective: commuteTrainBicycle.scenario.objective,
        availability: { requiredCompletedMomentIds: ["daily-special"], requiredRelationshipStageIds: ["aki-shared-morning"] },
        onCompletion: { unlockLocationIds: [], unlockMomentIds: ["project-story"], relationshipStageUpdates: [] }, conditionalOutcomes: []
      },
      {
        id: "project-story", locationId: "office", npcId: "sato", relationshipStageId: "sato-familiar", scenarioId: schoolWorkProjectStory.scenario.id,
        objective: schoolWorkProjectStory.scenario.objective,
        availability: { requiredCompletedMomentIds: ["commute-chat"], requiredRelationshipStageIds: [] },
        onCompletion: { unlockLocationIds: [], unlockMomentIds: [], relationshipStageUpdates: [] }, conditionalOutcomes: [], completesArc: true
      },
      {
        id: "covered-route-optional", locationId: "aoba-station", npcId: "aki", relationshipStageId: "aki-shared-morning", scenarioId: coveredRoute.scenario.id,
        objective: coveredRoute.scenario.objective,
        availability: { requiredCompletedMomentIds: ["rain-entry"], requiredRelationshipStageIds: ["aki-shared-morning"] },
        onCompletion: { unlockLocationIds: [], unlockMomentIds: [], relationshipStageUpdates: [] }, conditionalOutcomes: []
      }
    ],
    initialState: {
      completedMomentIds: [], relationshipStages: { aki: "aki-familiar", sato: "sato-familiar" },
      unlockedLocationIds: ["aoba-station"], unlockedMomentIds: ["rain-entry"], outcomeReferences: []
    },
    entryMomentIds: ["rain-entry"]
  } satisfies GameWorldDefinition
};

/** Semantic save compatibility revision; copy and citation edits do not change it. */
export const rainyMondayContentRevision = 1;
