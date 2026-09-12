import type { CuratedConversationResponse } from "./conversationFeedback";
import type { ConversationScenario, ConversationSkillId } from "./conversationScenario";
import type { ConversationSessionDefinition } from "./conversationSession";

type CuratedResponse = CuratedConversationResponse<ConversationSkillId>;

// --- Short: react to a shared situation and ask one follow-up. ---

const fxShortPlatformScenario: ConversationScenario = {
  id: "fx-short-platform-delay",
  topic: "commute",
  world: "train platform",
  situation: {
    textZh: "月台上的電子看板顯示電車誤點，站在旁邊的同事也抬起頭看到了。",
    textI18n: {
      ja: "ホームの電光掲示板に電車の遅延が出ていて、隣に立っている同僚も顔を上げて気づいた。",
      en: "The platform board shows a train delay, and the coworker standing next to the learner has noticed it too."
    }
  },
  relationship: {
    learnerRole: "coworker",
    partnerRole: "coworker",
    context: {
      textZh: "每天早上一起搭車通勤、說話輕鬆但使用です・ます的同事。",
      textI18n: {
        ja: "毎朝いっしょに通勤していて、話し方はやわらかいですが「です・ます」を使う同僚。",
        en: "A coworker who commutes together every morning and speaks friendly but polite Japanese."
      }
    }
  },
  length: "short",
  primarySkills: ["react", "bounce"],
  difficulty: {
    linguisticComplexity: "basic",
    partnerSupport: "supportive",
    relationshipDistance: "familiar",
    topicDepth: "concrete",
    interactionPressure: "low"
  },
  objective: {
    textZh: "聽到對方的狀況時先反應，再用一句話追問，讓對話當場就能接下去。",
    textI18n: {
      ja: "相手の状況を聞いたらまず反応し、ひと言質問して、その場で会話が続くようにする。",
      en: "React to the partner's situation and ask one follow-up so the conversation can continue on the spot."
    }
  },
  instruction: {
    textZh: "選一個回應：先讓對方知道你在聽，再讓他願意多說一點。",
    textI18n: {
      ja: "返事を選びましょう。まず聞いていることを伝え、相手がもう少し話したくなるように。",
      en: "Choose a response that shows you are listening and invites the partner to say a little more."
    }
  },
  startStepId: "fx-short-platform-line",
  steps: [
    {
      id: "fx-short-platform-line",
      kind: "partner_line",
      japanese: "電車、遅れてるみたいですね。",
      nextStepId: "fx-short-platform-response"
    },
    {
      id: "fx-short-platform-response",
      kind: "learner_response",
      prompt: {
        textZh: "反應並追問一句。",
        textI18n: {
          ja: "反応して、ひと言たずねる。",
          en: "React and ask one follow-up."
        }
      },
      responseExamples: [
        {
          id: "fx-short-platform-echo",
          kind: "suggested",
          japanese: "そうですね。"
        },
        {
          id: "fx-short-platform-followup",
          kind: "accepted",
          japanese: "あ、本当ですね。何かあったんですか？"
        }
      ],
      branches: [
        { id: "fx-short-platform-echo-path", nextStepId: "fx-short-platform-complete" },
        { id: "fx-short-platform-followup-path", nextStepId: "fx-short-platform-complete" }
      ],
      defaultBranchId: "fx-short-platform-echo-path"
    },
    {
      id: "fx-short-platform-complete",
      kind: "completion",
      summary: {
        textZh: "完成短對話的反應與追問練習。",
        textI18n: {
          ja: "短いやり取りで、反応と質問の練習をした。",
          en: "Practiced reacting and following up in a short exchange."
        }
      }
    }
  ]
};

