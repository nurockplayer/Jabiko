import type { CuratedConversationResponse } from "../conversationFeedback";
import type { ConversationSessionDefinition } from "../conversationSession";
import {
  type ConversationDifficulty,
  type ConversationLearnerText,
  type ConversationScenario,
  type ConversationSkillId
} from "../conversationScenario";
import type { SeasonalEvent } from "../seasonalEvents";

const ACCESSED_ON = "2026-09-26";
const CABINET_URL = "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html";
const BOUISAI_URL = "https://www.bousai.go.jp/kyoiku/week/bousaiweek.html";
const MEXT_URL = "https://www.mext.go.jp/a_menu/shotou/shugaku/detail/1422233.htm";
const HINAMATSURI_URL = "https://www.japan.travel/tw/guide/march/";
const TANABATA_URL = "https://web-japan.org/kidsweb/explore/calendar/july/tanabata.html";
const TIME_DAY_URL = "https://www.am12.jp/toki-kinenbi/";
const COFFEE_URL = "https://coffee.ajca.or.jp/about/international-coffee-day/";
const NEW_YEARS_EVE_URL = "https://www.japan.travel/en/guide/december/";

function text(textZh: string, ja: string, en: string): ConversationLearnerText {
  return { textZh, textI18n: { ja, en } };
}

interface ResponseProfile {
  languageQuality: "natural";
  continuation: "opens_thread" | "enriches_thread";
  registerContextFit: "fits";
  composition: CuratedConversationResponse<ConversationSkillId>["feedback"]["composition"];
  authorRationale: CuratedConversationResponse<ConversationSkillId>["feedback"]["authorRationale"];
}

const ANSWER_ONLY: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [{ feature: "answer", canonicalSkillId: "share" }],
  authorRationale: {
    natural: "The direct response fits the immediate context and does not assume more familiarity than the exchange establishes.",
    continuation: "The concise answer leaves the partner room to respond or continue the topic.",
    register_context_fit: "The learner answers without assuming a shared routine or obligation."
  }
};

const NARRATE_AND_REFLECT: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "narrate" }
  ],
  authorRationale: {
    natural: "The learner gives a concrete, bounded account in the stated familiar context.",
    continuation: "A specific event and its effect develop the partner's retrospective question.",
    register_context_fit: "The learner shares only a voluntary personal experience."
  }
};

const NARRATE_AND_FIT_CHECK: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "narrate" },
    { feature: "ask", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The learner recounts a changed study goal in an everyday classmate conversation.",
    continuation: "A focused fit-check invites the partner to compare the described approach with their own constraints.",
    register_context_fit: "The question follows the partner's volunteered goal without demanding a commitment."
  }
};

const SHARE_AND_NEGOTIATED_FIT_CHECK: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "negotiate" },
    { feature: "ask", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The learner states a menu criterion and checks whether it suits the partner's drink preference.",
    continuation: "The focused question develops the shared choice without deciding for the partner.",
    register_context_fit: "The learner invites a preference in a low-pressure cafe conversation."
  }
};

const NARRATE_AND_EXPAND: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "narrate" },
    { feature: "ask", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The learner briefly recounts reading the explanation and imagining the work's background.",
    continuation: "A focused question invites one detail from the partner's interpretation.",
    register_context_fit: "The question follows the shared exhibition topic without requiring agreement."
  }
};

const NARRATE_AND_RETURN: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "narrate" },
    { feature: "ask", canonicalSkillId: "bounce" }
  ],
  authorRationale: {
    natural: "The learner gives a short account and returns the topic with a reciprocal question.",
    continuation: "A concrete experience leads to an optional question that returns the topic.",
    register_context_fit: "The learner asks a focused reciprocal question about the topic the partner shared."
  }
};

const NEGOTIATE_WITH_REASON: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "negotiate" }
  ],
  authorRationale: {
    natural: "The proposal is phrased as the learner's preference rather than a demand.",
    continuation: "A reasoned option develops the shared planning question while preserving flexibility.",
    register_context_fit: "The learner proposes an option without committing the partner."
  }
};

const ANSWER_AND_RETURN: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "ask", canonicalSkillId: "bounce" }
  ],
  authorRationale: {
    natural: "The answer and reciprocal question fit the stated everyday exchange.",
    continuation: "The learner answers the partner and hands the conversational turn back with one optional question.",
    register_context_fit: "The question returns the topic without presuming a shared plan or private detail."
  }
};

const REACT_SHARE_AND_RETURN: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "react" },
    { feature: "add", canonicalSkillId: "share" },
    { feature: "ask", canonicalSkillId: "bounce" }
  ],
  authorRationale: {
    natural: "The learner acknowledges the quieter public space, adds a personal rest plan, and asks the partner's preference.",
    continuation: "The personal example leads into an optional reciprocal question about resting.",
    register_context_fit: "The learner shares an ordinary choice without assuming a shared holiday routine."
  }
};

const SHARE_AND_FOCUSED_QUESTION: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "ask", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The learner offers a personal visual observation and asks which color stood out to the partner.",
    continuation: "The focused question develops the partner's volunteered impression without requiring agreement.",
    register_context_fit: "The exchange stays with visible features of the public artwork."
  }
};

const SHARE_AND_NOTICE_QUESTION: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "ask", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The learner shares one modest observation about reading the ordinary notice and asks which detail was clear.",
    continuation: "The concrete follow-up continues the discussion of notice communication.",
    register_context_fit: "The learner reflects on communication only, without making claims about drill outcomes or safety."
  }
};

const NEGOTIATE_ONLY: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [{ feature: "answer", canonicalSkillId: "negotiate" }],
  authorRationale: {
    natural: "The learner offers a bounded, low-pressure public plan and leaves the partner free to decline or reschedule.",
    continuation: "The proposal gives the partner a concrete optional arrangement to consider.",
    register_context_fit: "The suggestion concerns a neutral public place and does not presume a private visit or shared ritual."
  }
};

const OPINION_AND_NEGOTIATE: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "opinion" },
    { feature: "add", canonicalSkillId: "negotiate" }
  ],
  authorRationale: {
    natural: "The learner states why a quiet seat matters and proposes preserving separate drink choices.",
    continuation: "The reasoned criterion answers the selection question and offers a flexible shared option.",
    register_context_fit: "The suggestion accommodates different tastes without deciding for the partner."
  }
};

const REACT_AND_SHARE: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "react" },
    { feature: "add", canonicalSkillId: "share" }
  ],
  authorRationale: {
    natural: "The learner first responds to the partner's visible observation, then adds a personal detail.",
    continuation: "The added detail gives the partner a natural way to continue the topic.",
    register_context_fit: "The observation remains personal and does not claim specialized knowledge."
  }
};

const ACKNOWLEDGE_AND_SHARE: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "react" },
    { feature: "add", canonicalSkillId: "share" }
  ],
  authorRationale: {
    natural: "The learner responds to the partner's preference or method, then adds a related personal choice.",
    continuation: "The added personal choice gives the partner another concrete way to continue.",
    register_context_fit: "The learner responds to a volunteered preference without treating their own choice as universal."
  }
};

const ACCEPT_AND_SUGGEST: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "negotiate" }
  ],
  authorRationale: {
    natural: "The learner accepts an optional invitation and suggests a shared next step.",
    continuation: "The proposed step develops the plan while leaving the invitation voluntary.",
    register_context_fit: "The learner makes a low-pressure suggestion about the public display."
  }
};

const POLITE_DECLINE: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [{ feature: "answer", canonicalSkillId: "negotiate" }],
  authorRationale: {
    natural: "The learner politely declines today's optional invitation and leaves a later possibility open.",
    continuation: "The response declines the immediate plan without closing the topic entirely.",
    register_context_fit: "The learner states a time constraint without implying an obligation to attend."
  }
};

const REACT_AND_EXPAND: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "react" },
    { feature: "add", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The learner acknowledges the partner's observation or goal, then develops that topic with a related detail.",
    continuation: "The related detail builds on the partner's contribution and opens another path in the same topic.",
    register_context_fit: "The learner stays with a volunteered public observation or goal."
  }
};

const REACT_AND_NEGOTIATE: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "react" },
    { feature: "add", canonicalSkillId: "negotiate" }
  ],
  authorRationale: {
    natural: "The learner welcomes the proposed approach and keeps the next step flexible.",
    continuation: "The response accepts the suggestion while preserving room to choose how to continue.",
    register_context_fit: "The learner offers flexibility without committing either person to a fixed routine."
  }
};

const ACKNOWLEDGE_GOAL_AND_NEGOTIATE: ResponseProfile = {
  ...REACT_AND_NEGOTIATE,
  continuation: "enriches_thread",
  authorRationale: {
    natural: "The learner acknowledges the partner's preferred pace and suggests a flexible next step.",
    continuation: "The optional adjustment develops the partner's goal without setting a fixed routine.",
    register_context_fit: "The learner responds to the stated constraint while leaving the choice open."
  }
};

const ACKNOWLEDGE_STAY_HOME_AND_NEGOTIATE: ResponseProfile = {
  ...REACT_AND_NEGOTIATE,
  continuation: "enriches_thread",
  authorRationale: {
    natural: "The learner accepts the partner's preference to stay home, then offers a later, easy-to-decline public option.",
    continuation: "The later option develops the invitation while allowing both people to keep their plans.",
    register_context_fit: "The learner respects the partner's stated preference and does not assume a visit or shared event."
  }
};

const DEVELOP_AND_SHARE: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "expand" },
    { feature: "add", canonicalSkillId: "share" }
  ],
  authorRationale: {
    natural: "The learner develops the partner's low-sweetness preference with a menu possibility, then shares a plan to check it.",
    continuation: "A relevant option and the intended check give the partner concrete material to continue with.",
    register_context_fit: "The learner offers a possibility and does not assume the partner will choose it."
  }
};

const SHARE_AND_NEGOTIATE: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "negotiate" }
  ],
  authorRationale: {
    natural: "The learner adds an inclusive venue criterion to a personal drink preference.",
    continuation: "The criterion keeps both people's preferences available when choosing a shared cafe.",
    register_context_fit: "The learner describes what feels comfortable without deciding the partner's choice."
  }
};

const SHARE_AND_REACT: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "react" }
  ],
  authorRationale: {
    natural: "The learner shares a quiet-reading memory, then acknowledges the partner's music routine.",
    continuation: "The acknowledgment connects the personal memory to the partner's volunteered routine.",
    register_context_fit: "The response stays with everyday experiences shared between classmates."
  }
};

const REACT_SHARE_AND_EXPAND: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "react" },
    { feature: "add", canonicalSkillId: "share" },
    { feature: "ask", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The learner acknowledges the size difference, adds a personal color observation, and asks about the setting.",
    continuation: "The personal observation and concrete follow-up develop the public display topic.",
    register_context_fit: "The question stays with an observation the partner volunteered."
  }
};

const DIFFERENT_VIEW_WITH_REASON: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "agree_disagree" }
  ],
  authorRationale: {
    natural: "The learner presents a different personal view without dismissing the partner.",
    continuation: "A specific reason adds a second perspective to the partner's observation.",
    register_context_fit: "The response allows both people to prefer different options."
  }
};

const CLARIFY_ORDINARY_DETAIL: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [{ feature: "ask", canonicalSkillId: "repair" }],
  authorRationale: {
    natural: "The learner asks a brief clarification after the partner's description is incomplete.",
    continuation: "The question repairs a small information gap so the everyday exchange can continue.",
    register_context_fit: "The clarification concerns a volunteered routine rather than private information."
  }
};

const PERSONAL_DETAIL_AND_EXPAND: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "expand" },
    { feature: "ask", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The learner's brief example fits the familiar, low-pressure conversation.",
    continuation: "A related detail and a specific follow-up develop the partner's current topic.",
    register_context_fit: "The question stays with a volunteered topic and does not press for private information."
  }
};

const ACKNOWLEDGE_AND_INVITE: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "react" },
    { feature: "ask", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The acknowledgement fits the immediate partner line and avoids overstating agreement.",
    continuation: "The invitation asks about one observable or personally chosen detail.",
    register_context_fit: "The learner shows interest without pressing for private information."
  }
};

const ACKNOWLEDGE_AND_PROPOSE_MENU: ResponseProfile = {
  languageQuality: "natural",
  continuation: "opens_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "react" },
    { feature: "add", canonicalSkillId: "negotiate" }
  ],
  authorRationale: {
    natural: "The learner acknowledges the partner's low-sweetness preference, suggests an unsweetened latte, and proposes checking the menu together.",
    continuation: "The optional menu check gives the partner a concrete next step to accept or decline.",
    register_context_fit: "The learner offers a possibility without deciding what the partner will drink."
  }
};

const COMPARE_OBSERVATIONS: ResponseProfile = {
  languageQuality: "natural",
  continuation: "enriches_thread",
  registerContextFit: "fits",
  composition: [
    { feature: "answer", canonicalSkillId: "share" },
    { feature: "add", canonicalSkillId: "expand" }
  ],
  authorRationale: {
    natural: "The learner compares two visible details in the stated everyday setting.",
    continuation: "The comparison develops the partner's observation across both locations.",
    register_context_fit: "The learner shares personal observations without claiming expertise."
  }
};

interface AuthoredAnswer {
  japanese: string;
  explanation?: ConversationLearnerText;
  discourse: string;
  profile: ResponseProfile;
}

interface AuthoredTurn {
  partnerLine: string;
  prompt: ConversationLearnerText;
  answers: readonly [AuthoredAnswer, AuthoredAnswer];
}

interface AuthoredPhase {
  phase: "before" | "active" | "after";
  length: "short" | "medium" | "long";
  learnerRole: "coworker" | "classmate" | "participant";
  partnerRole: "coworker" | "classmate" | "participant";
  relationship: ConversationLearnerText;
  situation: ConversationLearnerText;
  objective: ConversationLearnerText;
  instruction: ConversationLearnerText;
  primarySkills: readonly ConversationSkillId[];
  difficulty: ConversationDifficulty;
  turns: readonly AuthoredTurn[];
  completion: ConversationLearnerText;
}

export interface SeasonalConversationFamily {
  readonly event: SeasonalEvent;
  readonly title: ConversationLearnerText;
  readonly note: ConversationLearnerText;
  readonly definitions: readonly ConversationSessionDefinition[];
}

interface FamilyInput {
  id: string;
  displayName: string;
  category: SeasonalEvent["category"];
  month: number;
  day: number;
  topic: string;
  world: string;
  sourceTitle: string;
  sourceUrl: string;
  title: ConversationLearnerText;
  note: ConversationLearnerText;
  phases: readonly [AuthoredPhase, AuthoredPhase, AuthoredPhase];
}

