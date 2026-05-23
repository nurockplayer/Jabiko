import type { PartOfSpeech, TargetForm, VerbGroup } from "./types";

export type LearningBlockDrillPreset = {
  partOfSpeech: PartOfSpeech | "mixed";
  verbGroup?: VerbGroup | "all";
  practiceFocus: "single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast";
  targetForm: TargetForm;
};

export type LearningBlockDrill = {
  /**
   * Key into the i18n `copy[language]` object pointing at the button label
   * (e.g. "drillAdverbial"). Kept as a plain string so the schema doesn't
   * have to expand whenever a new drill label is added.
   */
  labelKey: string;
  preset: LearningBlockDrillPreset;
};

export type LearningBlock = {
  id: string;
  group: "basic" | "exam";
  category: string;
  kicker?: string;
  title: string;
  subtitle: string;
  explanation: string;
  examples: Array<{ formula: string; note?: string }>;
  pitfalls?: string[];
  /**
   * One or more drill buttons. The first entry is the primary action;
   * additional entries render as secondary buttons in the same row.
   */
  drills?: LearningBlockDrill[];
  /**
   * (PR C) Question IDs from the exam pool that an N1/N2 攻略 block
   * relates to. When launched, the challenge page will filter exam
   * mode to just these questions. Unused by basic blocks.
   */
  relatedExamIds?: string[];
  /**
   * Block ids that the learner is recommended to look at first. Does not
   * gate access -- just surfaces a hint when those prereqs aren't done.
   */
  recommendedAfter?: string[];
  /**
   * Target forms the learner needs to answer correctly at least once to
   * mark this block as 完成 in the index. Optional -- some blocks (e.g.
   * exam-prep 攻略) don't have a single matching practice form.
   */
  requiredForms?: TargetForm[];
};