const fxShortPlatformEchoFeedback: CuratedResponse = {
  id: "fx-short-platform-echo-feedback",
  responseJapanese: "そうですね。",
  context: {
    situation: "A coworker notices that the train is delayed while the two wait on the platform.",
    relationship: "Coworkers who commute together and speak friendly polite Japanese.",
    discourse: "The learner reacts to the partner's shared observation about the delay."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "dead_end",
    registerContextFit: "fits",
    composition: [{ feature: "answer", canonicalSkillId: "react" }],
    authorRationale: {
      natural: "The reaction is natural polite Japanese for a coworker.",
      continuation: "The bare agreement gives the partner nothing new to continue with."
    }
  }
};

const fxShortPlatformFollowupFeedback: CuratedResponse = {
  id: "fx-short-platform-followup-feedback",
  responseJapanese: "あ、本当ですね。何かあったんですか？",
  context: {
    situation: "A coworker notices that the train is delayed while the two wait on the platform.",
    relationship: "Coworkers who commute together and speak friendly polite Japanese.",
    discourse: "The learner reacts to the delay and asks for the reason to keep the exchange going."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [
      { feature: "answer", canonicalSkillId: "react" },
      { feature: "ask", canonicalSkillId: "bounce" }
    ],
    authorRationale: {
      continuation: "The follow-up question hands the partner a concrete thing to explain."
    }
  }
};

const fxShortPlatformDefinition: ConversationSessionDefinition = {
  scenario: fxShortPlatformScenario,
  responses: [
    {
      stepId: "fx-short-platform-response",
      responseExampleId: "fx-short-platform-echo",
      branchId: "fx-short-platform-echo-path",
      feedback: fxShortPlatformEchoFeedback
    },
    {
      stepId: "fx-short-platform-response",
      responseExampleId: "fx-short-platform-followup",
      branchId: "fx-short-platform-followup-path",
      feedback: fxShortPlatformFollowupFeedback
    }
  ]
};

// --- Medium: sustain one thread with Answer -> Add -> Ask and a light turn. ---

