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
  },
  {
    id: "verb-types",
    group: "basic",
    category: "動詞變化",
    kicker: "基礎判斷",
    title: "動詞三類怎麼分",
    subtitle: "書く（一類）/ 食べる（二類）/ する・来る（三類）",
    explanation:
      "日語動詞分三類，所有變化都先看「字典形＋上下文」判類，再套規則。る結尾不代表就是二類，要先分對類，後面的變化才會跟著對。",
    examples: [
      { formula: "書く（一類）→ 書きます", note: "う段結尾通常為一類" },
      { formula: "読む（一類）→ 読みます", note: "む結尾走一類" },
      { formula: "食べる（二類）→ 食べます", note: "前面是え段の る → 通常是二類" },
      { formula: "見る（二類）→ 見ます", note: "前面是い段の る → 通常是二類" },
      { formula: "する → します", note: "三類：直接記" },
      { formula: "来る → 来ます", note: "三類，讀作きます（不是くます）" }
    ],
    pitfalls: [
      "「帰る」「走る」「入る」「切る」雖然以る結尾，但是一類，要走音便",
      "「勉強する」「練習する」這種 N + する 也跟 する 同類，當三類處理",
      "判斷時要看整個字典形，不要只看結尾一字"
    ],
    drills: [
      {
        labelKey: "drillMasu",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "all",
          practiceFocus: "single",
          targetForm: "masu"
        }
      }
    ],
    requiredForms: ["masu"]
  },
  {
    id: "masu",
    group: "basic",
    category: "動詞變化",
    kicker: "基礎敬語",
    title: "ます形",
    subtitle: "書く → 書きます / 食べる → 食べます",
    explanation:
      "敬語句尾的基本形，也是後面たい、ながら、ことができる 等的接續基礎（V ます形 = V 連用形）。一類動詞最後一字換い段＋ます；二類去る＋ます；三類直接記。",
    examples: [
      { formula: "書く → 書きます", note: "一類：く換き＋ます" },
      { formula: "読む → 読みます", note: "一類：む換み＋ます" },
      { formula: "食べる → 食べます", note: "二類：去る＋ます" },
      { formula: "起きる → 起きます", note: "二類" },
      { formula: "する → します", note: "三類" },
      { formula: "来る → 来ます", note: "三類，讀作きます" }
    ],
    pitfalls: [
      "う結尾不是換あ段；是換い段（買う → 買います，不是買あます）",
      "二類不走音便，直接去る加ます就好",
      "「来る」變ます形時讀作き，不是く（与て形 来て 的讀法一樣）"
    ],
    drills: [
      {
        labelKey: "drillMasu",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "all",
          practiceFocus: "single",
          targetForm: "masu"
        }
      }
    ],
    requiredForms: ["masu"]
  },
  {
    id: "plain",
    group: "basic",
    category: "句型骨架",
    kicker: "普通形整理",
    title: "普通形四格",
    subtitle: "書く / 書かない / 書いた / 書かなかった",
    explanation:
      "普通形是字典形＋ない／た／なかった 四格。同層句型（と思う、と言う、んです、つもり）都接普通形。記得「現在肯定」就是字典形本身。",
    examples: [
      { formula: "書く → 書く / 書かない / 書いた / 書かなかった", note: "動詞：辞書／ない／た／なかった" },
      { formula: "高い → 高い / 高くない / 高かった / 高くなかった", note: "い形容詞：去い再加" },
      { formula: "静か → 静かだ / 静かではない / 静かだった / 静かではなかった", note: "な形容詞" },
      { formula: "学生 → 学生だ / 学生ではない / 学生だった / 学生ではなかった", note: "名詞與な形容詞同型" }
    ],
    pitfalls: [
      "な形容詞和名詞的肯定句尾要加だ（静かだ／学生だ），不是直接接後句",
      "「普通形 + んです」是常見的「強調 / 理由」表達，沒有だ會卡住",
      "接続詞や引用 と思う / と言う 都吃普通形，不是ます形"
    ],
    drills: [
      {
        labelKey: "drillPlain",
        preset: {
          partOfSpeech: "mixed",
          verbGroup: "all",
          practiceFocus: "plain",
          targetForm: "plainPresentAffirmative"
        }
      }
    ],
    requiredForms: [
      "plainPresentAffirmative",
      "plainPresentNegative",
      "plainPastAffirmative",
      "plainPastNegative"
    ]
  },
  {
    id: "potential",
    group: "basic",
    category: "動詞變化",
    kicker: "能力表達",
    title: "可能形 (V られる)",
    subtitle: "書く → 書ける / 食べる → 食べられる",
    explanation:
      "「能做某事」。一類動詞最後一字換え段＋る；二類去る＋られる；三類：する → できる、来る → 来られる。原本的「を」常變「が」（本を読む → 本が読める）。",
    examples: [
      { formula: "書く → 書ける", note: "一類：く換け＋る" },
      { formula: "読む → 読める", note: "一類：む換め＋る" },
      { formula: "食べる → 食べられる", note: "二類：去る＋られる" },
      { formula: "見る → 見られる", note: "二類，注意不是「見れる」(ら抜き)" },
      { formula: "する → できる", note: "三類：不規則" },
      { formula: "来る → 来られる", note: "三類，讀作こられる" }
    ],
    pitfalls: [
      "口語會說「見れる／食べれる」（ら抜き言葉），但正式書面、考試要寫「見られる／食べられる」",
      "句子裡的「を」常變「が」：本を読む → 本が読める",
      "「する」要記成「できる」，不是「しられる」"
    ],
    drills: [
      {
        labelKey: "drillPotential",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "all",
          practiceFocus: "single",
          targetForm: "potential"
        }
      }
    ],
    recommendedAfter: ["verb-types"],
    requiredForms: ["potential"]
  },
  {
    id: "volitional",
    group: "basic",
    category: "動詞變化",
    kicker: "意志・邀請",
    title: "意向形 (V よう)",
    subtitle: "書く → 書こう / 食べる → 食べよう",
    explanation:
      "表「我們...吧」或「自己想做」。一類動詞最後一字換お段＋う；二類去る＋よう；三類：する → しよう、来る → 来よう。常配と思う／とする 表自我決定或正要做。",
    examples: [
      { formula: "書く → 書こう", note: "一類：く換こ＋う" },
      { formula: "読む → 読もう", note: "一類：む換も＋う" },
      { formula: "食べる → 食べよう", note: "二類：去る＋よう" },
      { formula: "見る → 見よう", note: "二類" },
      { formula: "する → しよう", note: "三類" },
      { formula: "来る → 来よう", note: "三類，讀作こよう" }
    ],
    pitfalls: [
      "ます形變ましょう，意向變こう／よう；別把這兩個混在一起",
      "「ようとする」是「正要做（卻被打斷）」，常見搭配",
      "口語邀請：行こう、食べよう；書面或對外人正式：ましょう"
    ],
    drills: [
      {
        labelKey: "drillVolitional",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "all",
          practiceFocus: "single",
          targetForm: "volitional"
        }
      }
    ],
    recommendedAfter: ["verb-types"],
    requiredForms: ["volitional"]
  },
  {
    id: "passive",
    group: "basic",
    category: "動詞變化",
    kicker: "被動表達",
    title: "受身形 (V られる)",
    subtitle: "叱る → 叱られる / 食べる → 食べられる",
    explanation:
      "「被...」。一類動詞最後一字換あ段＋れる；二類去る＋られる；三類：する → される、来る → 来られる。施動者用「に」標記（先生に叱られた）。",
    examples: [
      { formula: "叱る → 叱られる", note: "一類：る換ら＋れる" },
      { formula: "読む → 読まれる", note: "一類：む換ま＋れる" },
      { formula: "食べる → 食べられる", note: "二類：與可能形同形，靠語境判別" },
      { formula: "する → される", note: "三類" },
      { formula: "来る → 来られる", note: "三類（「迷惑の受身」：被人來打擾）" }
    ],
    pitfalls: [
      "二類受身和可能形外形相同（食べられる），要從上下文判別",
      "う結尾的一類動詞要變わ：買う → 買われる（不是買あれる）",
      "「に」標記施動者，「を」標記受動的物：先生に名前を呼ばれた"
    ],
    drills: [
      {
        labelKey: "drillPassive",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "all",
          practiceFocus: "single",
          targetForm: "passive"
        }
      }
    ],
    recommendedAfter: ["verb-types"],
    requiredForms: ["passive"]
  },
  {
    id: "causative",
    group: "basic",
    category: "動詞變化",
    kicker: "命令／允許",
    title: "使役形 (V せる/させる)",
    subtitle: "書く → 書かせる / 食べる → 食べさせる",
    explanation:
      "「讓 X 做／強迫 X 做」。一類動詞最後一字換あ段＋せる；二類去る＋させる；三類：する → させる、来る → 来させる。強制 vs 允許 由助詞 (に／を) 與語境決定。",
    examples: [
      { formula: "書く → 書かせる", note: "一類：く換か＋せる" },
      { formula: "読む → 読ませる", note: "一類：む換ま＋せる" },
      { formula: "食べる → 食べさせる", note: "二類：去る＋させる" },
      { formula: "見る → 見させる", note: "二類" },
      { formula: "する → させる", note: "三類" },
      { formula: "来る → 来させる", note: "三類，讀作こさせる" }
    ],
    pitfalls: [
      "う結尾的一類動詞要變わ：手伝う → 手伝わせる",
      "「に」「を」標記受役者，搭配差別大（息子に行かせる／息子を行かせる）",
      "「させられる」是使役被動「被迫做」，常考"
    ],
    drills: [
      {
        labelKey: "drillCausative",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "all",
          practiceFocus: "single",
          targetForm: "causative"
        }
      }
    ],
    recommendedAfter: ["verb-types"],
    requiredForms: ["causative"]
  },
  {
    id: "desiderative",
    group: "basic",
    category: "動詞變化",
    kicker: "願望表達",
    title: "たい・たがる（願望）",
    subtitle: "行きたい（我）／行きたがる（他）",
    explanation:
      "第一人稱用 V ます形 + たい（い形容詞變化），第三人稱用 V ます形 + たがる（動詞變化）。文法和變化邏輯不同要分開記。",
    examples: [
      { formula: "行く → 行きたい / 行きたくない / 行きたかった", note: "第一人稱：い形容詞變化" },
      { formula: "食べる → 食べたい", note: "二類也是去る＋たい（不要去ます形再去る）" },
      { formula: "妹は 行きたがる / 行きたがっている", note: "第三人稱：動詞變化（がる／がっている）" },
      { formula: "子供は 食べたがっている", note: "第三人稱當下願望多用ている" }
    ],
    pitfalls: [
      "「私は行きたがる」是錯句；自己的願望用「たい」",
      "他人現在的願望多用「たがっている」(具體當下)，「たがる」較常表一般傾向",
      "「を」可變「が」：水を飲みたい／水が飲みたい（後者更口語）"
    ],
    drills: [
      {
        labelKey: "drillDesiderative",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "all",
          practiceFocus: "single",
          targetForm: "desiderative"
        }
      }
    ],
    recommendedAfter: ["masu"],
    requiredForms: ["desiderative"]
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