function createFamily(input: FamilyInput): SeasonalConversationFamily {
  const scenarioIds = {
    before: `seasonal-${input.id}-before`,
    active: `seasonal-${input.id}-active`,
    after: `seasonal-${input.id}-after`
  } as const;
  const source = {
    title: input.sourceTitle,
    url: input.sourceUrl,
    accessedOn: ACCESSED_ON
  } as const;
  const definitions = input.phases.map((phase) => createDefinition(
    input.id,
    input.topic,
    input.world,
    source,
    phase,
    scenarioIds[phase.phase]
  ));
  const event: SeasonalEvent = {
    id: input.id,
    displayName: input.displayName,
    contentKey: `seasonal.${input.id}`,
    category: input.category,
    dateRule: { kind: "annual", start: { month: input.month, day: input.day } },
    timeZone: "Asia/Tokyo",
    scope: { kind: "japan", label: "Japan calendar learning anchor" },
    associations: {
      before: [scenarioIds.before],
      active: [scenarioIds.active],
      after: [scenarioIds.after]
    },
    provenance: { source: input.sourceUrl, accessedOn: ACCESSED_ON }
  };
  return { event, title: input.title, note: input.note, definitions };
}

function createDefinition(
  eventId: string,
  topic: string,
  world: string,
  source: { title: string; url: string; accessedOn: string },
  authored: AuthoredPhase,
  scenarioId: string
): ConversationSessionDefinition {
  const completionId = `${scenarioId}-completion`;
  const steps: ConversationScenario["steps"][number][] = [];
  const responses: ConversationSessionDefinition["responses"][number][] = [];
  authored.turns.forEach((turn, index) => {
    const turnId = index + 1;
    const partnerStepId = `${scenarioId}-partner-${turnId}`;
    const learnerStepId = `${scenarioId}-learner-${turnId}`;
    const nextStepId = authored.turns[index + 1]
      ? `${scenarioId}-partner-${turnId + 1}`
      : completionId;
    const examples = turn.answers.map((answer, answerIndex) => {
      const optionId = answerIndex === 0 ? "a" : "b";
      const responseExampleId = `${scenarioId}-turn-${turnId}-${optionId}`;
      const branchId = `${scenarioId}-turn-${turnId}-${optionId}-path`;
      const feedback: CuratedConversationResponse<ConversationSkillId> = {
        id: `${responseExampleId}-feedback`,
        responseJapanese: answer.japanese,
        context: {
          situation: authored.situation.textI18n?.en ?? authored.situation.textZh,
          relationship: authored.relationship.textI18n?.en ?? authored.relationship.textZh,
          discourse: answer.discourse
        },
        feedback: answer.profile
      };
      responses.push({ stepId: learnerStepId, responseExampleId, branchId, feedback });
      return {
        id: responseExampleId,
        kind: answerIndex === 0 ? "suggested" as const : "accepted" as const,
        japanese: answer.japanese,
        ...(answer.explanation ? { explanation: answer.explanation } : {})
      };
    });
    steps.push(
      {
        id: partnerStepId,
        kind: "partner_line",
        japanese: turn.partnerLine,
        nextStepId: learnerStepId
      },
      {
        id: learnerStepId,
        kind: "learner_response",
        prompt: turn.prompt,
        responseExamples: examples,
        branches: examples.map((example) => ({
          id: `${example.id}-path`,
          nextStepId
        })),
        defaultBranchId: `${examples[0].id}-path`
      }
    );
  });
  steps.push({ id: completionId, kind: "completion", summary: authored.completion });

  const scenario: ConversationScenario = {
    id: scenarioId,
    topic,
    world,
    situation: authored.situation,
    relationship: {
      learnerRole: authored.learnerRole,
      partnerRole: authored.partnerRole,
      context: authored.relationship
    },
    length: authored.length,
    primarySkills: authored.primarySkills,
    difficulty: authored.difficulty,
    objective: authored.objective,
    instruction: authored.instruction,
    startStepId: `${scenarioId}-partner-1`,
    steps,
    seasonalAssociation: { eventId },
    sources: [source]
  };
  return { scenario, responses };
}

const BASIC_SUPPORTIVE: ConversationDifficulty = {
  linguisticComplexity: "basic",
  partnerSupport: "supportive",
  relationshipDistance: "neutral",
  topicDepth: "concrete",
  interactionPressure: "low"
};

const INTERMEDIATE_SOCIAL: ConversationDifficulty = {
  linguisticComplexity: "intermediate",
  partnerSupport: "balanced",
  relationshipDistance: "familiar",
  topicDepth: "personal",
  interactionPressure: "normal"
};

const ADVANCED_REFLECTIVE: ConversationDifficulty = {
  linguisticComplexity: "advanced",
  partnerSupport: "balanced",
  relationshipDistance: "neutral",
  topicDepth: "abstract",
  interactionPressure: "normal"
};

function answer(
  japanese: string,
  explanation: ConversationLearnerText,
  discourse: string,
  profile: ResponseProfile
): AuthoredAnswer {
  return { japanese, explanation, discourse, profile };
}

function reply(japanese: string, discourse: string, profile: ResponseProfile): AuthoredAnswer {
  return { japanese, discourse, profile };
}

function turn(
  partnerLine: string,
  prompt: ConversationLearnerText,
  first: AuthoredAnswer,
  second: AuthoredAnswer
): AuthoredTurn {
  return { partnerLine, prompt, answers: [first, second] };
}

function phase(
  value: Omit<AuthoredPhase, "phase"> & { phase: AuthoredPhase["phase"] }
): AuthoredPhase {
  return value;
}

interface PhaseDraft extends Omit<AuthoredPhase, "phase" | "turns"> {
  phase: AuthoredPhase["phase"];
  partner: string;
  prompt: ConversationLearnerText;
  choices: readonly [
    { japanese: string; discourse: string; profile: ResponseProfile },
    { japanese: string; discourse: string; profile: ResponseProfile }
  ];
  followUps?: readonly {
    partner: string;
    prompt: ConversationLearnerText;
    choices: readonly [
      { japanese: string; discourse: string; profile: ResponseProfile },
      { japanese: string; discourse: string; profile: ResponseProfile }
    ];
  }[];
}

function draftPhase(value: PhaseDraft): AuthoredPhase {
  const turns = [
    turn(
      value.partner,
      value.prompt,
      reply(value.choices[0].japanese, value.choices[0].discourse, value.choices[0].profile),
      reply(value.choices[1].japanese, value.choices[1].discourse, value.choices[1].profile)
    ),
    ...(value.followUps ?? []).map((next) => turn(
      next.partner,
      next.prompt,
      reply(next.choices[0].japanese, next.choices[0].discourse, next.choices[0].profile),
      reply(next.choices[1].japanese, next.choices[1].discourse, next.choices[1].profile)
    ))
  ];
  return {
    phase: value.phase,
    length: value.length,
    learnerRole: value.learnerRole,
    partnerRole: value.partnerRole,
    relationship: value.relationship,
    situation: value.situation,
    objective: value.objective,
    instruction: value.instruction,
    primarySkills: value.primarySkills,
    difficulty: value.difficulty,
    turns,
    completion: value.completion
  };
}