const fxMediumLunchScenario: ConversationScenario = {
  id: "fx-medium-lunch-run",
  topic: "lunch",
  world: "office",
  situation: {
    textZh: "中午前，隔壁座位的同事轉過頭來問起午餐。",
    textI18n: {
      ja: "お昼前、隣の席の同僚が振り向いてお昼のことを聞いてきた。",
      en: "Shortly before noon, the coworker at the next desk turns around to talk about lunch."
    }
  },
  relationship: {
    learnerRole: "coworker",
    partnerRole: "coworker",
    context: {
      textZh: "同一個團隊、中午常一起吃飯的同事。",
      textI18n: {
        ja: "同じチームで、お昼をよく一緒に食べる同僚。",
        en: "A coworker on the same team who often eats lunch together."
      }
    }
  },
  length: "medium",
  primarySkills: ["share", "expand", "bounce"],
  difficulty: {
    linguisticComplexity: "intermediate",
    partnerSupport: "balanced",
    relationshipDistance: "neutral",
    topicDepth: "personal",
    interactionPressure: "normal"
  },
  objective: {
    textZh: "用回答、補充、反問撐起幾個來回，並在話題轉向新店家時跟上。",
    textI18n: {
      ja: "答え・付け足し・聞き返しで何度かやり取りを続け、新しい店の話題にも乗る。",
      en: "Sustain several exchanges with answer, add, and ask, and follow a light turn toward a new place."
    }
  },
  instruction: {
    textZh: "每次回應都留一個讓對方能接話的資訊。",
    textI18n: {
      ja: "返事のたびに、相手が次に触れられる情報を残しましょう。",
      en: "Leave one piece of information the partner can pick up in every response."
    }
  },
  startStepId: "fx-medium-lunch-line-1",
  steps: [
    {
      id: "fx-medium-lunch-line-1",
      kind: "partner_line",
      japanese: "お昼、何食べるか決めました？",
      nextStepId: "fx-medium-lunch-response-1"
    },
    {
      id: "fx-medium-lunch-response-1",
      kind: "learner_response",
      prompt: {
        textZh: "先回答，再補充自己的狀況。",
        textI18n: {
          ja: "まず答え、自分の状況を少し足す。",
          en: "Answer first, then add a little about your own situation."
        }
      },
      responseExamples: [
        {
          id: "fx-medium-lunch-answer",
          kind: "suggested",
          japanese: "まだです。今日は軽いものがいい気分です。"
        }
      ],
      branches: [{ id: "fx-medium-lunch-answer-path", nextStepId: "fx-medium-lunch-line-2" }]
    },
    {
      id: "fx-medium-lunch-line-2",
      kind: "partner_line",
      japanese: "そうなんですね。この近くに新しいうどん屋さんができたの、知ってますか？",
      nextStepId: "fx-medium-lunch-response-2"
    },
    {
      id: "fx-medium-lunch-response-2",
      kind: "learner_response",
      prompt: {
        textZh: "接住新資訊，把話題交回去。",
        textI18n: {
          ja: "新しい情報を受け止めて、話題を相手に返す。",
          en: "Take in the new information and hand the topic back."
        }
      },
      responseExamples: [
        {
          id: "fx-medium-lunch-ask",
          kind: "suggested",
          japanese: "知らなかったです。どんなお店なんですか？"
        }
      ],
      branches: [{ id: "fx-medium-lunch-ask-path", nextStepId: "fx-medium-lunch-line-3" }]
    },
    {
      id: "fx-medium-lunch-line-3",
      kind: "partner_line",
      japanese: "天ぷらが人気らしいですよ。十二時を過ぎると混むみたいです。",
      nextStepId: "fx-medium-lunch-response-3"
    },
    {
      id: "fx-medium-lunch-response-3",
      kind: "learner_response",
      prompt: {
        textZh: "用回答加提議收尾這個來回。",
        textI18n: {
          ja: "答えと提案でこのやり取りを締める。",
          en: "Close the exchange with an answer and a suggestion."
        }
      },
      responseExamples: [
        {
          id: "fx-medium-lunch-plan",
          kind: "accepted",
          japanese: "いいですね。じゃあ、十一時半ごろに行きませんか？"
        }
      ],
      branches: [{ id: "fx-medium-lunch-plan-path", nextStepId: "fx-medium-lunch-complete" }]
    },
    {
      id: "fx-medium-lunch-complete",
      kind: "completion",
      summary: {
        textZh: "完成數個來回的話題延續與輕微轉向練習。",
        textI18n: {
          ja: "何度かのやり取りで、話題の継続と少しの転換を練習した。",
          en: "Practiced sustaining a topic and a light turn across several exchanges."
        }
      }
    }
  ]
};

const fxMediumLunchAnswerFeedback: CuratedResponse = {
  id: "fx-medium-lunch-answer-feedback",
  responseJapanese: "まだです。今日は軽いものがいい気分です。",
  context: {
    situation: "A teammate asks about lunch plans before noon.",
    relationship: "Teammates who often eat lunch together and speak friendly polite Japanese.",
    discourse: "The learner answers the lunch question and adds their own preference."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "opens_thread",
    registerContextFit: "fits",
    composition: [
      { feature: "answer", canonicalSkillId: "share" },
      { feature: "add", canonicalSkillId: "expand" }
    ],
    authorRationale: {
      continuation: "The stated preference gives the partner something to react to and build on."
    }
  }
};

const fxMediumLunchAskFeedback: CuratedResponse = {
  id: "fx-medium-lunch-ask-feedback",
  responseJapanese: "知らなかったです。どんなお店なんですか？",
  context: {
    situation: "The partner mentions a new udon shop near the office.",
    relationship: "Teammates who often eat lunch together and speak friendly polite Japanese.",
    discourse: "The learner receives the new information and asks the partner to develop it."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [{ feature: "ask", canonicalSkillId: "bounce" }],
    authorRationale: {
      continuation: "Returning the question keeps the partner talking about the new shop."
    }
  }
};