export const learningBlocks: LearningBlock[] = [
  {
    id: "adverbial",
    group: "basic",
    category: "形容詞 / 名詞 修飾",
    kicker: "基礎修飾",
    title: "先分清楚く / に",
    subtitle: "高く / 静かに / 学生に",
    explanation:
      "い形容詞去い加く修飾動詞；な形容詞與名詞先加に。後面「必要過去」用到的に也是從這裡延伸出來，所以這關要先打好底。",
    examples: [
      { formula: "高い -> 高く", note: "い形容詞修飾動詞用く" },
      { formula: "高い -> 高くない / 高くなかった", note: "否定／否定過去都從く再變" },
      { formula: "静か -> 静かに", note: "な形容詞修飾動詞用に" },
      { formula: "静か -> 静かだ / 静かだった", note: "句尾像名詞句" },
      { formula: "学生 -> 学生に", note: "名詞加に常用在身分／方向" },
      { formula: "学生 -> 学生だった", note: "名詞句尾過去用だった" }
    ],
    pitfalls: [
      "い形容詞否定過去是くなかった，不是かった再否定",
      "な形容詞過去是だった，不要把な留下來再加た"
    ],
    drills: [
      {
        labelKey: "drillIAdjective",
        preset: {
          partOfSpeech: "i_adjective",
          verbGroup: "all",
          practiceFocus: "plain",
          targetForm: "plainPresentNegative"
        }
      },
      {
        labelKey: "drillNaAdjective",
        preset: {
          partOfSpeech: "na_adjective",
          verbGroup: "all",
          practiceFocus: "plain",
          targetForm: "plainPresentNegative"
        }
      },
      {
        labelKey: "drillAdverbial",
        preset: {
          partOfSpeech: "mixed",
          verbGroup: "all",
          practiceFocus: "adverbial",
          targetForm: "adverbial"
        }
      }
    ],
    requiredForms: ["adverbial"]
  },
  {
    id: "negative",
    group: "basic",
    category: "動詞變化",
    kicker: "ない形整理",
    title: "ない形家族",
    subtitle: "書かない -> 書かなかった",
    explanation:
      "把ない、ないで、なくて、なかった串成同一條線。所有否定的延伸（接續、過去）都是先做ない形，再從ない再變。",
    examples: [
      { formula: "書く -> 書かない", note: "一類動詞先換あ段；う結尾要變わ" },
      { formula: "書かない -> 書かないで", note: "否定て形：不是從て形變否定" },
      { formula: "書かない -> 書かなくて", note: "否定接續：常用來接理由或狀態" },
      { formula: "書かない -> 書かなかった", note: "否定過去：不是從た形變否定" }
    ],
    pitfalls: [
      "否定不要從て形變、要從ない形變",
      "う結尾的一類動詞要變わない（買う -> 買わない），不是あない"
    ],
    drills: [
      {
        labelKey: "drillNegative",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "all",
          practiceFocus: "negative",
          targetForm: "nai"
        }
      }
    ],
    requiredForms: ["nai", "negativeTe", "negativeContinuative", "plainPastNegative"]
  },
  {
    id: "teTa",
    group: "basic",
    category: "動詞變化",
    kicker: "音便整理",
    title: "動詞て形 / た形",
    subtitle: "読む -> 読んで / 読んだ",
    explanation:
      "熟悉一類動詞的音便（く→いて、ぐ→いで、す→して、う・つ・る→って、む・ぶ・ぬ→んで），任何句型都能直接套。",
    examples: [
      { formula: "書く -> 書いて / 書いた", note: "く結尾：いて／いた" },
      { formula: "泳ぐ -> 泳いで / 泳いだ", note: "ぐ結尾：いで／いだ" },
      { formula: "話す -> 話して / 話した", note: "す結尾：して／した" },
      { formula: "待つ -> 待って / 待った", note: "う・つ・る結尾：って／った" },
      { formula: "読む -> 読んで / 読んだ", note: "む・ぶ・ぬ結尾：んで／んだ" }
    ],
    pitfalls: [
      "二類動詞直接去る加て／た（食べる -> 食べて／食べた），不走音便",
      "「帰る」雖然以る結尾，但是一類，要走音便（帰る -> 帰って／帰った）"
    ],
    drills: [
      {
        labelKey: "drillGodanTeTa",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "godan",
          practiceFocus: "teTa",
          targetForm: "te"
        }
      }
    ],
    requiredForms: ["te", "ta"]
  },
  {
    id: "obligationPast",
    group: "basic",
    category: "進階句型",
    kicker: "綜合應用",
    title: "必要過去",
    subtitle: "学生 + に + ならなければならなかった",
    explanation:
      "把「必要 (なければならない)」推到過去（なければならなかった）。動詞直接做；形容詞和名詞要先變成「-くなる / -になる」再做必要過去。",
    examples: [
      { formula: "書く -> 書かなければならなかった", note: "動詞：先做ない形「書かない」，再換ない為なければならなかった" },
      { formula: "高い -> 高くならなければならなかった", note: "い形容詞：先做高くなる，再變必要過去" },
      { formula: "静か -> 静かにならなければならなかった", note: "な形容詞：先加に做静かになる" },
      { formula: "学生 -> 学生にならなければならなかった", note: "名詞：最容易卡的型在這裡" }
    ],
    pitfalls: [
      "形容詞、名詞要先變成「-くなる / -になる」再加必要過去",
      "過去要放在最後的ならなかった，不是放在前面"
    ],
    drills: [
      {
        labelKey: "drillObligationPast",
        preset: {
          partOfSpeech: "noun",
          verbGroup: "all",
          practiceFocus: "obligationPast",
          targetForm: "obligationPast"
        }
      }
    ],
    recommendedAfter: ["adverbial", "negative", "teTa"],
    requiredForms: ["obligationPast"]
  }
];

type CompletionAttempt = { isCorrect: boolean; targetForm: string };

export function isLearningBlockComplete(attempts: CompletionAttempt[], block: LearningBlock): boolean {
  if (!block.requiredForms || block.requiredForms.length === 0) return false;
  return block.requiredForms.every((targetForm) =>
    attempts.some((attempt) => attempt.isCorrect && attempt.targetForm === targetForm)
  );
}

/**
 * Returns the recommended-prerequisite block ids that are NOT yet complete.
 * Used to surface a soft hint ("建議先看：XX") -- access is never gated.
 */
export function getIncompletePrereqs(attempts: CompletionAttempt[], block: LearningBlock): string[] {
  if (!block.recommendedAfter || block.recommendedAfter.length === 0) return [];
  return block.recommendedAfter.filter((prereqId) => {
    const prereq = learningBlocks.find((b) => b.id === prereqId);
    return Boolean(prereq) && !isLearningBlockComplete(attempts, prereq!);
  });
}

/**
 * Kept for the challenge-page focus filter: it still hides the 必要過去
 * option until the learner has worked through the basics. The learning
 * page itself no longer uses this -- every block is always clickable.
 */
export function isObligationUnlocked(attempts: CompletionAttempt[]): boolean {
  const block = learningBlocks.find((b) => b.id === "obligationPast");
  if (!block) return true;
  return getIncompletePrereqs(attempts, block).length === 0;
}