const familyInputs: readonly FamilyInput[] = [
  {
    id: "new-year",
    displayName: "元日",
    category: "holiday",
    month: 1,
    day: 1,
    topic: "New Year plans and reflection",
    world: "A Japan-based conversation about personally chosen New Year routines",
    sourceTitle: "Cabinet Office — About National Holidays",
    sourceUrl: CABINET_URL,
    title: text("元日與年始", "元日と年始", "New Year and the first days of the year"),
    note: text(
      "元日是日本的國定假日。年始的過法因人而異，對話不預設旅行、參拜或家庭聚會。",
      "元日は日本の国民の祝日です。年始の過ごし方は人それぞれなので、旅行や参拝、家族の集まりを前提にしません。",
      "New Year's Day is a Japanese national holiday. New Year routines vary; these scenes do not assume travel, shrine visits, or family gatherings."
    ),
    phases: [
      phase({
        phase: "before", length: "short", learnerRole: "coworker", partnerRole: "coworker",
        relationship: text("平常會閒聊、使用親切禮貌語氣的同事。", "普段から話す、親しみのある丁寧な同僚。", "Coworkers who chat casually in friendly polite Japanese."),
        situation: text("年末，兩位同事聊到年始想怎麼放鬆；彼此都還沒決定具體安排。", "年末、同僚同士で年始にどう休みたいか話しています。具体的な予定はまだ決めていません。", "At year end, coworkers talk about how they might relax around New Year; neither has committed to a specific plan."),
        objective: text("說一個低壓力的年始想法，再問對方偏好的步調。", "年始にしたい気軽なことを一つ話し、相手の過ごし方を尋ねましょう。", "Share one low-pressure idea for the New Year period and ask about the partner's preferred pace."),
        instruction: text("不預設旅行或家人聚會，分享一個自己可選擇的想法並把話題交回去。", "旅行や家族の集まりを前提にせず、自分で選べる予定を一つ話して相手にも尋ねましょう。", "Do not assume travel or family gatherings; share an optional personal idea and return the turn."),
        primarySkills: ["share", "bounce"], difficulty: BASIC_SUPPORTIVE,
        turns: [turn(
          "年始の休み、少しゆっくりできたらいいなと思っています。何か考えていますか？",
          text("回應同事對放鬆的期待，分享自己可選擇的年始想法。", "同僚の休みたい気持ちに応じて、自分で選べる年始の過ごし方を話しましょう。", "Respond to the coworker's hope for rest with an optional way you might spend the New Year period."),
          answer("私も家で本を読んだり、のんびりしたりしたいです。休みの日はどんなふうに過ごすのが好きですか？", text("分享在家閱讀與休息的個人想法，再詢問同事偏好的步調。", "家で本を読んだり休んだりしたいと話し、同僚の好みも尋ねます。", "You share a personal, low-pressure idea and ask about the coworker's preference."), "The learner returns the turn with an optional question about the coworker's preferred pace.", ANSWER_AND_RETURN),
          answer("私は近所を散歩して気分を変えたいです。年始は家で過ごすのと外に出るのと、どちらが好きですか？", text("提出近處散步這個簡單選項，再詢問同事的偏好。", "近所を散歩する案を話し、年始の過ごし方の好みを尋ねます。", "You offer a simple local option and ask which pace the coworker prefers."), "The learner offers an optional idea and returns the turn without presuming a shared plan.", ANSWER_AND_RETURN)
        )],
        completion: text("你分享了可自由選擇的年始休息方式，也讓同事有機會談自己的偏好。", "自分で選べる年始の過ごし方を話し、同僚の好みも尋ねられました。", "You shared an optional way to rest around New Year and gave the coworker room to share a preference.")
      }),
      phase({
        phase: "active", length: "medium", learnerRole: "classmate", partnerRole: "classmate",
        relationship: text("平常會聊天、能自然分享日常觀察的同學。", "普段から話す、日常のことを自然に話せるクラスメート。", "Classmates who regularly share everyday observations."),
        situation: text("元日，兩位同學在安靜的公共休息空間短暫聊天；沒有假設任何節慶活動。", "元日、静かな公共の休憩スペースでクラスメート同士が少し話しています。特定の行事への参加は前提にしません。", "On New Year's Day, classmates chat briefly in a quiet public rest area; no particular holiday activity is assumed."),
        objective: text("回應對方選擇安靜度過的方式，分享一個當下觀察，再問對方感受。", "静かに過ごすという相手の話に応じ、今感じていることを一つ加えて尋ね返しましょう。", "Respond to the partner's quiet choice, add one present observation, and ask how it feels for them."),
        instruction: text("先回應對方，再分享自己的小觀察；不要假設所有人都會慶祝。", "相手の話に応じて自分の小さな気づきを話しましょう。誰もが同じ祝い方をするとは考えません。", "Respond and share one small observation without assuming everyone celebrates in the same way."),
        primarySkills: ["react", "share", "bounce"], difficulty: INTERMEDIATE_SOCIAL,
        turns: [
          turn("今日は人通りが少なくて、いつもより静かですね。家でゆっくりすることにしました。", text("回應對方選擇在家休息的分享，談談當下的公共空間。", "家で休むことにした相手の話に応じ、今の公共の場所の様子を話しましょう。", "Respond to the partner choosing to rest at home and comment on the present public space."),
            answer("本当に静かですね。私も今日は予定を入れず、ゆっくり過ごしています。こういう日は何をして休むのが好きですか？", text("認同現在較安靜的觀察，分享自己的休息方式，再詢問對方的偏好。", "今の静けさに触れ、自分の休み方を話してから相手の好みも尋ねます。", "You acknowledge the quiet, share your plan, and ask about the partner's preference."), "The learner responds to the shared observation and returns the topic with one optional question.", REACT_SHARE_AND_RETURN),
            answer("落ち着いた雰囲気ですね。こういう静かな時間は好きですか？", text("回應空間的氣氛，再詢問對方對安靜時間的感受。", "落ち着いた雰囲気に触れ、静かな時間が好きか相手に尋ねます。", "You respond to the calm atmosphere and ask the partner's preference."), "The learner notices the same setting and asks about the partner's own preference.", ACKNOWLEDGE_AND_INVITE)),
          turn("私は人が少ない場所で過ごすと、気持ちを切り替えやすいです。", text("接續對方對安靜空間的感受，分享自己的觀察並把話題交回對方。", "静かな場所で気持ちを切り替えやすいという相手の話を受け、自分の感想も添えて尋ね返しましょう。", "Build on the partner's preference for quiet places, share your own observation, and return the turn."),
            answer("私も静かな場所だと頭がすっきりします。何をしている時に一番落ち着きますか？", text("分享自己在安靜場所較能整理思緒的感受，再詢問對方的放鬆方式。", "静かな場所だと頭がすっきりするという感覚を話し、相手が落ち着く過ごし方を尋ねます。", "You share how quiet places help you clear your head and ask what helps the partner unwind."), "The learner adds a relevant personal detail and asks a focused question about the partner's current topic.", PERSONAL_DETAIL_AND_EXPAND),
            answer("私は短い散歩をすると気分が変わります。静かな場所では何をするのが好きですか？", text("分享散步如何幫助自己轉換心情，再詢問對方在安靜場所喜歡做什麼。", "短い散歩で気分が変わると話し、静かな場所で何をするのが好きか尋ねます。", "You share how a short walk affects your mood and ask what the partner enjoys in quiet places."), "The learner adds a relevant detail and develops the partner's topic with one optional question.", PERSONAL_DETAIL_AND_EXPAND))
        ],
        completion: text("你回應了同學的選擇，交換當下觀察與個人偏好，沒有假設共同的節慶習慣。", "相手の選択に応じ、今の様子や個人の好みを話せました。同じ習慣を前提にしていません。", "You responded to the classmate, exchanged present observations and preferences, and avoided assuming a shared holiday routine.")
      }),
      phase({
        phase: "after", length: "long", learnerRole: "coworker", partnerRole: "coworker",
        relationship: text("熟悉但仍保持職場禮貌的同事，可以談個人經驗而不追問私事。", "親しみはありますが職場の礼儀を保つ同僚です。個人的な経験は話せますが、私事を問い詰めません。", "Coworkers who know one another but keep workplace politeness; personal experience is welcome without prying."),
        situation: text("元日過後，同事們回顧在家休息或短暫散步等自己選擇的休息方式。", "元日を過ごした後、同僚同士で家で休んだり短い散歩をしたりした経験を話しています。", "After New Year’s Day, coworkers reflect on chosen ways to rest, such as staying home or taking a short walk."),
        objective: text("敘述一段安靜休息的經驗，理解不同偏好，再連結到平日短暫休息方式。", "静かに休んだ経験を話し、違う好みも受け止め、普段の短い休み方へ話をつなげましょう。", "Narrate a quiet break, recognize a different preference, and bridge to a brief everyday rest routine."),
        instruction: text("說明一個選擇的理由，回應對方不同的經驗，再分享適合自己的短暫休息方式。", "選んだ理由を話し、相手の違う経験にも応じて、自分に合う短い休み方を話しましょう。", "Explain one choice, respond to a different experience, and describe a brief routine that suits you."),
        primarySkills: ["narrate", "agree_disagree", "share"], difficulty: INTERMEDIATE_SOCIAL,
        turns: [
          turn("年始は家で静かに過ごしました。外に出た時間も少しありましたか？", text("敘述自己在家休息的經驗，再回答對方關於外出的問題。", "家で静かに過ごした経験を話し、外出した時間があったか答えましょう。", "Narrate how you spent quiet time at home and answer whether you went out at all."),
            answer("家で過ごす時間が多かったです。外には出ず、読みかけの本を一冊読み終えて、気持ちに余裕ができました。", text("用具體經驗敘述在家的休息方式與感受。", "家で本を読み終えた経験と、その時に感じた余裕を具体的に話します。", "You narrate a concrete home activity and how it gave you a little breathing room."), "The learner narrates a personal experience and its effect without claiming the same choice suits everyone.", NARRATE_AND_REFLECT),
            answer("近所を一度歩きましたが、ほとんどは家で休みました。外に出ると気分が変わりますね。", text("同時提到短暫外出與在家休息，分享兩種安排帶來的感受。", "近所を歩いたことと家で休んだことを伝え、外出の気分転換について話します。", "You describe both a brief walk and time at home, comparing how each felt."), "The learner shares a balanced account that can connect with either homebody or outing preferences.", NARRATE_AND_REFLECT)),
          turn("私は少し歩くと気分転換になりますが、混んでいる場所は避けたいです。", text("回應對方喜歡散步但避開人潮的偏好，並分享自己的相近或不同想法。", "散歩は気分転換になる一方、人の多い場所は避けたいという相手の話に応じましょう。", "Respond to the partner enjoying walks but preferring to avoid crowds, and acknowledge the difference."),
            answer("その感じは分かります。私も人が多い場所より、静かな道を歩くほうが落ち着きます。", text("認同避開人潮的感受，並補充自己偏好安靜道路的理由。", "人混みを避けたい気持ちに共感し、自分も静かな道が落ち着くと話します。", "You acknowledge the preference and explain why a quieter route works for you too."), "The learner acknowledges the partner and adds a related personal preference.", ACKNOWLEDGE_AND_SHARE),
            answer("私は人の多い所も時々楽しめますが、休みには静かな場所を選びがちです。", text("說明自己的偏好不完全相同，再談休息時的選擇。", "好みが完全には同じでないことを伝え、休みの日に選びやすい場所を話します。", "You show that your preference differs somewhat and explain what you tend to choose when resting."), "The learner can respectfully hold a different preference while recognizing that both choices can suit different days.", DIFFERENT_VIEW_WITH_REASON)),
          turn("休み方はいろいろですね。忙しい週の途中なら、どんな短い休み方が合いますか？", text("從年始經驗連結到一般忙碌週中的休息方式。", "年始の経験から、忙しい週の途中に合う短い休み方へ話をつなげましょう。", "Bridge from the holiday account to a brief way of resting during a busy week."),
            answer("私は昼休みに外の空気を吸うと気分が変わります。短くても席を離れるのが合っています。", text("近期的午休經驗說明短暫離席如何幫助自己休息。", "昼休みに外の空気を吸う例を挙げ、短くても席を離れるのが合うと話します。", "You describe how stepping outside briefly during lunch helps you reset."), "The learner bridges the holiday reflection to a concrete personal routine.", ANSWER_ONLY),
            answer("温かい飲み物を用意して、数分だけ静かにすることがあります。短い時間でも落ち着けます。", text("用具體例子說明短暫安靜如何帶來休息。", "温かい飲み物を用意して数分静かにする例を挙げ、その効果を話します。", "You describe a short quiet pause with a warm drink and how it helps."), "The learner connects the reflection to a specific personal routine.", ANSWER_ONLY))
        ],
        completion: text("你敘述了自己的年始經驗、理解不同的休息偏好，也連結到適合平日的短暫休息方式。", "年始の経験を話し、違う好みも受け止めながら、普段の忙しい週に合う休み方へ話をつなげられました。", "You narrated your New Year experience, recognized a different preference, and bridged to a brief routine for a busy week.")
      })
    ]
  },
  {
    id: "foundation-day", displayName: "建国記念の日", category: "holiday", month: 2, day: 11,
    topic: "A personal day-off routine", world: "A Japan calendar learning-anchor conversation about optional time off",
    sourceTitle: "Cabinet Office — About National Holidays", sourceUrl: CABINET_URL,
    title: text("建國紀念日與個人安排", "建国記念の日と自分の過ごし方", "Foundation Day and personal plans"),
    note: text("這是日本的國定假日，但每個人的休假與活動安排不同。", "日本の国民の祝日ですが、休みや過ごし方は人によって異なります。", "A Japanese national holiday learning anchor; days off and personal plans vary."),
    phases: [
      draftPhase({ phase:"before", length:"short", learnerRole:"coworker", partnerRole:"coworker", relationship:text("平常會簡短聊天的同事。","普段少し話す同僚。","Coworkers who chat briefly."), situation:text("同事查看行事曆，談到二月的休息安排，尚未確認是否休假。","同僚が予定表を見ながら二月の休みについて話しています。休みかどうかはまだ確認していません。","Coworkers look at a calendar and discuss February plans without assuming either is off."), objective:text("分享一個可自由選擇的空檔安排，不預設對方休假。","休みかどうかを決めつけず、空き時間の案を一つ話しましょう。","Share a tentative idea for free time without assuming a day off; asking back is optional."), instruction:text("不預設對方休假，分享一個自己可選擇的安排。","相手が休みだと決めつけず、自分で選べる過ごし方を話しましょう。","Do not assume the partner is off; share an optional idea."), primarySkills:["share"], difficulty:BASIC_SUPPORTIVE, partner:"二月の祝日、休めるかまだ分かりませんが、予定は考えていますか？", prompt:text("回答是否已有想法，也讓對方保留不確定的空間。","予定があるか答えつつ、まだ分からない相手にも余地を残しましょう。","Answer while leaving room for the partner's uncertainty."), choices:[{japanese:"まだ決めていません。休めたら、近所で昼食をとりたいです。",discourse:"The learner gives a tentative local idea without presuming a day off.",profile:ANSWER_ONLY},{japanese:"特に決めていません。もし休めたら、家でゆっくりしたいです。",discourse:"The learner answers with an optional, low-pressure preference.",profile:ANSWER_ONLY}], completion:text("你分享了不必確定的個人想法，也沒有假設大家的休假狀況相同。","決めつけずに自分の考えを話し、それぞれの休み方が違うことも保てました。","You shared an optional idea without assuming everyone has the same schedule.") }),
      draftPhase({ phase:"active", length:"short", learnerRole:"participant", partnerRole:"participant", relationship:text("在社區活動中初次交談的參加者。","地域の催しで初めて話す参加者同士。","Participants meeting at a community event."), situation:text("活動場地外，參加者聊到今天各自的安排。","会場の外で、参加者が今日の予定を少し話しています。","Participants briefly discuss their own plans outside a venue."), objective:text("談一個自己選擇的活動或休息方式。","自分で選んだ活動や休み方を一つ話しましょう。","Share one activity or way to rest that you chose."), instruction:text("只談自己的安排，不把它說成普遍習慣。","自分の予定として話し、皆の習慣だとは言わないようにしましょう。","Keep it personal rather than describing a universal custom."), primarySkills:["react","share"], difficulty:BASIC_SUPPORTIVE, partner:"この後は予定を入れず、家で過ごすつもりです。", prompt:text("回應對方的個人選擇，分享自己不同或相近的安排。","相手の選択に応じ、自分の似た過ごし方や違う予定を話しましょう。","Respond to the partner's choice with your own similar or different plan."), choices:[{japanese:"家で過ごすのもいいですね。私は近所を少し歩くつもりです。",discourse:"The learner acknowledges the partner and shares a different personal option.",profile:ACKNOWLEDGE_AND_SHARE},{japanese:"私も静かに過ごすのが好きです。今日は読みかけの本を読むつもりです。",discourse:"The learner responds with a comparable personal preference.",profile:ACKNOWLEDGE_AND_SHARE}], completion:text("你回應了對方的選擇，並清楚說明這是自己的安排。","相手の選択に応じ、自分の予定として話せました。","You responded to the partner while keeping your plan personal.") }),
      draftPhase({ phase:"after", length:"short", learnerRole:"classmate", partnerRole:"classmate", relationship:text("平常友善交談的同學。","普段から気軽に話すクラスメート。","Classmates who talk comfortably."), situation:text("休息日過後，同學聊起一段短暫外出。","休みの後、クラスメート同士で短い外出の話をしています。","After a day off, classmates discuss a brief outing."), objective:text("回應對方提到的散步，詢問一項具體細節。","相手が話した散歩に応じ、具体的なことを一つ尋ねましょう。","Respond to the volunteered walk with a concrete follow-up question."), instruction:text("問題聚焦在對方已提到的經驗，不追問私人安排。","相手が話した経験について尋ね、私生活を問い詰めないようにしましょう。","Follow the volunteered experience without probing private plans."), primarySkills:["react","expand"], difficulty:INTERMEDIATE_SOCIAL, partner:"近所の公園を歩きました。風が気持ちよかったです。", prompt:text("回應對方的感受，詢問散步時注意到的景色或路線。","相手の感想に応じ、散歩中に見た景色や道について尋ねましょう。","Respond and ask about a detail from the walk."), choices:[{japanese:"風が気持ちよかったんですね。どんな景色が見えましたか？",discourse:"The learner follows up on the partner's volunteered walk.",profile:ACKNOWLEDGE_AND_INVITE},{japanese:"いい気分転換になりそうですね。公園の道は歩きやすかったですか？",discourse:"The learner asks one practical detail about the described outing.",profile:ACKNOWLEDGE_AND_INVITE}], completion:text("你接續了對方自願分享的散步經驗。","相手が話した散歩の経験を続けて尋ねられました。","You followed the partner's volunteered account of a walk.") })
    ]
  },
  {
    id:"hinamatsuri", displayName:"ひな祭り", category:"cultural_event", month:3, day:3,
    topic:"A public seasonal display", world:"An optional observation about a public Hinamatsuri display",
    sourceTitle:"JNTO — March seasonal guide", sourceUrl:HINAMATSURI_URL,
    title:text("雛祭與公共展示","ひな祭りと公共の飾り","Hinamatsuri and a public display"),
    note:text("3月3日是雛祭的文化學習錨點；家庭和地區的做法並不相同。","3月3日のひな祭りを学ぶための目印です。家庭や地域の習慣は一様ではありません。","March 3 is a cultural learning anchor; household and regional customs vary."),
    phases:[
      draftPhase({phase:"before",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("工作場合中友善但有禮的同事。","職場で親しみはあるが礼儀を保つ同僚。","Friendly coworkers who keep workplace politeness."),situation:text("同事在公共大廳看到季節展示的公告。","同僚が公共スペースで季節の展示案内を見ています。","Coworkers notice a seasonal display announcement in a public lobby."),objective:text("回答自己是否有興趣，不假設對方的慶祝方式。","展示に興味があるか答え、個人の祝い方は前提にしないようにしましょう。","Answer whether you are interested; a follow-up question is optional."),instruction:text("把展示當成可選的公共觀察，不涉及家庭或性別。","公共の展示として話し、家庭や性別の話を前提にしないようにしましょう。","Treat this as an optional public display, without assumptions about family or gender."),primarySkills:["share","negotiate"],difficulty:BASIC_SUPPORTIVE,partner:"ロビーにひな人形の展示があるそうです。見に行ってみますか？",prompt:text("回答是否有興趣，並把選擇留給對方。","興味があるか答え、相手にも選ぶ余地を残しましょう。","Say whether you are interested and leave the choice open."),choices:[{japanese:"少し見てみたいです。展示の案内を読んでから行きましょう。",discourse:"The learner accepts the optional public invitation and suggests checking its notice.",profile:ACCEPT_AND_SUGGEST},{japanese:"今日は時間がないので、また機会があれば見たいです。",discourse:"The learner declines politely without implying a customary obligation.",profile:POLITE_DECLINE}],completion:text("你以可選擇的公共展示為話題，沒有假設私人慶祝習慣。","任意で見られる展示の話をし、個人の習慣は決めつけませんでした。","You discussed an optional public display without assuming a private custom.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"participant",partnerRole:"participant",relationship:text("在公共文化空間偶然交談的參觀者。","公共の文化施設で話す来館者同士。","Visitors chatting in a public cultural space."),situation:text("兩位參觀者看著入口附近的雛人形展示。","来館者が入口近くのひな人形の展示を見ています。","Visitors look at a display of hina dolls near an entrance."),objective:text("描述一個可見的展示細節；想延伸時，也可以邀請對方補充。","見える展示の特徴を一つ話しましょう。質問は任意です。","Mention one visible feature; inviting the partner to add another is optional."),instruction:text("談展示的顏色或配置，不把它說成所有人都會做的習俗。","色や配置について話し、誰もが行う習慣とは言わないようにしましょう。","Discuss colors or arrangement without calling it universal."),primarySkills:["share","expand"],difficulty:BASIC_SUPPORTIVE,partner:"人形の着物は色の組み合わせがきれいですね。",prompt:text("回應一個可見細節；想延伸時，也可以談展示的另一個部分。","見える特徴に応じましょう。展示の別の部分を話すかは任意です。","Respond to one visible feature; you may add another detail about the display."),choices:[{japanese:"落ち着いた色ですね。並べ方にも工夫があるように見えます。",discourse:"The learner notices the visible colors and arrangement without claiming expertise.",profile:REACT_AND_EXPAND},{japanese:"本当にきれいですね。小さな道具も丁寧に作られていますね。",discourse:"The learner adds another observable detail to the shared topic.",profile:REACT_AND_EXPAND}],followUps:[{partner:"段ごとに少しずつ違う道具が置かれていますね。",prompt:text("接續對方指出的配置，也可以分享自己感興趣的部分。","段ごとの道具の違いに触れ、気になった部分を共有するのは任意です。","Respond to the arrangement; optionally share which visible part caught your attention."),choices:[{japanese:"私は小さな道具が気になりました。どの部分をよく見ましたか？",discourse:"The learner shares an observation and asks about the partner's chosen detail.",profile:PERSONAL_DETAIL_AND_EXPAND},{japanese:"段ごとに違いがあるんですね。説明の札も読んでみたいです。",discourse:"The learner responds to the display and proposes reading its public caption.",profile:REACT_AND_SHARE}]}],completion:text("你觀察並分享了展示中的具體細節。","展示の具体的な特徴を見て、気づいたことを共有できました。","You noticed and exchanged concrete display details.")}),
      draftPhase({phase:"after",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("平常會分享公共空間見聞的同學。","公共の場所で見たものを話すクラスメート。","Classmates who share observations from public places."),situation:text("參觀者回想最近看過的一個季節展示。","最近見た季節の展示をクラスメート同士で振り返っています。","Classmates recall a seasonal display they recently saw."),objective:text("分享一個自己記得的展示細節。","覚えている展示の特徴を一つ話しましょう。","Share one detail you remember from the display."),instruction:text("只說自己的觀察，不推論對方家庭的習慣。","自分の見たことを話し、相手の家庭の習慣は推測しないようにしましょう。","Share your observation without guessing about the partner's family."),primarySkills:["share"],difficulty:INTERMEDIATE_SOCIAL,partner:"展示の中で、どんなところが印象に残りましたか？",prompt:text("回想一個自己記得的展示細節。","覚えている展示の特徴を一つ思い出しましょう。","Recall one detail you remember from the display."),choices:[{japanese:"入口の近くにあった人形の表情が印象に残りました。",discourse:"The learner recalls one detail from a personally viewed display.",profile:ANSWER_ONLY},{japanese:"色の違いが分かりやすかったです。あなたはどこをよく覚えていますか？",discourse:"The learner answers and returns the shared observation topic.",profile:ANSWER_AND_RETURN}],completion:text("你分享了一個自己記得的展示觀察。","覚えている展示の特徴を一つ話せました。","You shared one observation that you remembered.")})
    ]
  },
  {
    id:"school-year-start",displayName:"新学年の始まり",category:"cultural_event",month:4,day:1,
    topic:"A change in school routine",world:"A conversation around the statutory school-year boundary for primary and lower-secondary education",
    sourceTitle:"MEXT — School age and school year",sourceUrl:MEXT_URL,
    title:text("學年開始與日常變化","新学年と日々の変化","A new school year and daily routines"),
    note:text("4月1日是日本小學與國中法定學年的開始日；各校典禮和其他機構安排不同。","4月1日は小学校・中学校の法定学年の開始日です。式典や他の機関の日程は異なります。","April 1 is the statutory school-year start for elementary and lower-secondary education; ceremonies and other institutions vary."),
    phases:[
      draftPhase({phase:"before",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("一起上日語課、會聊學習方法的同學。","日本語の授業を一緒に受け、勉強方法を話すクラスメート。","Classmates who share a Japanese class and discuss study routines."),situation:text("新學年將近，同學討論如何整理新的學習節奏。","新学年が近づき、クラスメート同士で勉強のペースを考えています。","As the school-year boundary approaches, classmates discuss a study routine."),objective:text("分享一個自己想調整的小習慣。","自分が少し変えたい習慣を一つ話しましょう。","Share one small habit you would like to adjust."),instruction:text("談個人目標，不假設所有學校或課程同時開學。","自分の目標として話し、学校や授業が一斉に始まるとは言わないようにしましょう。","Keep it personal; do not imply all schools or courses start together."),primarySkills:["share","bounce"],difficulty:BASIC_SUPPORTIVE,partner:"新しい学年に向けて、勉強の時間を少し見直そうと思っています。",prompt:text("分享一個可行的小調整，再詢問對方想嘗試什麼。","できそうな小さな工夫を話し、相手が試したいことも尋ねましょう。","Share one manageable adjustment and ask what the partner may try."),choices:[{japanese:"私は授業の後に短く復習してみたいです。何か試してみたい習慣はありますか？",discourse:"The learner proposes a personal study habit and returns the turn.",profile:ANSWER_AND_RETURN},{japanese:"私は机の上を整えてから勉強を始めたいです。どんな工夫を考えていますか？",discourse:"The learner offers a small routine and asks about the partner's idea.",profile:ANSWER_AND_RETURN}],completion:text("你分享了個人的小目標，也留出空間聽對方的想法。","自分の小さな目標を話し、相手の考えも聞けました。","You shared a personal goal and invited the partner's idea.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("同一門課中熟悉的同學。","同じ授業で顔なじみのクラスメート。","Familiar classmates in the same course."),situation:text("四月初，同學交換最近課堂上的新觀察。","四月の初め、授業で気づいたことを話しています。","In early April, classmates share a recent class observation."),objective:text("回應對方的觀察，再說一個自己的日常改變。","相手の気づきに応じ、自分の日常の変化も一つ話しましょう。","Respond to an observation and share one change in your routine."),instruction:text("以個人經驗為範圍，不把日期推廣到所有學校。","個人の経験として話し、すべての学校の日程に広げないようにしましょう。","Speak from personal experience without generalizing school calendars."),primarySkills:["react","share"],difficulty:INTERMEDIATE_SOCIAL,partner:"新しいノートを使い始めたら、前より見返しやすくなりました。",prompt:text("回應對方的整理方式，分享自己最近的一個小改變。","相手の工夫に応じ、最近の自分の小さな変化を話しましょう。","Respond to the partner's method and share a small change of your own."),choices:[{japanese:"見返しやすいのはいいですね。私は課題を小さく分けて書くようにしました。",discourse:"The learner responds and shares a personally adopted study method.",profile:REACT_AND_SHARE},{japanese:"それは便利そうですね。私は授業の後に要点を一行だけ残しています。",discourse:"The learner adds one concrete personal routine to the topic.",profile:REACT_AND_SHARE}],completion:text("你回應了同學的做法，也交換了個人的日常觀察。","相手の工夫に応じ、自分の日々の気づきも話せました。","You responded to the classmate's method and shared a personal observation.")}),
      draftPhase({phase:"after",length:"medium",learnerRole:"classmate",partnerRole:"classmate",relationship:text("能坦率交換學習經驗、彼此尊重差異的同學。","勉強の経験を率直に話し、違いも尊重するクラスメート。","Classmates who share study experiences and respect differences."),situation:text("學年開始後，同學回顧一項有用的新習慣，也談到不順利的部分。","新学年が始まった後、役に立った習慣と難しかった点を振り返っています。","After the school-year start, classmates reflect on a helpful new habit and one difficulty."),objective:text("分享一段混合經驗，追問對方有效的方法並把話題交回去。","うまくいった点と難しかった点を話し、相手の工夫も尋ねましょう。","Share a mixed experience, ask about the partner's method, and return the turn."),instruction:text("講述自己試過的做法與結果，避免把個人經驗當成通用建議。","試した方法と結果を話し、個人の経験を誰にでも当てはまる助言にしないようにしましょう。","Describe your own attempt without presenting it as universal advice."),primarySkills:["narrate","share","bounce"],difficulty:INTERMEDIATE_SOCIAL,partner:"毎日少し復習するのは続いていますが、予定が重なる日は難しいです。",prompt:text("說明自己如何調整學習時間，再詢問對方哪個時段較能持續。","自分がどう時間を調整したか話し、続けやすい時間帯を尋ねましょう。","Explain your adjustment and ask which time works for the partner."),choices:[{japanese:"私は帰宅後すぐではなく、夕食の後に短く復習するようにしました。どの時間が続けやすいですか？",discourse:"The learner narrates a specific adjustment and asks about the partner's routine.",profile:NARRATE_AND_RETURN},{japanese:"先日、予定が重なったので、復習を一問だけにしてみました。短くしたら取りかかりやすかったです。あなたはどう調整していますか？",discourse:"The learner recounts a recent adjustment and its result, then asks how the partner adapts.",profile:NARRATE_AND_RETURN}],followUps:[{partner:"時間を決めすぎず、できる日に短くやるのが合いそうです。",prompt:text("回應對方的彈性做法，再分享自己的看法。","相手の柔軟な方法に応じ、自分の考えも一つ話しましょう。","Respond to the flexible approach and share your view."),choices:[{japanese:"決めすぎないほうが続けやすいですね。私も忙しい日は短くすることにしています。",discourse:"The learner acknowledges and adds a related experience.",profile:ACKNOWLEDGE_AND_SHARE},{japanese:"その方法は無理がなさそうです。私は週に一度、できたことを見直したいです。",discourse:"The learner recognizes the approach and shares a different personal preference.",profile:ACKNOWLEDGE_AND_SHARE}]}],completion:text("你回顧了實際嘗試與調整，也尊重每個人的學習節奏不同。","試したことと調整を振り返り、人によって続けやすい方法が違うことも話せました。","You reflected on an actual adjustment and recognized that routines differ.")})
    ]
  },
  {
    id:"childrens-day",displayName:"こどもの日",category:"holiday",month:5,day:5,
    topic:"A public seasonal sight",world:"An optional observation of a Children’s Day public display",
    sourceTitle:"Cabinet Office — About National Holidays",sourceUrl:CABINET_URL,
    title:text("兒童節與公共景象","こどもの日と街の風景","Children’s Day and a public scene"),
    note:text("5月5日是國定假日；對話只談可選的公共景象，不預設育兒或家庭儀式。","5月5日は国民の祝日です。公共の風景を話題にし、子育てや家庭行事は前提にしません。","May 5 is a national holiday; scenes focus on optional public sights, not parenthood or family rituals."),
    phases:[
      draftPhase({phase:"before",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("會在午休聊附近街景的同事。","昼休みに近所の様子を話す同僚。","Coworkers who chat about nearby sights at lunch."),situation:text("同事在街上看到懸掛鯉魚旗的活動公告。","同僚が街でこいのぼりの展示案内を見かけました。","Coworkers notice a public koinobori display announcement."),objective:text("分享自己是否想去看看，不預設對方的選擇。","見に行きたいかどうかを自分の考えとして話しましょう。","Share whether you are interested; a follow-up question is optional."),instruction:text("只談可選的公共活動，不預設對方有孩子。","任意の公共イベントとして話し、相手に子どもがいるとは決めつけないようにしましょう。","Keep it an optional public event; do not assume the partner has children."),primarySkills:["share"],difficulty:BASIC_SUPPORTIVE,partner:"駅前にこいのぼりが飾られるそうです。見に行く予定はありますか？",prompt:text("回答是否有興趣；也可以不追問。","興味があるか答え、相手が見たいところは、必要なら聞いてみましょう。","Say whether you are interested; a follow-up question is optional."),choices:[{japanese:"少し見てみたいです。風で動くところが気になります。",discourse:"The learner answers and names a visible feature of interest.",profile:ANSWER_ONLY},{japanese:"まだ決めていません。通りかかった時に見られたら十分です。",discourse:"The learner gives a noncommittal personal preference.",profile:ANSWER_ONLY}],completion:text("你談了可自由選擇的公共展示，沒有假設對方的家庭狀況。","任意で見られる展示について話し、相手の家庭事情は推測しませんでした。","You discussed an optional public display without assuming the partner's family situation.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"participant",partnerRole:"participant",relationship:text("在公園入口偶然聊天的參觀者。","公園の入口で話す来園者同士。","Visitors chatting at a park entrance."),situation:text("參觀者看到空中飄動的鯉魚旗。","来園者が空に泳ぐこいのぼりを見ています。","Visitors watch koinobori moving overhead."),objective:text("描述一個眼前的細節；對方也可以補充觀察。","目の前の特徴を一つ話しましょう。相手の感想は必要なら聞けます。","Describe one visible detail; the partner may add another observation."),instruction:text("以眼前看到的景象為限，不宣稱每個家庭都會展示。","今見えている風景を話し、どの家庭も飾るとは言わないようにしましょう。","Stay with the visible scene; do not claim every household displays them."),primarySkills:["react","expand"],difficulty:BASIC_SUPPORTIVE,partner:"風が吹くと、旗が大きく動きますね。",prompt:text("回應旗子的動態，也可以補充自己注意到的其他細節。","旗の動きに応じ、気づいた特徴を話しましょう。","Respond to the movement; optionally add another detail you noticed."),choices:[{japanese:"空を泳いでいるようですね。色の並びもきれいです。",discourse:"The learner responds to the visible movement and adds a visual detail.",profile:REACT_AND_EXPAND},{japanese:"風があるとよく動きますね。近くで見ると模様も違いますか？",discourse:"The learner follows the visible scene with a specific optional question.",profile:ACKNOWLEDGE_AND_INVITE}],completion:text("你描述了眼前可見的景象，也交換了觀察。","目の前の風景を話し、観察を交換できました。","You described the visible scene and exchanged observations.")}),
      draftPhase({phase:"after",length:"medium",learnerRole:"classmate",partnerRole:"classmate",relationship:text("平常會交換生活見聞的同學。","日々の見聞を話すクラスメート。","Classmates who share everyday observations."),situation:text("同學比較在公園與河邊看過的公共季節展示，以及各自注意到的小細節。","クラスメートが公園や川沿いで見た季節展示と、そこで気づいたことを比べています。","Classmates compare public seasonal displays they saw in a park and by a river."),objective:text("比較公共展示的觀察，追問對方自願提到的一項具體細節。","公共展示の観察を比べ、相手が話した具体的なことを尋ねましょう。","Compare observations of the public displays and ask one concrete follow-up about what the partner volunteered."),instruction:text("分享個人印象，避免把文化景象說成每個人都參與的儀式。","個人の印象として話し、誰もが参加する儀式とは言わないようにしましょう。","Keep it personal rather than describing a universal ritual."),primarySkills:["share","expand"],difficulty:INTERMEDIATE_SOCIAL,partner:"川沿いで見たこいのぼりは、場所によって大きさが違っていました。",prompt:text("回應對方的觀察，再詢問展示中的一項相關細節。","相手の観察に応じ、展示について関連することを一つ尋ねましょう。","Respond to the partner's observation and ask one related question about the display."),choices:[{japanese:"大きさで見え方も変わりますね。私は色の組み合わせをよく覚えています。川沿いは風が強かったですか？",discourse:"The learner acknowledges the size difference, adds a personal color observation, and asks a concrete follow-up.",profile:REACT_SHARE_AND_EXPAND},{japanese:"大きさが違うと印象も変わりますね。どの旗が一番目に留まりましたか？",discourse:"The learner responds and asks which visible item caught the partner's eye.",profile:ACKNOWLEDGE_AND_INVITE}],followUps:[{partner:"風はそれほど強くありませんでした。大きな赤いこいのぼりが目に留まりました。",prompt:text("比較兩個公共景象中自己注意到的一項細節。","場所による見え方の違いに触れ、自分が気づいた点を一つ話しましょう。","Compare one detail you noticed across the two public displays."),choices:[{japanese:"公園では大きな旗が遠くからも目に入りましたが、川沿いでは風で動く旗が印象に残りました。場所が違うと見え方も変わりますね。",discourse:"The learner compares concrete observations from the park and riverside.",profile:COMPARE_OBSERVATIONS},{japanese:"川沿いでは風で動く旗に目が留まりました。公園では色の並びが見やすく、同じ展示でも場所で印象が変わりますね。",discourse:"The learner compares how the two locations changed the display's appearance.",profile:COMPARE_OBSERVATIONS}]}],completion:text("你分享並比較了公共展示中的具體觀察。","公共の展示で気づいたことを話し、具体的な違いも比べられました。","You shared and compared concrete observations from public displays.")})
    ]
  },
  {
    id:"time-day",displayName:"時の記念日",category:"cultural_event",month:6,day:10,
    topic:"A personally useful time routine",world:"A practical conversation about everyday timekeeping",
    sourceTitle:"Akashi Municipal Planetarium — Time Memorial Day",sourceUrl:TIME_DAY_URL,
    title:text("時間紀念日與生活節奏","時の記念日と日々の時間","Time Memorial Day and daily routines"),
    note:text("6月10日是時間文化的學習錨點，不是國定假日，也不要求特定作息。","6月10日は時間文化を学ぶ目印です。国民の祝日ではなく、特定の習慣を求めるものでもありません。","June 10 is a time-culture learning anchor, not a national holiday or a prescribed routine."),
    phases:[
      draftPhase({phase:"before",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("會交換工作流程小技巧的同事。","仕事の小さな工夫を話す同僚。","Coworkers who exchange small workflow tips."),situation:text("同事想重新安排一項日常提醒。","同僚が日々のリマインダーを見直そうとしています。","Coworkers consider adjusting an everyday reminder."),objective:text("詢問一項對對方有用的時間習慣。","相手に役立っている時間の工夫を尋ねましょう。","Ask about a time routine that helps the partner."),instruction:text("分享個人做法，不把準時偏好說成唯一正確方式。","自分の方法として話し、時間の感覚を唯一の正解とはしないようにしましょう。","Share personal methods without presenting one punctuality preference as universal."),primarySkills:["share","bounce"],difficulty:BASIC_SUPPORTIVE,partner:"予定を忘れないように、何か工夫していますか？",prompt:text("分享一項自己使用的提醒方式，並問對方的做法。","自分が使う方法を一つ話し、相手にも尋ねましょう。","Share one reminder method and ask about the partner's."),choices:[{japanese:"私は前の日に予定をメモしています。どんな方法が使いやすいですか？",discourse:"The learner describes a personal reminder and returns the question.",profile:ANSWER_AND_RETURN},{japanese:"予定の少し前にアラームを設定します。あなたは何を使っていますか？",discourse:"The learner answers with an optional method and asks back.",profile:ANSWER_AND_RETURN}],completion:text("你分享了一個實用做法，也讓對方談自己的習慣。","役立つ工夫を話し、相手の方法も尋ねられました。","You shared a useful method and invited the partner's routine.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("互相尊重時間選擇的同學。","時間の使い方を尊重し合うクラスメート。","Classmates who respect one another's routines."),situation:text("同學在等候上課時聊到如何安排空檔。","授業を待つ間、クラスメートが空き時間の使い方を話しています。","Classmates discuss how to use a gap before class."),objective:text("回應對方的偏好，提出一個自己的實例。","相手の好みに応じ、自分の例を一つ話しましょう。","Respond to the preference with one example of your own."),instruction:text("用個人經驗比較方法，不評價他人的時間觀。","個人の経験として比べ、相手の時間感覚を評価しないようにしましょう。","Compare personal experience without judging the partner's time sense."),primarySkills:["react","share"],difficulty:INTERMEDIATE_SOCIAL,partner:"私は空き時間に次の用事を一つ確認すると、落ち着きます。",prompt:text("回應對方的做法，分享自己在空檔時的選擇。","相手の工夫に応じ、自分が空き時間にすることを話しましょう。","Respond to the method and share what you do in a gap."),choices:[{japanese:"次の予定を確認しておくと安心ですね。私は少し歩いて気分を切り替えます。",discourse:"The learner acknowledges the partner and shares a different routine.",profile:REACT_AND_SHARE},{japanese:"一つだけ確認するのは簡単でいいですね。私は短いメモを書きます。",discourse:"The learner responds and gives a related personal example.",profile:REACT_AND_SHARE}],completion:text("你交換了空檔安排方式，並尊重彼此偏好不同。","空き時間の使い方を交換し、それぞれの好みを尊重できました。","You exchanged ways to use a gap while respecting different preferences.")}),
      draftPhase({phase:"after",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("能坦率聊工作流程但不互相催促的同事。","仕事の流れを率直に話し、急かし合わない同僚。","Coworkers who discuss workflow without pressuring each other."),situation:text("同事回想一次普通的行程提醒，描述時鐘位置時說得不完整。","同僚が普段の予定確認を振り返り、時計の置き場所を説明しきれていません。","Coworkers recall an ordinary reminder and an incomplete description of where the clock was placed."),objective:text("釐清對方描述中不清楚的放置位置。","相手の説明で曖昧な置き場所を確かめましょう。","Clarify the unclear location in the partner's description."),instruction:text("談平常的提醒方式，不把情境說成緊急事故。","普段の工夫について話し、緊急事態のように扱わないようにしましょう。","Discuss an ordinary routine, not an emergency."),primarySkills:["repair"],difficulty:{...INTERMEDIATE_SOCIAL,topicDepth:"concrete"},partner:"机の近くに小さな時計を置いたら、時間を確認しやすくなりました。机の右側というか、壁の棚のあたりで……説明が少し曖昧ですね。",prompt:text("釐清對方提到的時鐘放置位置。","時計の置き場所について、曖昧な説明を一つ確かめましょう。","Repair the unclear placement detail with one ordinary clarification question."),choices:[{japanese:"壁の棚の近くというのは、机の右側ですか？",discourse:"The learner checks whether “near the wall shelf” means the right side of the desk.",profile:CLARIFY_ORDINARY_DETAIL},{japanese:"時計は机の上ではなく、壁の棚に置いたのですか？",discourse:"The learner checks whether the clock was on the wall shelf rather than the desk.",profile:CLARIFY_ORDINARY_DETAIL}],completion:text("你釐清了時鐘位置的模糊描述，讓日常對話能繼續。","時計の場所について曖昧な説明を確かめ、会話を続けられました。","You clarified an ambiguous clock location so the everyday conversation could continue.")})
    ]
  },
  {
    id:"tanabata",displayName:"七夕",category:"cultural_event",month:7,day:7,
    topic:"A small, personally chosen goal",world:"A conversation around an optional Tanabata wish-writing display",
    sourceTitle:"Web Japan — Tanabata",sourceUrl:TANABATA_URL,
    title:text("七夕與小目標","七夕と小さな目標","Tanabata and a small goal"),
    note:text("7月7日是七夕的文化學習錨點；部分地區在8月7日前後舉辦活動，地方節慶日期不同。","7月7日の七夕を学ぶ目印です。地域によっては8月7日頃に行事があり、祭りの日程も異なります。","July 7 is a cultural learning anchor; some regions observe around August 7, and local festival dates vary."),
    phases:[
      draftPhase({phase:"before",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("平常會聊個人目標但不要求揭露私事的同學。","個人的な目標を話すことはあるが、私事を求めないクラスメート。","Classmates who sometimes discuss goals without demanding personal details."),situation:text("同學看到文化中心將設置短冊展示的公告。","文化施設に短冊の展示が設置される案内を見ています。","Classmates see a notice for a wish-strip display at a cultural center."),objective:text("討論是否想寫下一個輕鬆的小願望。","気軽な願いを書いてみたいか話しましょう。","Discuss whether to write a low-pressure wish."),instruction:text("願望可以是日常小事，也可以不分享；不追問個人隱私。","願いは日常的なものでも、話さなくても構いません。個人的なことは尋ねないようにしましょう。","A wish may be ordinary or private; do not press for personal details."),primarySkills:["share"],difficulty:BASIC_SUPPORTIVE,partner:"短冊に願いを書くコーナーができるそうです。何か書いてみたいですか？",prompt:text("回答是否有興趣；是否分享一個小目標由自己選擇。","興味があるか答え、目標を話すかどうかは自分で選びましょう。","Say whether you are interested; sharing a small goal is optional."),choices:[{japanese:"日本語の本を一冊読みたいです。小さな目標なら書きやすそうですね。",discourse:"The learner shares a modest, self-chosen learning goal.",profile:ANSWER_ONLY},{japanese:"まだ考えていません。見本を読んでから決めてもよさそうです。",discourse:"The learner leaves the choice open and does not treat participation as required.",profile:ANSWER_ONLY}],completion:text("你談了是否想寫下小目標，保留不分享的空間。","目標を書くかどうかを話し、書かない選択も保てました。","You discussed whether to write a wish and left room not to share one.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"participant",partnerRole:"participant",relationship:text("在公共展示前交談的參觀者。","公共展示の前で話す来場者同士。","Visitors talking beside a public display."),situation:text("參觀者看到一張寫著學習願望的短冊。","来場者が学習について書かれた短冊を見ています。","Visitors see a wish strip about learning."),objective:text("對展示作簡短回應，不探問作者身分。","展示に短く反応し、書いた人の身元は尋ねないようにしましょう。","Respond to the display without asking who wrote it."),instruction:text("只談公開展示上的文字，不猜測私人背景。","公開展示の言葉だけを話題にし、個人的な事情を推測しないようにしましょう。","Discuss only the displayed words; do not guess at private circumstances."),primarySkills:["react","expand"],difficulty:{...INTERMEDIATE_SOCIAL,relationshipDistance:"neutral",topicDepth:"concrete"},partner:"『毎日少しずつ続けたい』と書いてありますね。",prompt:text("回應展示上的願望：可以分享一個方法，也可以問一個相關問題。","見える願いに応じ、続ける工夫を話すか、関連することを一つ尋ねましょう。","Respond to the visible wish with an idea or a focused reflection question."),choices:[{japanese:"少しずつという言葉がいいですね。時間を短くすると続けやすそうです。",discourse:"The learner reacts to the displayed wording and adds a practical thought.",profile:REACT_AND_EXPAND},{japanese:"無理のない目標ですね。続けるために何を決めるとよさそうですか？",discourse:"The learner comments on the modest goal and invites a general reflection.",profile:ACKNOWLEDGE_AND_INVITE}],completion:text("你回應了展示文字，也沒有推測書寫者的私事。","展示の言葉に応じ、書いた人の事情は推測しませんでした。","You responded to the display without guessing at the author's private life."),
        followUps:[{partner:"私は勉強する時間を決めず、できる日に少し読むつもりです。",prompt:text("理解對方選擇彈性方法的理由，分享相近或不同的策略。","柔軟な方法を選んだ相手に応じ、自分の工夫も話しましょう。","Respond to the partner's flexible approach with your own method."),choices:[{japanese:"決めすぎないほうが気楽ですね。私は本を机の上に置いておきます。",discourse:"The learner acknowledges the partner's choice and adds a personal cue.",profile:ACKNOWLEDGE_AND_SHARE},{japanese:"できる日に読むのは続けやすそうです。私は短い章から始めたいです。",discourse:"The learner adds a practical personal approach to the shared goal.",profile:ACKNOWLEDGE_AND_SHARE}]}]}),
      draftPhase({phase:"after",length:"long",learnerRole:"classmate",partnerRole:"classmate",relationship:text("熟悉但尊重彼此自主性的同學。","親しみがありつつ、お互いの自主性を尊重するクラスメート。","Familiar classmates who respect one another's autonomy."),situation:text("活動後，同學回顧一個持續中的個人目標，以及讓計畫不易維持的原因。","行事の後、続けている目標と、計画が難しくなる理由を振り返っています。","After an event, classmates reflect on an ongoing goal and what makes it difficult to sustain."),objective:text("敘述一段目標經驗，理解不同方法，再商量一個可調整的小步驟。","目標の経験を話し、違う方法も受け止め、調整できる小さな一歩を考えましょう。","Narrate a goal experience, recognize different methods, and negotiate an adaptable next step."),instruction:text("說明目標對自己的意義，聽取對方限制，再提出不強迫的調整方案。","目標の意味を話し、相手の事情も聞いて、無理のない調整案を考えましょう。","Explain what matters to you, hear the partner's constraint, and propose a flexible adjustment."),primarySkills:["narrate","negotiate"],difficulty:{...ADVANCED_REFLECTIVE,relationshipDistance:"familiar"},partner:"目標は続けたいのですが、忙しい日は予定どおりにできません。",prompt:text("敘述自己曾如何調整類似目標，也詢問對方的偏好。","似た目標をどう調整したか話し、相手の希望も尋ねましょう。","Narrate how you adjusted a similar goal and ask what the partner prefers."),choices:[{japanese:"以前は毎日読む目標にしましたが、忙しい日にできないと、続けること自体をあきらめそうになりました。そこで時間のある日に数ページ読む形に変えました。毎日の記録より、読む時間を楽しめるほうを大切にしました。決まった曜日だけにする方法は合いそうですか？",discourse:"The learner narrates an adjustment and asks whether a lighter schedule would suit the partner.",profile:NARRATE_AND_FIT_CHECK},{japanese:"予定どおりにできないと目標が負担になるので、忙しい日は休み、余裕のある日に戻る形にしました。回数は減っても、長く続けられるほうが自分には現実的でした。短い時間だけ続ける方法は合いそうですか？",discourse:"The learner describes a flexible recovery strategy and asks a concrete preference question.",profile:NARRATE_AND_FIT_CHECK}],followUps:[{partner:"毎日の決まりにするより、できる日に短くやるほうが続きそうです。",prompt:text("回應對方的選擇，提出一個保持彈性的下一步。","相手の選択に応じ、柔軟さを保つ次の一歩を提案しましょう。","Respond and suggest a flexible next step."),choices:[{japanese:"それなら負担が少なそうですね。本を見える場所に置けば、思い出すきっかけだけ作れて、読む量までは決めずに済みそうです。",discourse:"The learner proposes a small environmental cue without making a demand.",profile:ACKNOWLEDGE_GOAL_AND_NEGOTIATE},{japanese:"できる日に短く、という形が合いそうですね。最初に一章だけと決めると、忙しい日に量を調整しやすいかもしれません。試してみませんか？",discourse:"The learner offers a bounded optional step that follows the partner's preference.",profile:ACKNOWLEDGE_GOAL_AND_NEGOTIATE}]},{partner:"まずは気が向いた日に始めて、様子を見たいです。",prompt:text("接受對方想先觀察的節奏，確認一個不具壓力的下一步。","様子を見たいという相手のペースを受け止め、負担のない次の一歩を話しましょう。","Accept the partner's pace and discuss one low-pressure next step."),choices:[{japanese:"いいですね。始めた日に、読んだところを一行だけメモするのはどうですか？",discourse:"The learner checks an optional reflection step rather than imposing a schedule.",profile:ACKNOWLEDGE_GOAL_AND_NEGOTIATE},{japanese:"まず試してみるのがよさそうです。続け方は後から決めてもよいですね。",discourse:"The learner accepts the partner's proposal and keeps future choices open.",profile:REACT_AND_NEGOTIATE}]}],completion:text("你敘述了目標的經驗，聽取不同限制，並找到可調整而不勉強的下一步。","目標の経験を話し、違う事情も聞きながら、無理のない次の一歩を考えられました。","You narrated a goal experience, heard a different constraint, and found an adaptable next step.")})
    ]
  },
  {
    id:"mountain-day",displayName:"山の日",category:"holiday",month:8,day:11,
    topic:"An optional way to rest on a day off",world:"A low-pressure conversation about choosing how to spend free time",
    sourceTitle:"Cabinet Office — About National Holidays",sourceUrl:CABINET_URL,
    title:text("山之日與自選休息","山の日と自分で選ぶ休み方","Mountain Day and choosing how to rest"),
    note:text("依現行規則，山之日為8月11日；2020及2021年曾因奧運調整日期。對話不要求登山。","現行の規則では山の日は8月11日です。2020年・2021年は五輪に伴う日程変更があり、登山を求める話題ではありません。","Under the current rule Mountain Day is August 11; dates moved in 2020 and 2021 for the Olympics. The scenes do not require hiking."),
    phases:[
      draftPhase({phase:"before",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("友善同事，平常會談休息方式。","休み方を話す、親しみのある同僚。","Friendly coworkers who discuss ways to rest."),situation:text("同事看到八月日曆上的休假標記，聊到自己可選擇的安排。","同僚が八月のカレンダーを見て、休みの日にできることを話しています。","Coworkers notice a holiday marker on an August calendar and discuss optional plans."),objective:text("分享自己可選擇的休息方式，不預設登山或旅行。","登山や旅行を前提にせず、自分がどう休みたいか話しましょう。","Share one optional way you might rest; the partner can choose whether to add their own idea."),instruction:text("分享低風險的個人選擇，保留在家休息的可能。","気軽な個人の選択を話し、家で休む可能性も残しましょう。","Share an optional plan and leave room for staying home."),primarySkills:["share","bounce"],difficulty:BASIC_SUPPORTIVE,partner:"休みの日は、外に出る予定を立てていますか？",prompt:text("回答自己是否有計畫；也可以詢問對方的安排。","予定があるか答えましょう。相手への質問は任意です。","Say whether you have plans; returning the question is optional."),choices:[{japanese:"まだ決めていません。暑さが落ち着いたら近所を歩きたいです。",discourse:"The learner gives a tentative local option without prescribing outdoor activity.",profile:ANSWER_ONLY},{japanese:"今のところ、家でゆっくりするつもりです。あなたは何か考えていますか？",discourse:"The learner answers and asks about the partner's optional plans.",profile:ANSWER_AND_RETURN}],completion:text("你分享了個人休息選項，沒有把登山當成必要活動。","自分で選べる休み方を話し、登山を必須の活動とはしませんでした。","You shared an optional way to rest without treating hiking as required.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("同學之間輕鬆談近況。","近況を気軽に話すクラスメート。","Classmates who casually share recent updates."),situation:text("兩位同學談到其中一人選擇留在室內休息。","クラスメート同士で、一人が屋内で休むことにした話をしています。","Classmates discuss one person's choice to rest indoors."),objective:text("理解對方的選擇，再分享自己的休息偏好。","相手の選択に応じ、自分の好みも話しましょう。","Acknowledge the choice and share your own preference."),instruction:text("尊重室內或戶外的不同選擇，不把天氣或體力當成測驗。","屋内・屋外の違う選択を尊重し、天気や体力を試す話にしないようにしましょう。","Respect indoor and outdoor choices; do not turn it into a test of weather or fitness."),primarySkills:["react","share"],difficulty:BASIC_SUPPORTIVE,partner:"暑い日は、涼しい部屋で映画を見ることにしました。",prompt:text("回應對方選擇室內休息，分享自己的舒適方式。","屋内で休む相手に応じ、自分が落ち着く過ごし方を話しましょう。","Respond to the choice to stay indoors and share what feels comfortable to you."),choices:[{japanese:"映画ならゆっくりできますね。私は冷たい飲み物を用意して本を読みます。",discourse:"The learner acknowledges the indoor choice and shares a quiet alternative.",profile:REACT_AND_SHARE},{japanese:"涼しい場所で過ごすのはいいですね。私は音楽を聞いて休むことが多いです。",discourse:"The learner responds without implying the partner should go outside.",profile:REACT_AND_SHARE}],completion:text("你回應了對方的室內休息選擇，並分享自己的偏好。","屋内で休む選択に応じ、自分の好みも話せました。","You responded to the partner's indoor choice and shared your own preference.")}),
      draftPhase({phase:"after",length:"short",learnerRole:"participant",partnerRole:"participant",relationship:text("在公共步道入口友善交談的訪客。","公共の遊歩道の入口で話す来訪者同士。","Visitors chatting at a public walking path entrance."),situation:text("訪客回想一次輕鬆散步，而不是長途登山。","来訪者が長い登山ではなく、気軽な散歩を振り返っています。","Visitors recall a casual walk rather than a strenuous hike."),objective:text("詢問一個實際但不侵入的散步細節。","負担にならない散歩の具体的なことを一つ尋ねましょう。","Ask one practical, non-intrusive detail about the walk."),instruction:text("不把參與活動當成節日條件，也不給安全建議。","行事への参加を条件にせず、安全上の助言もしないようにしましょう。","Do not make participation a holiday requirement or give safety advice."),primarySkills:["react","expand"],difficulty:BASIC_SUPPORTIVE,partner:"近くの遊歩道を少し歩きました。木陰があって落ち着きました。",prompt:text("接續對方自願分享的散步經驗，追問一個實際細節。","相手が話した散歩について、具体的なことを一つ尋ねましょう。","Follow up on the volunteered walk with one question about the setting."),choices:[{japanese:"木陰があると歩きやすそうですね。道から何が見えましたか？",discourse:"The learner follows the partner's chosen walk and asks about a visible detail.",profile:ACKNOWLEDGE_AND_INVITE},{japanese:"落ち着けたんですね。人が少ない時間帯でしたか？",discourse:"The learner asks an optional detail about the already-shared experience.",profile:ACKNOWLEDGE_AND_INVITE}],completion:text("你延續了對方自願提到的散步經驗，沒有要求登山。","相手が話した散歩について尋ね、登山を求める話にはしませんでした。","You followed the partner's volunteered walk without requiring a hike.")})
    ]
  },
  {
    id:"disaster-prevention-day",displayName:"防災の日",category:"cultural_event",month:9,day:1,
    topic:"Clarifying an ordinary drill announcement",world:"A calm workplace conversation about a scheduled routine announcement",
    sourceTitle:"Cabinet Office / Fire and Disaster Management Agency — Disaster Prevention Week",sourceUrl:BOUISAI_URL,
    title:text("防災日與例行公告","防災の日と日常の案内","Disaster Prevention Day and an ordinary notice"),
    note:text("9月1日是防災學習錨點；情境只談例行演練公告，不是緊急應變指引。","9月1日は防災を学ぶ目印です。場面は通常の訓練案内に限り、緊急時の指針ではありません。","September 1 is a disaster-prevention learning anchor; these scenes discuss routine drill notices, not emergency guidance."),
    phases:[
      draftPhase({phase:"before",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("會互相確認一般工作公告的同事。","普段の職場案内を確認し合う同僚。","Coworkers who clarify ordinary workplace notices."),situation:text("同事看到一則已排定的例行演練通知，但尚未讀完整內容。","同僚が予定された訓練の案内を見ましたが、詳細はまだ読んでいません。","Coworkers see a notice for a scheduled routine drill but have not read its details."),objective:text("確認例行演練公告上的時間或集合地點。","訓練案内の時刻や集合場所を確認しましょう。","Clarify the scheduled time or meeting place on the routine drill notice."),instruction:text("只確認公告資訊，不提供緊急時建議或保證。","案内の内容だけ確認し、緊急時の助言や保証はしないようにしましょう。","Clarify the notice only; do not offer emergency advice or assurances."),primarySkills:["repair"],difficulty:BASIC_SUPPORTIVE,partner:"訓練の案内が出ていましたが、時間を確認しましたか？",prompt:text("回答已讀到的資訊，或提議一起確認公告。","確認した情報を答えるか、一緒に案内を確認する提案をしましょう。","Share what you know or suggest checking the notice together."),choices:[{japanese:"まだ詳しく読んでいません。開始時刻はどこに書いてありますか？",discourse:"The learner states what they have not checked and offers a neutral clarification.",profile:CLARIFY_ORDINARY_DETAIL},{japanese:"昼休みの後と書いてありましたが、場所はどこでしょう？案内を一緒に確認しませんか？",discourse:"The learner shares one ordinary detail and acknowledges what remains unclear.",profile:CLARIFY_ORDINARY_DETAIL}],completion:text("你把話題留在一般公告資訊，沒有把它當成緊急狀況。","通常の案内の確認にとどめ、緊急事態として扱いませんでした。","You kept the discussion to an ordinary notice rather than an emergency.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("在工作場所保持平等互助的同事。","職場で対等に助け合う同僚。","Coworkers who help one another as peers."),situation:text("同事在公告欄前確認例行演練的集合地點。","同僚が掲示板の前で通常訓練の集合場所を確認しています。","Coworkers check the meeting place for a routine drill notice."),objective:text("用簡單問題釐清一個尚未確認的公告細節。","未確認の案内について、簡単な質問で確かめましょう。","Clarify one unconfirmed detail with a simple question."),instruction:text("不要猜測未寫明的程序，也不宣稱某種做法保證安全。","書かれていない手順を推測せず、何かが安全を保証すると言わないようにしましょう。","Do not guess at unstated procedures or claim any action guarantees safety."),primarySkills:["repair"],difficulty:{...INTERMEDIATE_SOCIAL,relationshipDistance:"neutral",topicDepth:"concrete"},partner:"集合場所は一階のロビーのようですが、掲示の文字が少し読みにくいですね。",prompt:text("確認不清楚的文字，提出查閱公告的中性問題。","読みづらい箇所を確かめるため、案内を見直す質問をしましょう。","Ask a neutral question to check the unclear text."),choices:[{japanese:"場所の欄を一緒に見てもいいですか？ロビーかどうか確認したいです。",discourse:"The learner asks to verify the written location rather than guessing.",profile:CLARIFY_ORDINARY_DETAIL},{japanese:"場所の欄を一緒に読み直してもいいですか？小さい文字を確認したいです。",discourse:"The learner proposes rereading the ordinary notice together.",profile:CLARIFY_ORDINARY_DETAIL}],completion:text("你以公告文字為依據釐清細節，沒有猜測未公布的程序。","案内の記載をもとに確認し、書かれていない手順は推測しませんでした。","You checked the posted information without guessing at unstated procedures.")}),
      draftPhase({phase:"after",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("可以分享一般工作經驗而不誇大效果的同事。","通常の職場経験を誇張せずに話せる同僚。","Coworkers who can share routine work experiences without overstating effects."),situation:text("例行演練後，同事談到公告是否容易理解。","通常訓練の後、同僚が案内の分かりやすさを話しています。","After a routine drill, coworkers discuss whether the notice was clear."),objective:text("分享一項溝通觀察；詢問對方看法是可選的。","案内について気づいた点を話し、必要なら相手の考えも聞きましょう。","Share an observation about the notice; inviting the partner's view is optional."),instruction:text("只回顧溝通體驗，不評估實際防災能力。","案内の経験だけを振り返り、防災能力を評価しないようにしましょう。","Reflect on communication only; do not assess preparedness or safety capability."),primarySkills:["react","share"],difficulty:{...INTERMEDIATE_SOCIAL,topicDepth:"concrete"},partner:"集合場所が大きく書いてあって、案内を見つけやすかったです。",prompt:text("分享自己看公告的經驗；邀請對方補充是可選的。","案内を見た経験を話し、必要なら相手にも尋ねましょう。","Share your experience of the notice; returning the turn is optional."),choices:[{japanese:"私も場所はすぐ分かりました。時刻も同じ大きさで書いてあると見やすそうです。",discourse:"The learner reports a personal observation and one modest communication preference.",profile:REACT_AND_SHARE},{japanese:"私が見た案内では、場所の欄がすぐ目に入りました。どの情報が特に分かりやすかったですか？",discourse:"The learner acknowledges and asks about the partner's observation.",profile:SHARE_AND_NOTICE_QUESTION}],completion:text("你回顧了公告的清晰程度，沒有宣稱演練帶來特定安全成效。","案内の分かりやすさを振り返り、訓練の安全効果は断定しませんでした。","You reflected on notice clarity without claiming a specific safety outcome.")})
    ]
  },
  {
    id:"coffee-day",displayName:"コーヒーの日",category:"cultural_event",month:10,day:1,
    topic:"Drink preferences and a cafe choice",world:"A casual conversation about a cafe menu and personal drink preferences",
    sourceTitle:"All Japan Coffee Association — International Coffee Day",sourceUrl:COFFEE_URL,
    title:text("咖啡日與飲品選擇","コーヒーの日と飲み物の好み","Coffee Day and drink preferences"),
    note:text("10月1日是咖啡文化的學習錨點；飲品偏好依人而異。","10月1日はコーヒー文化を学ぶ目印です。飲み物の好みは人それぞれです。","October 1 is a coffee-culture learning anchor; drink preferences vary."),
    phases:[
      draftPhase({phase:"before",length:"medium",learnerRole:"coworker",partnerRole:"coworker",relationship:text("同事間親切交換飲品偏好，不推銷品牌。","飲み物の好みを気軽に話し、商品を勧め合わない同僚。","Coworkers who share drink preferences without promoting brands."),situation:text("同事打算到附近咖啡館，查看菜單上的咖啡與其他飲品。","同僚が近くのカフェに行くため、コーヒーや他の飲み物のメニューを見ています。","Coworkers look at a nearby cafe menu with coffee and other drinks."),objective:text("分享自己的飲品偏好，再提供一個不含咖啡的選擇。","自分の好みを話し、コーヒー以外の選択肢も提案しましょう。","Share your preference and offer a non-coffee option too."),instruction:text("避免假設對方喝咖啡；提議要讓對方容易拒絕或改選。","相手がコーヒーを飲むと決めつけず、断ったり別のものを選んだりしやすい提案にしましょう。","Do not assume the partner drinks coffee; make suggestions easy to decline or change."),primarySkills:["share","negotiate","bounce"],difficulty:INTERMEDIATE_SOCIAL,partner:"この店はコーヒーの種類が多いですね。何を飲むことが多いですか？",prompt:text("分享個人偏好，再提議咖啡以外的飲品，或詢問對方的想法。","好みを話し、コーヒー以外の飲み物を提案するか、相手の好みを尋ねましょう。","Share your preference, then suggest non-coffee options or ask what the partner prefers."),choices:[{japanese:"私はミルクを入れたコーヒーが好きですが、今日はお茶もよさそうです。コーヒー以外のメニューも見てみませんか？",discourse:"The learner explains a current alternative and offers to compare the non-coffee menu without pressure.",profile:NEGOTIATE_WITH_REASON},{japanese:"私は普段お茶を選ぶことが多いです。今日は温かい飲み物にしますか？",discourse:"The learner answers and asks about the partner's current choice.",profile:ANSWER_AND_RETURN}],followUps:[{partner:"温かいものがいいですね。今日はコーヒーを飲みたい気分ですが、甘すぎないものがいいです。",prompt:text("回應對方對甜度的偏好，提出一個可自行選擇的菜單方向。","甘さの好みに応じ、選べるメニューの方向を一つ提案しましょう。","Respond to the sweetness preference with an optional menu direction."),choices:[{japanese:"それなら無糖のラテもよさそうです。メニューを一緒に見てみますか？",discourse:"The learner offers one optional choice based on the stated preference.",profile:ACKNOWLEDGE_AND_PROPOSE_MENU},{japanese:"甘さを選べる飲み物もありますね。私は店員さんに確認してみます。",discourse:"The learner suggests checking available options without promising an item.",profile:DEVELOP_AND_SHARE}]}],completion:text("你說明了個人偏好，也提供不施壓的替代選擇。","自分の好みを話し、押しつけない別の選択肢も出せました。","You shared a personal preference and offered a non-pressuring alternative.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("在咖啡館休息、彼此不勉強點餐的同學。","カフェで休憩し、注文を急かさないクラスメート。","Classmates taking a cafe break without pressuring one another to order."),situation:text("同學看著咖啡館菜單上不同溫度的飲品。","クラスメートがカフェのメニューで温度の違う飲み物を見ています。","Classmates look at hot and cold drinks on a cafe menu."),objective:text("回應一項菜單觀察，再分享眼前想喝的飲品。","メニューの気づきに応じ、今飲みたいものを話しましょう。","Respond to a menu observation and share what you feel like drinking."),instruction:text("表達此刻的個人選擇，不假設固定習慣。","今の自分の選択として話し、決まった習慣とは言わないようにしましょう。","Keep it a current choice rather than a fixed habit."),primarySkills:["react","share"],difficulty:BASIC_SUPPORTIVE,partner:"冷たい飲み物と温かい飲み物の両方がありますね。",prompt:text("回應菜單的選擇，說明此刻的偏好。","選択肢に応じ、今の好みを話しましょう。","Respond to the menu and state your current preference."),choices:[{japanese:"温かいものもいいですね。今日はそれにします。少しゆっくりできそうです。",discourse:"The learner states a current choice without claiming a fixed preference.",profile:REACT_AND_SHARE},{japanese:"私は冷たいお茶が気になります。コーヒー以外も選べていいですね。",discourse:"The learner notices an alternative without judging the partner's preference.",profile:REACT_AND_SHARE}],completion:text("你以個人當下選擇回應了菜單觀察。","今の自分の選択としてメニューの話に応じられました。","You responded to the menu as a personal current choice.")}),
      draftPhase({phase:"after",length:"long",learnerRole:"coworker",partnerRole:"coworker",relationship:text("彼此熟悉口味差異並保持禮貌的同事。","好みの違いを知り、礼儀を保って話す同僚。","Coworkers who know one another's preferences and remain considerate."),situation:text("同事回顧一次選飲品的對話，其中一人偏好咖啡，另一人多選茶。","同僚が飲み物を選んだ時の会話を振り返っています。一人はコーヒーを好み、もう一人はお茶を選ぶことが多いです。","Coworkers recall choosing drinks; one prefers coffee while the other often chooses tea."),objective:text("比較飲品偏好與選擇理由，理解不同口味並商量都自在的選項。","飲み物の好みや選ぶ理由を比べ、違いを受け止めて、どちらも気楽な選択肢を考えましょう。","Compare drink preferences and their reasons, recognize different tastes, and negotiate an option that feels comfortable to both."),instruction:text("說明選擇原因，回應不同口味，提出可各自點不同飲品的方案。","選んだ理由を話し、違う好みに応じて、それぞれ別の飲み物を選べる案を出しましょう。","Explain your choice, respond to different tastes, and suggest ordering different drinks."),primarySkills:["narrate","agree_disagree","negotiate"],difficulty:ADVANCED_REFLECTIVE,partner:"前に一緒に入った店では、私はコーヒーで、あなたはお茶にしましたね。",prompt:text("比較飲品偏好與選擇理由；回顧某次選擇是其中一種方式。","飲み物の好みや選ぶ理由を比べましょう。以前の選択を話すかは任意です。","Compare drink preferences and reasons; recalling a past choice is one option."),choices:[{japanese:"午後は香りを楽しめるお茶を選びました。食後はコーヒーが合うと感じる日もあります。時間帯や食事で選び方を変えると、それぞれの好みを保ちやすいです。",discourse:"The learner narrates a bounded choice and suggests a flexible arrangement.",profile:NARRATE_AND_REFLECT},{japanese:"私は食事の後ならコーヒーを選ぶこともありますが、その日の気分も大切です。一緒にいる時は、同じものを頼むことより、それぞれが好きな飲み物を選べる店だと安心です。",discourse:"The learner gives a reasoned preference for a menu that accommodates both choices.",profile:SHARE_AND_NEGOTIATE}],followUps:[{partner:"一緒に来た時は、同じものを頼むほうが会話しやすいと思います。",prompt:text("回應對方認為點相同飲品較方便交談的看法，也可說明自己的不同考量。","同じ飲み物を頼むと話しやすいという相手の考えに応じ、別の見方があれば理由とともに話しましょう。","Respond to the partner's view that ordering alike can make conversation easier; a reasoned difference is welcome."),choices:[{japanese:"同じものを選ぶ楽しさもありますね。ただ、好みが違う時は選択肢が多いほうが、無理なく一緒に過ごせると思います。",discourse:"The learner recognizes the appeal of ordering alike, then gives a reason for keeping different choices available.",profile:DIFFERENT_VIEW_WITH_REASON},{japanese:"そうですね。同じものを選ぶ日も、別々に選ぶ日もあってよいですね。お茶もある店なら、次も気軽に一緒に来られそうです。",discourse:"The learner proposes a shared selection process while preserving individual choice.",profile:DIFFERENT_VIEW_WITH_REASON}]},{partner:"次に店を選ぶ時、何を見て決めるとよさそうですか？",prompt:text("說明一項實用的選店條件和理由；詢問對方是否合適是可選的。","店を選ぶ時に重視したい条件と理由を話しましょう。相手に尋ねるかは任意です。","Offer one practical criterion and explain why it matters; checking the partner’s preference is optional."),choices:[{japanese:"飲み物の種類が多いと、好みが違っても選べるので重視したいです。お茶も選びやすいですか？",discourse:"The learner proposes an inclusive menu criterion and checks the partner's preference.",profile:SHARE_AND_NEGOTIATED_FIT_CHECK},{japanese:"静かに話せる席も大切です。注文を急がず話せますし、飲み物は別々に選べるとよいですね。",discourse:"The learner suggests a setting criterion while accommodating different drinks.",profile:OPINION_AND_NEGOTIATE}]}],completion:text("你比較了飲品偏好，理解彼此口味不同，並提出各自都能自在選擇的方式。","飲み物の好みを比べ、味の違いも受け止めながら、それぞれ選べる方法を考えました。","You compared drink preferences, recognized different tastes, and found a flexible way to choose.")})
    ]
  },
  {
    id:"culture-day",displayName:"文化の日",category:"holiday",month:11,day:3,
    topic:"An optional exhibition and personal impressions",world:"A conversation about a chosen public exhibition",
    sourceTitle:"Cabinet Office — About National Holidays",sourceUrl:CABINET_URL,
    title:text("文化日與展覽觀察","文化の日と展示の感想","Culture Day and exhibition observations"),
    note:text("11月3日是日本的國定假日；對話只談可選展覽與個人觀察。","11月3日は日本の国民の祝日です。会話は任意の展示と個人の感想に限ります。","November 3 is a Japanese national holiday; these scenes focus on optional exhibitions and personal observations."),
    phases:[
      draftPhase({phase:"before",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("會一起查找公共展覽資訊、但各自決定是否參加的同學。","公共展示の情報を一緒に調べ、参加は各自で決めるクラスメート。","Classmates who look up public exhibitions but decide individually whether to attend."),situation:text("同學看到附近美術館的展覽公告。","クラスメートが近くの美術館の展示案内を見ています。","Classmates notice an exhibition announcement at a nearby museum."),objective:text("分享自己是否感興趣，以及喜歡看的作品類型；追問可選。","興味や見たい作品の種類を話しましょう。質問は任意です。","Share your interest; a follow-up question is optional."),instruction:text("把參觀當成選項，不預設假日安排。","見学は選択肢として話し、祝日の予定を決めつけないようにしましょう。","Keep visiting optional; do not assume holiday plans."),primarySkills:["share","bounce"],difficulty:BASIC_SUPPORTIVE,partner:"駅の近くで写真の展示が始まるそうです。興味はありますか？",prompt:text("回答自己的興趣；如果願意，也可以問對方想看的內容。","自分の興味を答え、相手が見たいものは、必要なら聞いてみましょう。","Share your interest; asking what the partner likes is optional."),choices:[{japanese:"写真を見るのが好きなので、少し興味があります。どんな展示が好きですか？",discourse:"The learner answers and returns the topic with an optional question.",profile:ANSWER_AND_RETURN},{japanese:"まだ分かりませんが、案内を読んでみたいです。写真のテーマは何でしょうね。",discourse:"The learner expresses tentative interest and suggests checking the public notice.",profile:ANSWER_ONLY}],completion:text("你分享了個人興趣，並保留是否參觀的選擇。","自分の興味を話し、見に行くかどうかは選べるままにしました。","You shared a personal interest while keeping the visit optional.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"participant",partnerRole:"participant",relationship:text("在公共展場交談的參觀者。","公共の展示会場で話す来場者同士。","Visitors chatting in a public exhibition space."),situation:text("參觀者觀察一幅作品的構圖與色彩。","来場者が作品の構図や色を見ています。","Visitors observe the composition and colors of a work."),objective:text("分享一項可見觀察；邀請對方分享解讀是可選的。","目に見える特徴を一つ話しましょう。相手の見方を聞くのは任意です。","Share one visible observation; inviting the partner's interpretation is optional."),instruction:text("描述自己的感受，不要求對方同意；是否邀請對方分享看法由自己決定，也不複製作品文字。","自分の感想として話し、相手の見方を聞くかは任意とし、作品の文章は写さないようにしましょう。","Describe your impression without requiring agreement; inviting the partner’s view is optional, and do not copy artwork text."),primarySkills:["share"],difficulty:BASIC_SUPPORTIVE,partner:"この作品は、色の重なりが印象的ですね。",prompt:text("分享自己注意到的部分；對方也可以補充。","自分が気づいた点を話しましょう。質問は任意です。","Share one thing you noticed; the partner may add another observation if they wish."),choices:[{japanese:"私も背景の明るさが気になりました。どの色が一番印象に残りましたか？",discourse:"The learner acknowledges the partner’s impression and invites one specific detail.",profile:SHARE_AND_FOCUSED_QUESTION},{japanese:"重なった色で奥行きがあるように見えます。近くで見ると違う印象ですね。",discourse:"The learner offers a personal visual interpretation without asserting it is correct.",profile:ANSWER_ONLY}],completion:text("你分享了個人觀察，並尊重作品解讀可能不同。","自分の見方を話し、作品の受け取り方が違うことも尊重できました。","You shared a personal observation and respected that interpretations can differ.")}),
      draftPhase({phase:"after",length:"long",learnerRole:"classmate",partnerRole:"classmate",relationship:text("可以談不同審美感受、不要求一致的同學。","感じ方の違いを話し、意見の一致を求めないクラスメート。","Classmates who discuss different impressions without requiring agreement."),situation:text("同學回顧看過的一個展覽作品，以及各自注意到的細節。","クラスメートが見た展示作品と、それぞれが気づいた点を振り返っています。","Classmates recall an exhibition work and the details each noticed."),objective:text("比較觀展感受，接納不同看法；提問是可選的。","展示の感想を比べ、違う見方も受け止めましょう。質問は任意です。","Compare personal impressions and leave room for a different reading; a question is optional."),instruction:text("分享自己對作品的解讀，回應不同看法，不替作品下唯一結論。","自分の作品解釈を話し、違う見方にも応じ、唯一の結論を出さないようにしましょう。","Share your interpretation and respond without declaring one correct reading."),primarySkills:["narrate","agree_disagree","expand"],difficulty:ADVANCED_REFLECTIVE,partner:"最初は少し暗いと思いましたが、説明を読んだ後は見方が変わりました。",prompt:text("敘述自己如何看待一個細節，並對方如何改變看法也可以選擇分享。","自分が見た特徴を話し、相手の見方の変化は、話したければ聞いてみましょう。","Share a detail you noticed and compare how impressions changed; asking is optional."),choices:[{japanese:"私も説明を読んで、作品の背景を少し想像できました。どの部分が気になりましたか？",discourse:"The learner narrates a shift in impression and returns the question.",profile:NARRATE_AND_EXPAND},{japanese:"私は色の使い方を先に見たので、説明を読む前は暗さより静けさを感じました。受け取り方が違うと、作品を考える視点も増えますね。",discourse:"The learner gives a different impression with a reason and leaves room for the partner’s reading.",profile:DIFFERENT_VIEW_WITH_REASON}],followUps:[{partner:"私は、繰り返し出てくる形が気になりました。",prompt:text("回應對方提到的圖形，可以分享相近或不同的觀察，也可以追問一個相關細節。","繰り返し出てくる形に応じ、似た点や違う点を話すか、関連することを一つ尋ねましょう。","Respond to the repeated shape with an observation or a focused follow-up question."),choices:[{japanese:"同じ形が何度も出てきますね。私はその間の余白にも目が行きました。",discourse:"The learner recognizes the observation and offers a different visual focus.",profile:REACT_AND_SHARE},{japanese:"繰り返しに気づいたんですね。どの場所に出てくる形が印象的でしたか？",discourse:"The learner develops the partner's chosen observation with a focused question.",profile:ACKNOWLEDGE_AND_INVITE}]},{partner:"作品の端に繰り返し現れる形が特に印象に残りました。余白との位置関係も面白かったです。友人と感想が違っても、作品の見方が広がることがありますね。",prompt:text("回應不同解讀帶來的收穫，分享自己保留多種看法的方式。","解釈の違いで気づきが広がることに応じ、複数の見方を持つ自分の方法を話しましょう。","Respond to how different interpretations can broaden a view and share how you hold more than one reading."),choices:[{japanese:"一つに決めずに見ると、後から別の点にも気づけます。私は気になったことを短くメモします。",discourse:"The learner reflects on how they keep multiple interpretations open and describes a concrete practice.",profile:ANSWER_ONLY},{japanese:"違う感想を聞くと、もう一度見たくなります。自分の見方も変わるか考えてみます。",discourse:"The learner describes how a different interpretation prompts reconsideration without requiring agreement.",profile:ANSWER_ONLY}]}],completion:text("你比較了對作品的不同感受，也保留了多種解讀的空間。","作品の印象を比べ、複数の受け取り方を残して話を続けられました。","You compared personal impressions and left room for more than one interpretation.")})
    ]
  },
  {
    id:"labour-thanksgiving-day",displayName:"勤労感謝の日",category:"holiday",month:11,day:23,
    topic:"A personally chosen day-off routine",world:"An optional conversation about how someone spends free time",
    sourceTitle:"Cabinet Office — About National Holidays",sourceUrl:CABINET_URL,
    title:text("勤勞感謝日與休息安排","勤労感謝の日と休み方","Labour Thanksgiving Day and ways to rest"),
    note:text("11月23日是日本的國定假日；情境不假設職業、固定休假或普遍感謝儀式。","11月23日は日本の国民の祝日です。職業や休み、共通の感謝の習慣は前提にしません。","November 23 is a Japanese national holiday; scenes assume no job, day off, or universal gratitude ritual."),
    phases:[
      draftPhase({phase:"before",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("會聊生活安排但不互相詢問薪資或雇主的同事。","生活の予定は話すが、給与や雇用主のことは尋ねない同僚。","Coworkers who discuss personal plans without probing pay or employers."),situation:text("同事談到近期可能有空檔，但彼此班表不同。","同僚が近いうちの空き時間について話していますが、予定はそれぞれ違います。","Coworkers discuss possible free time despite having different schedules."),objective:text("分享自己的空檔安排，不預設對方有固定休假；也可以只回答。","自分の空き時間の過ごし方を話しましょう。相手への質問は任意です。","Share one optional way you might use free time; asking back is optional."),instruction:text("不假設對方有固定假日或受僱工作。","決まった休日や雇用されている仕事があるとは決めつけないようにしましょう。","Do not assume the partner has a fixed holiday or an employed job."),primarySkills:["share","bounce"],difficulty:BASIC_SUPPORTIVE,partner:"予定がない日は、どんなふうに過ごすことが多いですか？",prompt:text("回答一種自己選擇的活動；也可以詢問對方的安排。","自分で選ぶ過ごし方を答えましょう。相手への質問は任意です。","Answer with an optional activity; asking about the partner’s plan is optional."),choices:[{japanese:"近所を歩いたり、家で音楽を聞いたりします。あなたは何をすることが多いですか？",discourse:"The learner gives personal examples and returns the optional question.",profile:ANSWER_AND_RETURN},{japanese:"その時の気分で決めます。静かに過ごす日もあります。",discourse:"The learner shares a flexible personal routine without assuming a schedule.",profile:ANSWER_ONLY}],completion:text("你談了個人休息方式，沒有把它推廣成固定制度。","自分の休み方を話し、決まった制度のようには扱いませんでした。","You shared a personal way to rest without implying a fixed schedule.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("互相尊重不同日常節奏的同學。","違う生活のペースを尊重し合うクラスメート。","Classmates who respect different daily routines."),situation:text("同學在課後聊到如何放鬆一下。","授業の後、クラスメートが少し休む方法を話しています。","Classmates discuss how to unwind briefly after class."),objective:text("回應對方的休息方式，分享一個自己的例子。","相手の休み方に応じ、自分の例を一つ話しましょう。","Respond to the partner's routine and share one example; a follow-up question is optional."),instruction:text("避免假設每個人都有相同的工作或休假經驗。","誰もが同じ仕事や休みを経験するとは考えないようにしましょう。","Do not assume everyone shares the same work or holiday experience."),primarySkills:["react","share"],difficulty:BASIC_SUPPORTIVE,partner:"私は帰り道に好きな音楽を聞くと、気分が切り替わります。",prompt:text("回應對方的個人做法，再說一個自己選擇的放鬆方式。","相手の工夫に応じ、自分で選んでいる休み方を話しましょう。","Respond and share one way you choose to rest."),choices:[{japanese:"音楽を聞くと気分が変わりますね。私は帰宅後に温かい飲み物を飲みます。",discourse:"The learner acknowledges the routine and shares a different personal choice.",profile:REACT_AND_SHARE},{japanese:"好きな曲があると助かりますね。私は少し歩いてから帰ることがあります。",discourse:"The learner relates to the partner and adds an optional example.",profile:REACT_AND_SHARE}],completion:text("你回應了同學的個人經驗，也分享自己的選擇。","相手の経験に応じ、自分の選択も話せました。","You responded to the classmate's experience and shared your own choice.")}),
      draftPhase({phase:"after",length:"short",learnerRole:"coworker",partnerRole:"coworker",relationship:text("彼此可分享日常興趣、但不必交換私人工作細節的同事。","日常の好みは話すが、仕事の個人的な詳細を共有する必要はない同僚。","Coworkers who share everyday interests without needing to disclose work details."),situation:text("同事回想一段安靜休息時間。","同僚が静かに休んだ時間を振り返っています。","Coworkers recall a quiet break."),objective:text("追問一項具體的休息活動。","休憩中にしたことを一つ尋ねましょう。","Ask about one activity during the break."),instruction:text("只追問對方自願提到的活動，不問雇主或班表。","相手が話した活動について尋ね、雇用主や勤務予定は聞かないようにしましょう。","Follow the volunteered activity, not employers or schedules."),primarySkills:["expand"],difficulty:INTERMEDIATE_SOCIAL,partner:"静かな場所で少し休んだら、頭がすっきりしました。",prompt:text("詢問對方在安靜場所做了什麼，延續其自願分享的話題。","静かな場所で何をしたか尋ね、相手が話したことを続けましょう。","Ask what the partner did in the quiet place."),choices:[{japanese:"落ち着けてよかったですね。何をして過ごしましたか？",discourse:"The learner asks about the partner's volunteered quiet break.",profile:ACKNOWLEDGE_AND_INVITE},{japanese:"短い時間でも休むと気持ちが切り替わりますね。本を読んだりしましたか？",discourse:"The learner asks one optional follow-up about the described break.",profile:ACKNOWLEDGE_AND_INVITE}],completion:text("你延續了對方自願分享的休息經驗。","相手が話した休憩について具体的に尋ねられました。","You continued the partner's volunteered account of a break.")})
    ]
  },
  {
    id:"new-years-eve",displayName:"大晦日",category:"cultural_event",month:12,day:31,
    topic:"A quiet optional year-end gathering",world:"A personal conversation about marking a year-end moment",
    sourceTitle:"JNTO — December in Japan",sourceUrl:NEW_YEARS_EVE_URL,
    title:text("大晦日與年末回顧","大晦日と年末の振り返り","New Year's Eve and a year-end reflection"),
    note:text("12月31日是年末文化學習錨點；守歲、外出或參拜都不是必要安排。","12月31日は年末文化を学ぶ目印です。夜更かしや外出、参拝は必須ではありません。","December 31 is a year-end learning anchor; staying up, going out, or visiting a shrine is not required."),
    phases:[
      draftPhase({phase:"before",length:"medium",learnerRole:"coworker",partnerRole:"coworker",relationship:text("能以低壓力方式討論可選安排的同事。","負担の少ない選択肢を話し合える同僚。","Coworkers comfortable discussing optional plans without pressure."),situation:text("年末，兩位同事聊到是否想在公共場所短暫見面；兩人都可婉拒或改期。","年末、同僚同士で公共の場所で短く会う案を話しています。どちらも断ったり別の日にしたりできます。","At year end, coworkers consider a brief public meet-up; either can decline or suggest another day."),objective:text("商量一個時間短、容易婉拒的安靜見面方案，顧及彼此的限制。","短時間で断りやすい静かな待ち合わせを考え、お互いの都合に配慮しましょう。","Negotiate a brief, easy-to-decline quiet meet-up that respects both people's constraints."),instruction:text("只提議中性的公共場所與短時間安排；不預設到對方家裡、參加儀式或熬夜。","中立的な公共の場所と短い時間だけを提案しましょう。相手の家や儀式、夜更かしは前提にしません。","Suggest only a neutral public place and brief duration; do not assume a private home, ritual, or late night."),primarySkills:["negotiate"],difficulty:INTERMEDIATE_SOCIAL,partner:"年末は静かに過ごしたいですが、長く出かけるのは難しそうです。",prompt:text("提出一個短暫的公共場所見面方案，讓對方能婉拒或改期。","短時間の公共の場所で会う案を出し、断ったり別の日にしたりできると伝えましょう。","Offer a brief public meet-up that the partner can decline or reschedule."),choices:[{japanese:"よければ、駅前の静かなカフェで30分ほど話しませんか。都合が合わなければ、また別の日でも大丈夫です。",discourse:"The learner proposes a bounded public option with an explicit, low-pressure alternative.",profile:NEGOTIATE_ONLY},{japanese:"人が少ない時間に、カフェで30分くらい会うのはどうですか。難しければ無理に決めなくて大丈夫です。",discourse:"The learner checks a short public option while making refusal easy.",profile:NEGOTIATE_ONLY}],followUps:[{partner:"人が多い場所は避けたいので、年末は家で好きな番組を見て過ごすつもりです。",prompt:text("接納對方想在家度過的安排，也保留改天或短暫見面的選項。","家で過ごしたいという相手の希望を受け止め、別の日や短時間の案も選択肢として残しましょう。","Respect the partner's choice to stay home and leave another day or a shorter option open."),choices:[{japanese:"家で過ごす予定なんですね。では、年明けに人が少ない時間のカフェで30分だけ会う案もあります。もちろん、それぞれ休むだけでも大丈夫です。",discourse:"The learner accepts the partner's current plan and offers a later public option with an easy decline.",profile:ACKNOWLEDGE_STAY_HOME_AND_NEGOTIATE},{japanese:"その過ごし方もよさそうですね。もし別の日に会いたくなったら、空いている時間に短く話すのはどうですか？",discourse:"The learner accepts the choice and makes any later meet-up conditional on mutual interest.",profile:ACKNOWLEDGE_STAY_HOME_AND_NEGOTIATE}]}],completion:text("你提出了短暫、可婉拒的公共場所見面方案，也回應了對方想在家的限制。","短時間で断りやすい公共の待ち合わせを提案し、家で過ごしたい相手の都合にも応じました。","You negotiated a brief, optional public meet-up and respected the partner's preference to stay home.")}),
      draftPhase({phase:"active",length:"short",learnerRole:"participant",partnerRole:"participant",relationship:text("在公共休息空間交談、彼此不預設節慶儀式的訪客。","公共の休憩場所で話し、特定の年越し行事を前提にしない来訪者同士。","Visitors in a public rest area who do not presume a particular year-end ritual."),situation:text("兩位訪客在年末公共空間短暫停留。","年末、二人の来訪者が公共スペースで少し休んでいます。","Two visitors pause briefly in a public space at year end."),objective:text("回應對方想安靜休息的選擇。","静かに休みたいという相手の選択に応じましょう。","Respond to the partner's choice to rest quietly."),instruction:text("不假設所有人都參與倒數或外出活動。","誰もがカウントダウンや外出をするとは考えないようにしましょう。","Do not assume everyone joins a countdown or goes out."),primarySkills:["react","share"],difficulty:BASIC_SUPPORTIVE,partner:"今日はこのあと、家で静かに過ごすつもりです。",prompt:text("回應對方的個人選擇，也分享自己此刻的安排。","相手の選択に応じ、今の自分の予定も話しましょう。","Respond to the personal choice and share your current plan."),choices:[{japanese:"落ち着いて過ごせそうですね。私は帰って、少し早めに休みます。",discourse:"The learner acknowledges the partner and shares a different quiet plan.",profile:REACT_AND_SHARE},{japanese:"いいですね。私はまだ決めていませんが、無理せず過ごしたいです。",discourse:"The learner responds without presuming a shared celebration.",profile:REACT_AND_SHARE}],completion:text("你回應了個人的年末安排，沒有假設共同儀式。","個人の年末の予定に応じ、共通の行事は前提にしませんでした。","You responded to a personal year-end plan without assuming a shared ritual.")}),
      draftPhase({phase:"after",length:"short",learnerRole:"classmate",partnerRole:"classmate",relationship:text("平常會回顧生活小事、彼此不追問家庭計畫的同學。","日々の出来事を振り返るが、家庭の予定は尋ねないクラスメート。","Classmates who recall everyday moments without probing family plans."),situation:text("新的一年開始後，同學回憶一個年末留下印象的時刻。","新しい年になり、クラスメートが年末に印象に残った瞬間を振り返っています。","After the new year begins, classmates recall one memorable year-end moment."),objective:text("描述一個自己記得的片刻，對方也可以選擇分享回憶。","自分が覚えている一場面を話し、相手も話したいことがあれば共有できます。","Describe one moment you chose to remember; the partner may share a memory too."),instruction:text("回憶個人經驗，不假設參拜、聚會或特定倒數活動。","個人の経験を振り返り、参拝や集まり、特定のカウントダウンは前提にしないようにしましょう。","Recall a personal moment without assuming a shrine visit, gathering, or countdown."),primarySkills:["narrate","bounce"],difficulty:INTERMEDIATE_SOCIAL,partner:"年末は家でゆっくりして、好きな音楽を聞いていました。",prompt:text("分享一個自己記得的年末片刻，對方也可補充回憶。","覚えている年末の場面を話しましょう。相手に思い出を尋ねるかは任意です。","Share a year-end moment; the partner may add a memory if they wish."),choices:[{japanese:"私は温かい飲み物を用意して、去年撮った写真を見返しました。どんな音楽を聞いていましたか？",discourse:"The learner narrates a chosen year-end moment and returns the topic.",profile:NARRATE_AND_RETURN},{japanese:"私は静かに本を読んでいました。好きな音楽を聞くと、ゆっくりできますね。",discourse:"The learner shares a personal memory and responds to the partner's routine.",profile:SHARE_AND_REACT}],completion:text("你分享了一個年末時刻，也回應了同學在家聽音樂的分享。","年末の一場面を話し、家で音楽を聴いていた相手の話にも応じました。","You shared a year-end moment and responded to the classmate’s quiet routine.")})
    ]
  },
];

export const seasonalConversationFamilies: readonly SeasonalConversationFamily[] = familyInputs.map(createFamily);
export const seasonalConversationEvents: readonly SeasonalEvent[] = seasonalConversationFamilies.map(({ event }) => event);
export const seasonalConversationDefinitions: readonly ConversationSessionDefinition[] = seasonalConversationFamilies
  .flatMap(({ definitions }) => definitions);