const fxMediumLunchPlanFeedback: CuratedResponse = {
  id: "fx-medium-lunch-plan-feedback",
  responseJapanese: "いいですね。じゃあ、十一時半ごろに行きませんか？",
  context: {
    situation: "The partner explains that the new udon shop gets crowded after noon.",
    relationship: "Teammates who often eat lunch together and speak friendly polite Japanese.",
    discourse: "The learner accepts the idea and proposes a time to avoid the crowd."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [
      { feature: "answer", canonicalSkillId: "share" },
      { feature: "ask", canonicalSkillId: "bounce" }
    ],
    authorRationale: {
      continuation: "The concrete time proposal gives the partner a decision to make."
    }
  }
};

const fxMediumLunchDefinition: ConversationSessionDefinition = {
  scenario: fxMediumLunchScenario,
  responses: [
    {
      stepId: "fx-medium-lunch-response-1",
      responseExampleId: "fx-medium-lunch-answer",
      branchId: "fx-medium-lunch-answer-path",
      feedback: fxMediumLunchAnswerFeedback
    },
    {
      stepId: "fx-medium-lunch-response-2",
      responseExampleId: "fx-medium-lunch-ask",
      branchId: "fx-medium-lunch-ask-path",
      feedback: fxMediumLunchAskFeedback
    },
    {
      stepId: "fx-medium-lunch-response-3",
      responseExampleId: "fx-medium-lunch-plan",
      branchId: "fx-medium-lunch-plan-path",
      feedback: fxMediumLunchPlanFeedback
    }
  ]
};

// --- Long: narrate, state an opinion and negotiate a plan across several turns. ---

