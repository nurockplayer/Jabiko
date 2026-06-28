import type { SentencePatternId } from "./sentencePatterns";
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

export type LearningBlockPatternDrill = {
  labelKey: string;
  patternIds: SentencePatternId[];
};

export type LearningBlockExamDrill = {
  labelKey: string;
  /** JLPT level whose exam pool to drill (matches the 模擬考 section launch). */
  level: "N1" | "N2" | "N3";
  /** Exam section to narrow to, e.g. "文法形式選擇". */
  promptLabel: string;
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
   * "tracked" (default): completion is decided by requiredForms.
   * "reference": this chapter has no completable drill of its own --
   * it's reading material. UI shows "參考" instead of completion state
   * and the recommendation algorithm skips it (treats it as
   * always-complete) so it doesn't get stuck recommending these.
   */
  completionMode?: "tracked" | "reference";
  /**
   * One or more drill buttons. The first entry is the primary action;
   * additional entries render as secondary buttons in the same row.
   */
  drills?: LearningBlockDrill[];
  /**
   * Sentence-pattern drills (separate from `drills` because they
   * launch a different practice mode and take a different shape).
   * Rendered as the chapter's PRIMARY drill row -- they actually test
   * the pattern the chapter teaches, whereas `drills` for these
   * chapters is the underlying form variation (te-form, nai-form,
   * plain-form). Reserved for the four sentence-pattern reference
   * chapters.
   */
  patternDrills?: LearningBlockPatternDrill[];
  /**
   * Launches exam practice filtered to a JLPT level + section (promptLabel),
   * e.g. N3 文法形式選擇. Used by N3+ grammar-lesson chapters whose practice is
   * the level's general grammar pool, not one specific point. These chapters
   * are reading lessons (completionMode "reference") -- the drill is a CTA, not
   * a per-chapter completion signal.
   */
  examDrill?: LearningBlockExamDrill;
  /**
   * Optional note rendered above the drill button row. Used by
   * reference chapters whose drill targets a prerequisite form rather
   * than the chapter's own pattern, so the gap between "what you're
   * reading" and "what you'll practice" is explicit.
   */
  drillNote?: string;
  /**
   * Block ids the learner is suggested to look at first. Informational
   * only -- access is never blocked. Used to render a soft
   * "建議先看：XX" hint in the chapter list when those prereqs are
   * still incomplete.
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
    title: "動詞て形 / た形（一類音便重點）",
    subtitle: "読む → 読んで / 読んだ（一類動詞五種音便）",
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
    completionMode: "reference",
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
    ]
    // verb-types is a reference chapter -- there's no targetForm in
    // the engine that uniquely tests classification, so ます is the
    // canonical drill. The "reference" completionMode keeps verb-types
    // off the per-attempt completion tracker (avoids the shared-
    // completion bug Codex flagged on PR #28) and lets the chapter
    // show 「參考」 instead of getting stuck "incomplete" forever.
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
    recommendedAfter: ["masu"],
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
    recommendedAfter: ["masu"],
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
    recommendedAfter: ["masu"],
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
      "助詞提示受役者的角色（息子に行かせる／息子を行かせる），但「強制 vs 允許」主要靠語境判讀，不是只看助詞",
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
    recommendedAfter: ["masu"],
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
      { formula: "食べる → 食べたい", note: "二類：去る得到ます stem「食べ」，再加たい" },
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
  },
  {
    id: "te-kudasai",
    group: "basic",
    category: "句型",
    kicker: "請求 / 許可",
    title: "てください / てもいい / てはいけない",
    subtitle: "書いてください / 食べてもいい / 入ってはいけません",
    explanation:
      "三個 N5 必背的 V て形句型：請求對方做（てください）、徵求許可（てもいい）、強烈禁止（てはいけない）。先把 て形 音便記熟，再記三個句尾的差別就能直接套。",
    examples: [
      { formula: "書く → 書いてください", note: "請對方做這個動作" },
      { formula: "食べる → 食べてもいいですか", note: "尋求許可，加「ですか」更禮貌" },
      { formula: "入る → 入ってはいけません", note: "強烈禁止（規定、警告）" },
      { formula: "ここで写真を撮る → 撮ってもいい", note: "省略「ですか」變成「可以做」的陳述" }
    ],
    pitfalls: [
      "三句型都需要 V て形作前置；先把 て形 音便（いて／いで／して／って／んで）記熟才能正確接",
      "「ないでください」(請不要做) 比「てはいけません」(禁止) 軟，請對方時用前者較自然",
      "「もいい」常省略「ですか」變陳述，要看語境分清是徵求許可還是給予許可"
    ],
    patternDrills: [
      {
        labelKey: "drillPatternTeKudasai",
        patternIds: ["te-kudasai"]
      }
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
    drillNote: "※ 上方按鈕直接練本章句型判斷；下方按鈕加練前置「て形」音便。",
    recommendedAfter: ["teTa"]
  },
  {
    id: "nakute-mo-ii",
    group: "basic",
    category: "句型",
    kicker: "不必要",
    title: "なくてもいい（不必）",
    subtitle: "書かなくてもいい / 高くなくてもいい / 学生でなくてもいい",
    explanation:
      "表「不做也可以、沒必要做」。動詞用 Vない形 把ない換成 なくてもいい；形容詞用「-くなくてもいい」；名詞用「-でなくてもいい」。",
    examples: [
      { formula: "書く → 書かなくてもいい", note: "動詞：ない形 + なくてもいい" },
      { formula: "来る → 来なくてもいい", note: "三類動詞：直接記" },
      { formula: "高い → 高くなくてもいい", note: "い形容詞：去い加 -くなくてもいい" },
      { formula: "学生 → 学生でなくてもいい", note: "名詞 / な形容詞：-でなくてもいい" }
    ],
    pitfalls: [
      "反義是「なければならない」(必須做)，要分清「不必」與「必須」",
      "名詞用「でなくてもいい」（不是「ではないでもいい」）",
      "口語常省略「いい」後面的「です」，正式書面要加上"
    ],
    patternDrills: [
      {
        labelKey: "drillPatternNakuteMoII",
        patternIds: ["nakute-mo-ii"]
      }
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
    drillNote: "※ 上方按鈕直接練「不必 vs 必須」判斷；下方按鈕加練前置「ない形家族」。",
    recommendedAfter: ["negative"]
  },
  {
    id: "te-morau",
    group: "basic",
    category: "句型",
    kicker: "授受表現",
    title: "てもらう / てくれる / てあげる",
    subtitle: "教えてもらう / 教えてくれる / 教えてあげる",
    explanation:
      "日語特殊的「授受」表現，視角不同：「てあげる」是「我（內側）對別人做」、「てくれる」是「別人對我做」、「てもらう」是「我主動請別人幫忙」。視角判錯是這個句型最大的坑。",
    examples: [
      { formula: "友達が 教えてくれた", note: "別人對我做：朋友（為我）教" },
      { formula: "友達に 教えてもらった", note: "我主動請別人做：請朋友教（並接受）" },
      { formula: "弟に 教えてあげた", note: "我對別人做：我（為弟弟）教" },
      { formula: "先生に 来ていただいた", note: "「いただく」是「もらう」的謙讓，對上位用" }
    ],
    pitfalls: [
      "別人對我做事一律用「てくれる」家族，不能用「てあげる」（容易記混）",
      "對上位／長輩用「ていただく」(=てもらう 謙讓) 或「てくださる」(=てくれる 尊敬)",
      "助詞配對：てもらう／てあげる 用「に」標記做事者；てくれる 用「が」"
    ],
    patternDrills: [
      {
        labelKey: "drillPatternTeMorau",
        patternIds: ["te-morau"]
      }
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
    drillNote: "※ 上方按鈕直接練授受視角判斷；下方按鈕加練前置「て形」。",
    recommendedAfter: ["teTa"]
  },
  {
    id: "to-omou",
    group: "basic",
    category: "句型",
    kicker: "引用 / 意見",
    title: "と思う / と言う（引用・意見）",
    subtitle: "明日は雨だと思う / 「行く」と言った",
    explanation:
      "用「と」標記引用內容，再接「思う」(認為) 或「言う」(說)。意見與間接引用通常用普通形（雨だと思う）；直接引用時引號內可以保留原話，例如「行きます」と言った 也是合法的。整體看，把普通形練熟最不容易出錯。",
    examples: [
      { formula: "明日は雨だ → 明日は雨だと思う", note: "個人意見：我覺得明天會下雨" },
      { formula: "「行く」と言った", note: "直接引用：可用普通形「行く」也可用「行きます」原話" },
      { formula: "美味しい → 美味しいと思う", note: "い形容詞的普通形直接接と" },
      { formula: "学生だ → 学生だと言った", note: "な形容詞 / 名詞要保留「だ」" }
    ],
    pitfalls: [
      "間接引用 / 個人意見要用普通形（×「雨ですと思う」、○「雨だと思う」）",
      "な形容詞和名詞要加「だ」（×「静かと思う」→ ○「静かだと思う」）",
      "口語可把「と」說成「って」：「行くって言った」"
    ],
    patternDrills: [
      {
        labelKey: "drillPatternToOmou",
        patternIds: ["to-omou"]
      }
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
    drillNote: "※ 上方按鈕直接練引用 / 意見判斷；下方按鈕加練前置「普通形」。",
    recommendedAfter: ["plain"]
  },
  {
    id: "mae-ato",
    group: "basic",
    category: "句型",
    kicker: "前後順序",
    title: "まえに / あとで / てから（前後順序）",
    subtitle: "食べるまえに / 食べたあとで / 手を洗ってから",
    explanation:
      "三個表「時間先後」的句型。「Vるまえに」＝在某事『之前』，前面永遠用辭書形；「Vたあとで」＝在某事『之後』，前面用た形；「Vてから」＝做完前項『再』接著做，強調緊接。判斷時先看後句發生在前項之前還是之後，再注意まえに接辭書形、あとで接た形。",
    examples: [
      { formula: "寝るまえに歯をみがく", note: "睡前刷牙；まえに 前面用辭書形" },
      { formula: "ごはんを食べたあとで散歩する", note: "吃完飯後散步；あとで 前面用た形" },
      { formula: "手を洗ってからご飯を食べる", note: "洗手後再吃；てから 強調緊接著" },
      { formula: "× 食べたまえに / × 食べるあとで", note: "まえに 不接た形、あとで 不接辭書形" }
    ],
    pitfalls: [
      "まえに 前面一律辭書形，就算整句是過去式也一樣（× 行ったまえに → ○ 行くまえに）",
      "あとで 前面用た形（× 食べるあとで → ○ 食べたあとで）",
      "てから 與 たあとで 都表「之後」，但 てから 更強調『做完前項緊接著做後項』"
    ],
    patternDrills: [
      {
        labelKey: "drillPatternMaeAto",
        patternIds: ["mae-ato"]
      }
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
    drillNote: "※ 上方按鈕直接練前後順序判斷；下方按鈕加練前置「て形 / た形」音便。",
    recommendedAfter: ["teTa"]
  },
  {
    id: "nagara-tari",
    group: "basic",
    category: "句型",
    kicker: "並列・同時",
    title: "ながら / たり / て / し（動作の連接）",
    subtitle: "聞きながら / 読んだり / 洗って / 安いし",
    explanation:
      "連接兩個以上動作或理由的四種方式。「Vます語幹＋ながら」＝同一人『同時』做兩件事；「Vたり〜Vたりする」＝列舉幾個代表性動作；「Vて」＝依『時間順序』接續；「〜し」＝並列『加上理由』（可接形容詞）。判斷時看是同時、列舉、順序，還是在堆疊理由。",
    examples: [
      { formula: "音楽を聞きながら勉強する", note: "邊聽音樂邊念書；同一人同時進行" },
      { formula: "本を読んだり音楽を聞いたりする", note: "看看書、聽聽音樂；列舉代表動作" },
      { formula: "起きて、顔を洗って、出かける", note: "起床→洗臉→出門；時間順序" },
      { formula: "安いし、おいしい", note: "又便宜又好吃；並列加理由，可接形容詞" }
    ],
    pitfalls: [
      "ながら 前面用ます形語幹（歩きながら，不是 歩くながら），且必須同一主語同時進行",
      "たり 要成對使用（〜たり〜たりする），通常是『舉例』而非全部",
      "し 可以接形容詞（安いし）；ながら / て 不能直接接い形容詞"
    ],
    patternDrills: [
      {
        labelKey: "drillPatternNagaraTari",
        patternIds: ["nagara-tari"]
      }
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
    drillNote: "※ 上方按鈕直接練連接方式判斷；下方按鈕加練前置「て形」音便。",
    recommendedAfter: ["teTa"]
  },
  {
    id: "te-aux",
    group: "basic",
    category: "句型",
    kicker: "補助動詞",
    title: "てみる / ておく / てしまう / ている（て＋補助動詞）",
    subtitle: "食べてみる / 買っておく / 忘れてしまう / 続いている",
    explanation:
      "「Vて」後面接補助動詞，替動作加上不同語感：「てみる」＝『試試看』；「ておく」＝『事先』做好並擱著；「てしまう」＝把事情『做完』，或表『遺憾・不小心』；「ている」＝動作『進行中』或『持續的狀態』。先把て形音便記熟，再記四個補助動詞的語感差別。",
    examples: [
      { formula: "新しい料理を食べてみる", note: "吃吃看；嘗試" },
      { formula: "旅行のまえにホテルを予約しておく", note: "旅行前先訂好飯店；事先準備" },
      { formula: "電車に財布を忘れてしまった", note: "把錢包忘在電車上了；遺憾・不小心" },
      { formula: "今、雨が降っている", note: "現在正在下雨；進行・狀態" }
    ],
    pitfalls: [
      "てしまう 常表『遺憾・不小心』，口語縮成「〜ちゃう」（食べちゃった）",
      "ておく 口語縮成「〜とく」（買っとく）",
      "ている 可表進行，也可表結果狀態（結婚している＝已婚的狀態，不是正在結婚）"
    ],
    patternDrills: [
      {
        labelKey: "drillPatternTeAux",
        patternIds: ["te-aux"]
      }
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
    drillNote: "※ 上方按鈕直接練補助動詞語感判斷；下方按鈕加練前置「て形」音便。",
    recommendedAfter: ["teTa"]
  },
  {
    id: "n3-jouken",
    group: "basic",
    category: "N3 文法",
    kicker: "四種「如果」",
    title: "ば / たら / なら / と（四種條件）",
    subtitle: "押せば / 着いたら / 行くなら / 春になると",
    explanation:
      "四個都能翻成「如果／一…就」，差別在分工。「と」：必然、自然的結果（規律、機械、路線），後句不接意志／命令／請求。「ば」：一般條件、假設，強調前項是後項成立的條件。「たら」：最泛用、口語最常見，「做完 A 之後 B」或「如果 A 的話 B」，後句可接命令、過去的發現。「なら」：針對對方提到的話題給前提／建議（「要…的話」），前句甚至可比後句晚發生。",
    examples: [
      { formula: "春になると、桜が咲く", note: "と：必然・自然規律（後句不用意志）" },
      { formula: "このボタンを押せば、ドアが開く", note: "ば：一般條件" },
      { formula: "安ければ買う", note: "ば：形容詞也用ば" },
      { formula: "駅に着いたら、電話して", note: "たら：做完A後B，後句可命令" },
      { formula: "日本へ行くなら、JRパスがいい", note: "なら：針對對方說的話題給建議" }
    ],
    pitfalls: [
      "「と」後句不能接意志・命令・請求・邀約（×春になると、花を植えよう）→ 改用たら／ば",
      "拿不定主意時「たら」多半最安全，它涵蓋面最廣、最口語",
      "「なら」是「就你說的那件事」給前提，常呼應對方的話；なら 前句可比後句晚發生（日本へ行くなら、ガイドブックを先に買う）",
      "前後不同主語、且後句是意志時，「ば」會不自然，改用「たら」"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  },
  {
    id: "n3-suiryou",
    group: "basic",
    category: "N3 文法",
    kicker: "看起來・聽說・好像",
    title: "そうだ / ようだ / らしい / みたい（推量・伝聞）",
    subtitle: "降りそう / 降ったようだ / 降るらしい / 降るみたい",
    explanation:
      "都在表「推測／傳聞」，差在「根據」與「語氣」。「そうだ（様態）」：看當下外觀判斷「眼看就要…／看起來…」，接 V ます形・形容詞語幹。「そうだ（伝聞）」：聽說，接普通形，接法和様態不同。「ようだ」：根據自己觀察到的證據做的推斷（較客觀、偏書面）。「らしい」：根據外部情報或跡象做的推斷／傳聞（也可表「有…的樣子」，如 男らしい）。「みたい」：ようだ 的口語版，直接接普通形／名詞。",
    examples: [
      { formula: "空が暗い。雨が降りそうだ", note: "そう（様態）：看外觀，眼看要下。接ます形" },
      { formula: "天気予報によると、雨が降るそうだ", note: "そう（伝聞）：聽說。接普通形" },
      { formula: "道がぬれている。雨が降ったようだ", note: "ようだ：根據證據推斷" },
      { formula: "彼は今日来ないらしい", note: "らしい：根據聽來的情報" },
      { formula: "外は寒いみたいだ", note: "みたい：ようだ 的口語" }
    ],
    pitfalls: [
      "様態「そう」接ます形／語幹（降りそう）、伝聞「そう」接普通形（降るそうだ）——看接續判斷是哪個",
      "「いい」「ない」的様態是 よさそう／なさそう（不是 いそう／なそう）",
      "「ようだ」偏自己證據推斷、偏書面；「らしい」偏外部傳聞；口語最常用「みたい」",
      "名詞・な形接法：ようだ＝学生のようだ・元気なようだ；みたい＝学生みたい・元気みたい（直接接，な形不加 だ）"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  }
];

type CompletionAttempt = { isCorrect: boolean; targetForm: string; questionId?: string };

export function isLearningBlockComplete(attempts: CompletionAttempt[], block: LearningBlock): boolean {
  // Reference chapters are reading material -- treat them as
  // "no completion needed" so the recommendation algorithm doesn't
  // park on them, and the UI shows "參考" rather than misleadingly
  // marking them perpetually incomplete.
  if (block.completionMode === "reference") return true;
  // Sentence-pattern chapters are completed via their pattern drill -- a
  // correct attempt on any of the chapter's patterns (id "pattern-<id>-…") --
  // not via a conjugation form, so they count toward progress like the rest.
  if (block.patternDrills && block.patternDrills.length > 0) {
    const patternIds = block.patternDrills.flatMap((drill) => drill.patternIds);
    return attempts.some(
      (attempt) =>
        attempt.isCorrect &&
        patternIds.some((pid) => attempt.questionId?.startsWith(`pattern-${pid}-`))
    );
  }
  if (!block.requiredForms || block.requiredForms.length === 0) return false;
  return block.requiredForms.every((targetForm) =>
    attempts.some((attempt) => attempt.isCorrect && attempt.targetForm === targetForm)
  );
}

/**
 * Returns the recommendedAfter ids whose blocks are NOT yet complete.
 * Powers the informational "建議先看：XX" hint in the chapter list --
 * never blocks access (no callers gate UI on this).
 */
export function getIncompletePrereqs(attempts: CompletionAttempt[], block: LearningBlock): string[] {
  if (!block.recommendedAfter || block.recommendedAfter.length === 0) return [];
  return block.recommendedAfter.filter((prereqId) => {
    const prereq = learningBlocks.find((b) => b.id === prereqId);
    if (!prereq) return false;
    // Reference prereqs don't sit in the hint (their completion is
    // implicit via reading); we only nudge learners on prereqs that
    // can actually be completed via a drill.
    if (prereq.completionMode === "reference") return false;
    return !isLearningBlockComplete(attempts, prereq);
  });
}