const fxLongExchangeScenario: ConversationScenario = {
  id: "fx-long-exchange-table",
  topic: "language exchange",
  world: "community language exchange",
  situation: {
    textZh: "在語言交換活動的桌邊，你和一位初次見面的人單獨聊了起來。",
    textI18n: {
      ja: "語学交流イベントのテーブルで、初めて会った人と二人で話し始めた。",
      en: "At a language exchange event, the learner has started a one-on-one conversation with someone they just met."
    }
  },
  relationship: {
    learnerRole: "participant",
    partnerRole: "participant",
    context: {
      textZh: "活動中初次見面、需要完整說明與互相協商的對象。",
      textI18n: {
        ja: "イベントで初めて会い、きちんと説明し合いながら話を進める相手。",
        en: "Someone met for the first time at the event, with whom the learner explains and negotiates at length."
      }
    }
  },
  length: "long",
  primarySkills: ["narrate", "opinion", "negotiate"],
  difficulty: {
    linguisticComplexity: "advanced",
    partnerSupport: "low_support",
    relationshipDistance: "neutral",
    topicDepth: "abstract",
    interactionPressure: "high"
  },
  objective: {
    textZh: "在較長的對話裡敘述自己的經驗、說明想法，並和對方協商下一次的約定。",
    textI18n: {
      ja: "長めの会話で経験を語り、考えを説明し、次の約束を相談する。",
      en: "Narrate an experience, explain an opinion, and negotiate a next plan across a longer conversation."
    }
  },
  instruction: {
    textZh: "依序完成敘述、表達意見與協商；每一步都要讓對方能接著說。",
    textI18n: {
      ja: "語る・意見を言う・相談するを順に行い、どの段階でも相手が続けられるように。",
      en: "Work through narration, opinion, and negotiation while keeping each turn answerable."
    }
  },
  startStepId: "fx-long-exchange-line-1",
  steps: [
    {
      id: "fx-long-exchange-line-1",
      kind: "partner_line",
      japanese: "日本語を習い始めて、どのくらいですか？",
      nextStepId: "fx-long-exchange-response-1"
    },
    {
      id: "fx-long-exchange-response-1",
      kind: "learner_response",
      prompt: {
        textZh: "敘述你開始學日文的經過。",
        textI18n: {
          ja: "日本語を習い始めたきっかけを語る。",
          en: "Narrate how you started learning Japanese."
        }
      },
      responseExamples: [
        {
          id: "fx-long-exchange-narrate",
          kind: "suggested",
          japanese: "ええと、二年くらいです。アニメがきっかけで、大学で授業を取りました。"
        }
      ],
      branches: [{ id: "fx-long-exchange-narrate-path", nextStepId: "fx-long-exchange-line-2" }]
    },
    {
      id: "fx-long-exchange-line-2",
      kind: "partner_line",
      japanese: "そうなんですね。漢字を覚えるのは大変じゃないですか？",
      nextStepId: "fx-long-exchange-response-2"
    },
    {
      id: "fx-long-exchange-response-2",
      kind: "learner_response",
      prompt: {
        textZh: "說明自己的看法，並補充你怎麼做。",
        textI18n: {
          ja: "自分の考えを説明し、どう勉強しているかも足す。",
          en: "Explain your opinion and add how you actually study."
        }
      },
      responseExamples: [
        {
          id: "fx-long-exchange-opinion",
          kind: "suggested",
          japanese: "大変ですけど、意味が見えると面白いです。わたしは絵を覚えるみたいに練習しています。"
        }
      ],
      branches: [{ id: "fx-long-exchange-opinion-path", nextStepId: "fx-long-exchange-line-3" }]
    },
    {
      id: "fx-long-exchange-line-3",
      kind: "partner_line",
      japanese: "それはいい方法ですね。週末はいつも何をしているんですか？",
      nextStepId: "fx-long-exchange-response-3"
    },
    {
      id: "fx-long-exchange-response-3",
      kind: "learner_response",
      prompt: {
        textZh: "敘述週末的習慣，留一個能延伸的細節。",
        textI18n: {
          ja: "週末の習慣を語り、次につながる細かい情報を残す。",
          en: "Narrate the weekend routine and leave one detail the partner can pick up."
        }
      },
      responseExamples: [
        {
          id: "fx-long-exchange-weekend",
          kind: "accepted",
          japanese: "土曜日はたいてい図書館で勉強して、日曜日は友達と街を歩きます。先週は新しいカフェを見つけました。"
        }
      ],
      branches: [{ id: "fx-long-exchange-weekend-path", nextStepId: "fx-long-exchange-line-4" }]
    },
    {
      id: "fx-long-exchange-line-4",
      kind: "partner_line",
      japanese: "いいですね。今度、そのカフェに一緒に行きませんか？",
      nextStepId: "fx-long-exchange-response-4"
    },
    {
      id: "fx-long-exchange-response-4",
      kind: "learner_response",
      prompt: {
        textZh: "接受提議，並協商時間。",
        textI18n: {
          ja: "誘いを受け、時間を相談する。",
          en: "Accept the invitation and negotiate a time."
        }
      },
      responseExamples: [
        {
          id: "fx-long-exchange-negotiate",
          kind: "accepted",
          japanese: "いいですね。じゃあ、来月の土曜はどうですか。わたしは午後なら空いています。"
        }
      ],
      branches: [{ id: "fx-long-exchange-negotiate-path", nextStepId: "fx-long-exchange-complete" }]
    },
    {
      id: "fx-long-exchange-complete",
      kind: "completion",
      summary: {
        textZh: "完成敘述、表達意見與協商時間的長對話。",
        textI18n: {
          ja: "語る・意見を言う・時間を相談する長めの会話をやり切った。",
          en: "Completed a longer conversation with narration, opinion, and time negotiation."
        }
      }
    }
  ]
};

const fxLongExchangeNarrateFeedback: CuratedResponse = {
  id: "fx-long-exchange-narrate-feedback",
  responseJapanese: "ええと、二年くらいです。アニメがきっかけで、大学で授業を取りました。",
  context: {
    situation: "The partner asks how long the learner has studied Japanese.",
    relationship:
      "Participants who met for the first time at a language exchange and speak polite Japanese.",
    discourse: "The learner narrates the story of how they started studying Japanese."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [{ feature: "answer", canonicalSkillId: "narrate" }],
    authorRationale: {
      continuation: "The origin story gives the partner several details to ask about."
    }
  }
};

const fxLongExchangeOpinionFeedback: CuratedResponse = {
  id: "fx-long-exchange-opinion-feedback",
  responseJapanese:
    "大変ですけど、意味が見えると面白いです。わたしは絵を覚えるみたいに練習しています。",
  context: {
    situation: "The partner asks whether learning kanji is hard.",
    relationship:
      "Participants who met for the first time at a language exchange and speak polite Japanese.",
    discourse: "The learner gives an opinion about kanji study and adds a personal method."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [{ feature: "answer", canonicalSkillId: "opinion" }],
    authorRationale: {
      continuation: "The stated method invites the partner to compare their own experience."
    }
  }
};

const fxLongExchangeWeekendFeedback: CuratedResponse = {
  id: "fx-long-exchange-weekend-feedback",
  responseJapanese:
    "土曜日はたいてい図書館で勉強して、日曜日は友達と街を歩きます。先週は新しいカフェを見つけました。",
  context: {
    situation: "The partner asks what the learner usually does on weekends.",
    relationship:
      "Participants who met for the first time at a language exchange and speak polite Japanese.",
    discourse: "The learner narrates a weekend routine and mentions a newly found cafe."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [{ feature: "add", canonicalSkillId: "narrate" }],
    authorRationale: {
      continuation: "The cafe detail gives the partner an obvious next topic."
    }
  }
};

const fxLongExchangeNegotiateFeedback: CuratedResponse = {
  id: "fx-long-exchange-negotiate-feedback",
  responseJapanese: "いいですね。じゃあ、来月の土曜はどうですか。わたしは午後なら空いています。",
  context: {
    situation: "The partner suggests visiting the cafe together.",
    relationship:
      "Participants who met for the first time at a language exchange and speak polite Japanese.",
    discourse: "The learner accepts the invitation and negotiates a concrete time."
  },
  feedback: {
    languageQuality: "natural",
    continuation: "enriches_thread",
    registerContextFit: "fits",
    composition: [
      { feature: "answer", canonicalSkillId: "negotiate" },
      { feature: "ask", canonicalSkillId: "negotiate" }
    ],
    authorRationale: {
      continuation: "The proposed afternoon time asks the partner to confirm or adjust."
    }
  }
};

const fxLongExchangeDefinition: ConversationSessionDefinition = {
  scenario: fxLongExchangeScenario,
  responses: [
    {
      stepId: "fx-long-exchange-response-1",
      responseExampleId: "fx-long-exchange-narrate",
      branchId: "fx-long-exchange-narrate-path",
      feedback: fxLongExchangeNarrateFeedback
    },
    {
      stepId: "fx-long-exchange-response-2",
      responseExampleId: "fx-long-exchange-opinion",
      branchId: "fx-long-exchange-opinion-path",
      feedback: fxLongExchangeOpinionFeedback
    },
    {
      stepId: "fx-long-exchange-response-3",
      responseExampleId: "fx-long-exchange-weekend",
      branchId: "fx-long-exchange-weekend-path",
      feedback: fxLongExchangeWeekendFeedback
    },
    {
      stepId: "fx-long-exchange-response-4",
      responseExampleId: "fx-long-exchange-negotiate",
      branchId: "fx-long-exchange-negotiate-path",
      feedback: fxLongExchangeNegotiateFeedback
    }
  ]
};

export const conversationSessionDefinitions: readonly ConversationSessionDefinition[] = [
  fxShortPlatformDefinition,
  fxMediumLunchDefinition,
  fxLongExchangeDefinition
];

export const conversationScenarios: readonly ConversationScenario[] =
  conversationSessionDefinitions.map((definition) => definition.scenario);
