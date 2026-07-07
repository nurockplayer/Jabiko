import type { KanaScript } from "./kana";
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

export type LearningBlockKanaDrill = {
  labelKey: string;
  /** Which gojuon script the recognition drill covers (#533). */
  script: KanaScript;
};

export type LearningBlockStarterDrill = {
  labelKey: string;
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
   * Launches the kana recognition drill (#533). Rendered as the chapter's
   * PRIMARY drill row; completion is judged by kana question ids
   * ("kana-<script>-…"), not by a conjugation form.
   */
  kanaDrill?: LearningBlockKanaDrill;
  /**
   * Launches the starter-vocab meaning drill (#533). Completion is judged by
   * starter question ids ("starter-…"), like the kana chapters.
   */
  starterDrill?: LearningBlockStarterDrill;
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
   * 入門 chapters set this (#533/#534): the chapter ALSO counts as complete
   * for a learner whose history shows real (non-入門) practice -- these
   * chapters sit first in array order, and without this rule every existing
   * learner's home 繼續 banner would be hijacked into Lesson-0 material
   * they plainly don't need.
   */
  implicitCompleteWithHistory?: boolean;
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
  // ---- 入門（zero-base starter，#533）--------------------------------------
  // The absolute-beginner floor: kana literacy. These two chapters sit ahead
  // of everything else because every other view assumes the learner can
  // already read kana. Completion = one correct answer in the chapter's
  // kana drill (judged by question-id prefix, not a conjugation form).
  {
    id: "kana-hiragana",
    group: "basic",
    category: "入門",
    kicker: "第 0 課",
    title: "五十音・平假名",
    subtitle: "あ・い・う・え・お",
    explanation:
      "平假名是日文的注音字母，所有句子的骨架都靠它。先把 46 個清音記熟：一行一行背（あ行、か行……），每行最多 5 個音。之後的濁音（が）只是在清音右上加兩點、半濁音（ぱ）加小圈，拗音（きゃ）則是「子音＋小さいゃゅょ」拼在一起。發音規則非常規律，唯獨幾個要特別記：し=shi、ち=chi、つ=tsu、ふ=fu。",
    examples: [
      { formula: "あ a・い i・う u・え e・お o", note: "あ行（母音）" },
      { formula: "か ka・き ki・く ku・け ke・こ ko", note: "か行" },
      { formula: "さ sa・し shi・す su・せ se・そ so", note: "さ行：し 是 shi" },
      { formula: "た ta・ち chi・つ tsu・て te・と to", note: "た行：ち/つ 特別記" },
      { formula: "な na・に ni・ぬ nu・ね ne・の no", note: "な行" },
      { formula: "は ha・ひ hi・ふ fu・へ he・ほ ho", note: "は行：ふ 是 fu" },
      { formula: "ま ma・み mi・む mu・め me・も mo", note: "ま行" },
      { formula: "や ya・ゆ yu・よ yo", note: "や行（只有三個）" },
      { formula: "ら ra・り ri・る ru・れ re・ろ ro", note: "ら行" },
      { formula: "わ wa・を wo・ん n", note: "わ行＋撥音ん" },
      { formula: "が ga・ざ za・だ da・ば ba", note: "濁音：右上加兩點（各行第一個）" },
      { formula: "ぱ pa・ぴ pi・ぷ pu・ぺ pe・ぽ po", note: "半濁音：只有ぱ行" },
      { formula: "きゃ kya・しゃ sha・ちゃ cha", note: "拗音：子音＋小さいゃゅょ" }
    ],
    pitfalls: [
      "形近字先認清：ぬ/め、ね/れ/わ、る/ろ、は/ほ、き/さ/ち",
      "じ 和 ぢ 都讀 ji、ず 和 づ 都讀 zu（一般用 じ/ず，ぢ/づ 只出現在少數詞）",
      "小さい ゃゅょ 和大的 やゆよ 意思不同：きや kiya ≠ きゃ kya"
    ],
    kanaDrill: { labelKey: "drillKana", script: "hiragana" },
    implicitCompleteWithHistory: true
  },
  {
    id: "kana-katakana",
    group: "basic",
    category: "入門",
    kicker: "第 0 課",
    title: "五十音・片假名",
    subtitle: "ア・イ・ウ・エ・オ",
    explanation:
      "片假名跟平假名一一對應、讀音完全相同，用在外來語（コーヒー咖啡）、外國人名地名、擬聲擬態與強調。因為對應關係固定（あ↔ア、き↔キ），學法就是拿熟悉的平假名去配對。片假名筆畫更直更方，幾組形近字（シ/ツ、ソ/ン）是所有初學者的必經之路，練認讀時特別留意。",
    examples: [
      { formula: "ア a・イ i・ウ u・エ e・オ o", note: "ア行" },
      { formula: "カ ka・キ ki・ク ku・ケ ke・コ ko", note: "カ行" },
      { formula: "サ sa・シ shi・ス su・セ se・ソ so", note: "サ行：シ 注意方向" },
      { formula: "タ ta・チ chi・ツ tsu・テ te・ト to", note: "タ行：ツ 和 シ 形近" },
      { formula: "ナ na・ニ ni・ヌ nu・ネ ne・ノ no", note: "ナ行" },
      { formula: "ハ ha・ヒ hi・フ fu・ヘ he・ホ ho", note: "ハ行" },
      { formula: "マ ma・ミ mi・ム mu・メ me・モ mo", note: "マ行" },
      { formula: "ヤ ya・ユ yu・ヨ yo", note: "ヤ行" },
      { formula: "ラ ra・リ ri・ル ru・レ re・ロ ro", note: "ラ行" },
      { formula: "ワ wa・ヲ wo・ン n", note: "ワ行＋ン：ン 和 ソ 形近" },
      { formula: "コーヒー / テレビ / カラオケ", note: "外來語都寫片假名" }
    ],
    pitfalls: [
      "シ（shi）/ ツ（tsu）：シ 的點偏橫、ツ 的點偏直",
      "ソ（so）/ ン（n）：ソ 的撇由上往下、ン 由下往上",
      "ク/ワ/フ、コ/ユ、チ/テ 也是常見形近組"
    ],
    kanaDrill: { labelKey: "drillKana", script: "katakana" },
    implicitCompleteWithHistory: true,
    recommendedAfter: ["kana-hiragana"]
  },
  {
    id: "starter-vocab",
    group: "basic",
    category: "入門",
    kicker: "第 0 課",
    title: "基礎詞彙",
    subtitle: "みず・いぬ・ありがとう",
    explanation:
      "會唸假名之後，先背一批「馬上用得到」的詞：招呼語、數字、時間、身邊的人事物、最常用的動詞和形容詞。這批詞全部用假名書寫，不用會漢字也能練。之後每個文法章節的例句，幾乎都由這些詞組成。",
    examples: [
      { formula: "ありがとう・すみません・おはよう", note: "招呼語：開口的第一步" },
      { formula: "いち・に・さん・じゅう・ひゃく", note: "數字：買東西、報時間都靠它" },
      { formula: "きょう・あした・いま・まいにち", note: "時間詞" },
      { formula: "わたし・せんせい・ともだち・かぞく", note: "人與稱謂" },
      { formula: "みず・ごはん・いえ・がっこう", note: "身邊名詞" },
      { formula: "たべる・のむ・いく・みる", note: "最常用動詞" },
      { formula: "おおきい・ちいさい・おいしい", note: "常用形容詞" },
      { formula: "これ・それ・あれ・ここ・どこ", note: "こそあど：指東西問地方" }
    ],
    pitfalls: [
      "すみません（喚起注意／輕道歉）和 ごめんなさい（認錯道歉）場合不同",
      "これ／それ／あれ 按「離誰近」區分：近自己→これ、近對方→それ、都遠→あれ",
      "たかい 同時有「高」和「貴」兩個意思，看語境判斷"
    ],
    starterDrill: { labelKey: "drillStarterVocab" },
    implicitCompleteWithHistory: true,
    recommendedAfter: ["kana-hiragana"]
  },
  {
    id: "starter-desu",
    group: "basic",
    category: "入門",
    kicker: "第 0 課",
    title: "基本句 AはBです",
    subtitle: "です・じゃありません・でした",
    explanation:
      "日文最基本的句子：「AはBです」＝「A 是 B」。は 標記你要談論的主題（讀作 wa），です 放在句尾。要說「不是」就把です換成じゃありません；說過去的事換成でした；問問題就在句尾加か變成ですか。這四個結尾練熟，就能開始說完整的句子。",
    examples: [
      { formula: "わたしは がくせいです", note: "A是B：我是學生" },
      { formula: "せんせい じゃありません", note: "否定：不是老師" },
      { formula: "きのうは あめでした", note: "過去：昨天下雨" },
      { formula: "いいえ、あめ じゃありませんでした", note: "過去否定：昨天沒下雨" },
      { formula: "あれは いぬですか", note: "疑問：那是狗嗎？" },
      { formula: "はじめまして。なまえは たなかです", note: "自我介紹" }
    ],
    pitfalls: [
      "主題的は讀作 wa、不讀 ha——寫は讀 wa 是固定規則",
      "「明天」還沒發生也用です：あしたは やすみです（不用未來式）",
      "口語常把じゃありません說成じゃないです，意思相同"
    ],
    patternDrills: [{ labelKey: "drillPatternStarterDesu", patternIds: ["starter-desu"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["kana-hiragana", "starter-vocab"]
  },
  {
    id: "starter-particles",
    group: "basic",
    category: "入門",
    kicker: "第 0 課",
    title: "助詞入門 は・を・に・が",
    subtitle: "わたしは みずを のみます",
    explanation:
      "助詞是黏在名詞後面的小字，負責說明「這個名詞在句子裡做什麼」。最先要認得的四個：は＝主題（這句在談誰）、を＝動作的對象（吃什麼、喝什麼）、に＝目的地或時間點（去哪裡）、が＝第一次登場的主語（有什麼、誰做）。再加上場所的で（在哪裡做）和一起的と（和誰），日常句子就都拼得起來了。",
    examples: [
      { formula: "わたしは みずを のみます", note: "は主題＋を對象：我喝水" },
      { formula: "がっこうに いきます", note: "に目的地：去學校" },
      { formula: "そこに いぬが います", note: "が登場：那裡有狗" },
      { formula: "だれが きますか", note: "疑問詞主語只能用が" },
      { formula: "いえで たべます", note: "で動作場所：在家吃" },
      { formula: "ともだちと はなします", note: "と一起：和朋友聊" }
    ],
    pitfalls: [
      "「在某處做動作」用で、「存在於某處／去某處」用に：いえで たべます vs いえに います",
      "疑問詞（だれ・なに）當主語只能接が，不能接は",
      "を 只用來標動作對象；現代日文裡讀音和 お 相同"
    ],
    patternDrills: [
      { labelKey: "drillPatternStarterParticles", patternIds: ["starter-particles"] }
    ],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["starter-desu"]
  },
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
      "不確定用哪個時「たら」多半最安全，它涵蓋面最廣、最口語",
      "「なら」是「就你說的那件事」給前提，常呼應對方的話；なら 前句可比後句晚發生（日本へ行くなら、ガイドブックを先に買う）",
      "前項是動作動詞、後句又接意志／命令時，「ば」會不自然，改用「たら」（東京へ行ったら、連絡して）"
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
      "都在表「推測／傳聞」，差在「根據」與「語氣」。「そうだ（様態）」：看當下外觀判斷「眼看就要…／看起來…」，接ます形・形容詞語幹。「そうだ（伝聞）」：聽說，接普通形，接法和様態不同。「ようだ」：根據自己觀察到的證據做的推斷（較客觀、偏書面）。「らしい」：根據外部情報或跡象做的推斷／傳聞（也可表「有…的樣子」，如 男らしい）。「みたい」：ようだ 的口語版，直接接普通形／名詞。",
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
  },
  {
    id: "n3-gyakusetsu",
    group: "basic",
    category: "N3 文法",
    kicker: "轉折・讓步",
    title: "のに / ても / けど（逆接）",
    subtitle: "勉強したのに / 高くても / 安いけど",
    explanation:
      "三個都表「雖然…但…」，語感不同。「のに」：帶意外・不滿・遺憾的逆接（預期 A 卻 B，含情緒），接普通形（な形／名詞用 なのに）。「ても」：逆接條件「即使…也…」，動詞接 て形、い形＋くても、な形／名詞＋でも；疑問詞＋ても＝無論。「けど（けれど／が）」：最中性、口語的「但是」，語氣最輕、最常用。",
    examples: [
      { formula: "たくさん勉強したのに、試験に落ちた", note: "のに：努力了卻…（遺憾・意外）" },
      { formula: "高くても、これが欲しい", note: "ても：即使…也（逆接條件）" },
      { formula: "この店は安いけど、おいしい", note: "けど：中性的「但」" },
      { formula: "何度説明しても、わからない", note: "疑問詞＋ても：無論怎麼…都" }
    ],
    pitfalls: [
      "「のに」帶情緒（意外・不滿），後句不接命令・意志（×高いのに、買え）→ 那種改用 けど／が",
      "「のに」的な形・名詞接續是 なのに（静かなのに／学生なのに），不是 だのに",
      "「ても」接續分詞性：動詞て形＋も（行っても／しても）、い形＋くても（高くても）、な形・名詞＋でも（静かでも／学生でも）",
      "語氣：「が」較正式（書面・正式口語）、「けど」較口語、「けれど（も）」介於兩者之間"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  },
  {
    id: "n3-jita",
    group: "basic",
    category: "N3 文法",
    kicker: "自他動詞",
    title: "自動詞 / 他動詞（成對）",
    subtitle: "ドアが開く / ドアを開ける",
    explanation:
      "很多動詞成對：自動詞（物が〜，著重發生・變化本身或結果狀態，不點明誰做的）vs 他動詞（人が物を〜，有人刻意去做）。助詞不同：自動詞配「が」、他動詞配「を」。狀態表現：自動詞＋ている＝單純狀態（窓が開いている）；他動詞＋てある＝有人特意做了留下的狀態（窓が開けてある）。",
    examples: [
      { formula: "ドアが開く（自） / ドアを開ける（他）", note: "が vs を" },
      { formula: "電気がつく（自） / 電気をつける（他）", note: "つく／つける" },
      { formula: "お湯が沸く（自） / お湯を沸かす（他）", note: "く→かす" },
      { formula: "窓が割れる（自） / 窓を割る（他）", note: "れる→る" },
      { formula: "窓が開いている / 窓が開けてある", note: "ている（狀態） vs てある（有意留下）" }
    ],
    pitfalls: [
      "助詞別搞反：自動詞配が、他動詞配を（×ドアを開く ×ドアが開ける）",
      "「〜てある」前面一定是他動詞（表「有人特意做了」）；「〜ている」前面是自動詞＝單純狀態",
      "配對沒有單一公式；常見規律（く→ける、る→す…）可參考，仍須逐組記"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  },
  {
    id: "n3-mokuteki",
    group: "basic",
    category: "N3 文法",
    kicker: "目的・原因",
    title: "ように / ために / ため（目的・原因）",
    subtitle: "わかるように / 合格するために / 大雨のため",
    explanation:
      "表「目的」與「原因」。目的的「ように」：前面接可能形・無意志・否定（わかるように、忘れないように），前後常不同主語或非刻意。目的的「ために」：前面接意志動詞辭書形或名詞の（合格するために、健康のために），前後主語多半一致、刻意。原因的「ため（に）」：接普通形／名詞の，表「因為…」（大雨のため中止），偏書面。",
    examples: [
      { formula: "後ろの人にも聞こえるように、大きい声で話す", note: "ように：接可能形，為了能…" },
      { formula: "日本語が上手になるように、毎日練習する", note: "ように：接變化・無意志" },
      { formula: "試験に合格するために、頑張る", note: "ために：意志動詞，為了…" },
      { formula: "健康のために、運動している", note: "名詞＋のために" },
      { formula: "大雨のため、電車が止まった", note: "ため：原因（書面）" }
    ],
    pitfalls: [
      "目的：意志動詞→ために（合格するために）；可能形・無意志・否定→ように（わかるように、遅れないように）",
      "「ように」前後常不同主語或非刻意；「ために」前後主語多半一致、刻意（主語不同也可能，如 子どもが留学するために、親が貯金する）",
      "「ため（に）」也表原因（因為…），靠接續與語境分辨是目的還是原因；原因用法偏書面"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  },
  {
    id: "n3-keigo",
    group: "basic",
    category: "N3 文法",
    kicker: "尊敬・謙譲・丁寧",
    title: "敬語入門（尊敬語 / 謙譲語 / 丁寧語）",
    subtitle: "いらっしゃる / 伺う / です・ます",
    explanation:
      "敬語三類。丁寧語：です／ます，對聽者的基本禮貌。尊敬語：抬高「對方」的動作（来る・行く・いる→いらっしゃる、食べる→召し上がる、見る→ご覧になる、言う→おっしゃる、する→なさる；一般動詞用 お＋ます形＋になる）。謙譲語：壓低「自己／自己一方」的動作以抬高對方（行く・来る→伺う・参る、食べる→いただく、見る→拝見する、言う→申す／申し上げる、する→いたす；一般動詞用 お＋ます形＋する）。",
    examples: [
      { formula: "先生がいらっしゃる", note: "尊敬語：来る／行く／いる（對方）" },
      { formula: "明日、先生のお宅へ伺います", note: "謙譲語：行く／訪問（自己）" },
      { formula: "資料を拝見しました", note: "謙譲語：見る（自己）" },
      { formula: "お客様が召し上がる／私がいただく", note: "尊敬 vs 謙譲（吃）" },
      { formula: "先生がお話しになる／私が先生にお話しする", note: "一般動詞：お＋ます形＋になる（尊敬）／＋する（謙譲）" }
    ],
    pitfalls: [
      "看主語是誰：抬「對方的動作」用尊敬、壓「自己的動作」用謙譲（×自分がいらっしゃる ×先生が伺う）",
      "避免雙重敬語：「お召し上がりになる」過頭，召し上がる 本身已是尊敬",
      "サ変名詞：尊敬 ご＋名詞＋になる、謙譲 ご＋名詞＋する（ご説明）；但和語・慣用常用 お（お電話する・お返事する）"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["masu"]
  },
  {
    id: "n3-tokoro",
    group: "basic",
    category: "N3 文法",
    kicker: "正要・正在・剛剛",
    title: "〜ところ（動作的時間點）",
    subtitle: "食べるところ / 食べているところ / 食べたところ",
    explanation:
      "「ところ」在這裡表動作的時間階段（抽象時間，不是地點）。辭書形＋ところ＝正要做（即將、還沒開始）。ている＋ところ＝正在做（進行中）。た＋ところ＝剛做完（動作剛結束）。常與「今・ちょうど」連用。",
    examples: [
      { formula: "今から出かけるところだ", note: "辭書形＋ところ：正要（還沒）" },
      { formula: "今、ご飯を作っているところだ", note: "ている＋ところ：正在進行" },
      { formula: "たった今、駅に着いたところだ", note: "た＋ところ：剛剛做完" },
      { formula: "ちょうど今、帰ってきたところです", note: "た＋ところ；常配 ちょうど／今" }
    ],
    pitfalls: [
      "三個階段靠前面動詞形態分：辭書形（正要）／ている（正在）／た（剛完）",
      "「たところ」是動作剛結束、時間很近；「たばかり」是主觀「才剛」，實際可隔較久",
      "這裡的「ところ」是抽象時間點，不是場所的「ところ（地方）」"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  },
  {
    id: "n3-bakari",
    group: "basic",
    category: "N3 文法",
    kicker: "才剛・老是・淨是",
    title: "〜ばかり（たばかり / てばかり / 名詞ばかり）",
    subtitle: "来たばかり / 遊んでばかり / 文句ばかり",
    explanation:
      "「ばかり」三個常見用法。Vた＋ばかり＝才剛（動作完成不久，帶主觀「沒多久」）。Vて＋ばかり（いる）＝光是、老是（多半負面，只做某事）。名詞＋ばかり＝淨是、全是（語氣依上下文，常見負面但不一定）。",
    examples: [
      { formula: "日本に来たばかりで、まだ慣れない", note: "Vた＋ばかり：才剛…" },
      { formula: "弟はゲームをしてばかりいる", note: "Vて＋ばかり：老是…（多半負面）" },
      { formula: "彼は文句ばかり言っている", note: "名詞＋ばかり：淨是…" },
      { formula: "肉ばかり食べないで、野菜も食べて", note: "名詞＋ばかり：偏、全是" }
    ],
    pitfalls: [
      "「たばかり」≠「たところ」：たところ 客觀剛結束、時間很近；たばかり 主觀「才剛」，實際可隔較久（去年来たばかり 也行）",
      "「てばかり（いる）」多半帶負面・抱怨語氣（非必然）",
      "名詞＋ばかり 語氣由上下文決定（いい人ばかり 是正面）；另有「数量＋ばかり＝大約」（十人ばかり）"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["teTa"]
  },
  {
    id: "n3-hazu-wake",
    group: "basic",
    category: "N3 文法",
    kicker: "理應・難怪",
    title: "〜はず / 〜わけ（推論・道理）",
    subtitle: "来るはず / 寒いわけだ",
    explanation:
      "都表「基於道理的推論」。「はず」：根據理由或常識「按理說應該…」（說話者有把握的推測）；「はずがない」＝不可能。「わけ」用法多：「〜わけだ」＝難怪／也就是說（從前提導出的當然結論）；「わけではない」＝並非（部分否定）；「わけにはいかない」＝（情理上）不能。",
    examples: [
      { formula: "彼は約束したから、来るはずだ", note: "はず：按理應該…" },
      { formula: "そんなことを言うはずがない", note: "はずがない：不可能" },
      { formula: "暖房が壊れているのか。寒いわけだ", note: "わけだ：難怪…" },
      { formula: "嫌いなわけではないが、苦手だ", note: "わけではない：並非…" },
      { formula: "今、休むわけにはいかない", note: "わけにはいかない：情理上不能" }
    ],
    pitfalls: [
      "「はず」是根據理由的推測，不是自己的願望（「彼は行きたいはずだ」＝他應該想去○；但 ×「私は行きたいはず」）",
      "「はずがない／わけがない」＝不可能；「わけではない」＝並非（部分否定），語意不同別混",
      "「わけだ」要有前提才自然（從 A 推出當然的 B）"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  },
  {
    id: "n3-yasui-sugiru",
    group: "basic",
    category: "N3 文法",
    kicker: "難易・過度",
    title: "〜やすい / 〜にくい / 〜すぎる（程度）",
    subtitle: "書きやすい / 読みにくい / 食べすぎる",
    explanation:
      "三者都接動詞ます形（去ます）。〜やすい＝容易…（書きやすい）。〜にくい＝難以…（読みにくい）。〜すぎる＝太過…（過頭，多帶負面），也接形容詞語幹（高すぎる・静かすぎる）。變化：やすい／にくい 像い形容詞（やすかった）；すぎる 像二類動詞（すぎた）。",
    examples: [
      { formula: "このペンは書きやすい", note: "ます形＋やすい：容易" },
      { formula: "この字は読みにくい", note: "ます形＋にくい：難以" },
      { formula: "ゆうべは食べすぎて、お腹が痛い", note: "ます形＋すぎる：太過（動詞）" },
      { formula: "この服は高すぎる", note: "い形語幹＋すぎる" },
      { formula: "この部屋は静かすぎる", note: "な形語幹＋すぎる" }
    ],
    pitfalls: [
      "三者都接動詞ます形（去ます）：書く→書き＋やすい／にくい／すぎる",
      "「すぎる」也接形容詞語幹（高すぎる／静かすぎる），帶「過頭、不好」的語感",
      "「いい」的すぎる通常是 よすぎる（不是 いすぎる）；「ない」是 なさすぎる"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["masu"]
  },
  {
    id: "n3-garu",
    group: "basic",
    category: "N3 文法",
    kicker: "描述別人的感受",
    title: "〜がる / 〜たがる（第三人稱的情緒・願望）",
    subtitle: "寒がる / 行きたがる",
    explanation:
      "「嬉しい・寒い・ほしい・〜たい」這類表達感受、願望的形容詞，直述時通常用於第一人稱、或對本人直接確認（私は寒い／寒い？）；要講第三人稱的感受／願望，用「がる」（或〜そう／〜と言っている）。形容詞語幹＋がる（寒い→寒がる、ほしい→ほしがる）；〜たい→〜たがる（行きたい→行きたがる）。「がる」是動詞，描述當下狀態常用〜ている。",
    examples: [
      { formula: "弟は新しいゲームを欲しがっている", note: "ほしい→ほしがる（が→を）" },
      { formula: "子どもが寒がっている", note: "寒い→寒がる" },
      { formula: "妹は留学に行きたがっている", note: "〜たい→〜たがる" },
      { formula: "彼は嬉しがっていた", note: "嬉しい→嬉しがる" }
    ],
    pitfalls: [
      "直接說「弟は寒い／弟はほしい」不自然（這類直述感受通常用於第一人稱）；講別人要用 がる／たがる",
      "「ほしがる／〜たがる」的對象常把 が 改成 を（水を欲しがる／本を読みたがる）",
      "「がる」是動詞，描述當下狀態常用〜ている（ほしがっている／行きたがっている）"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  }
];

type CompletionAttempt = { isCorrect: boolean; targetForm: string; questionId?: string };

// Correct answers on regular (non-入門) content that count as proof the
// learner is already past the Lesson-0 floor; above this any
// implicitCompleteWithHistory chapter self-completes. Small enough that any
// real returning learner clears it, large enough that one lucky MCQ guess
// doesn't.
const IMPLICIT_HISTORY_THRESHOLD = 5;

// 入門 question-id prefixes: kana drills, the starter vocab deck, and the
// Lesson-0 pattern drills. These never count as "real practice" evidence --
// intro content can't prove the intro chapters redundant.
const INTRO_ID_PREFIXES = ["kana-", "starter-", "pattern-starter-"];

function realPracticeEvidence(attempts: CompletionAttempt[]): number {
  return attempts.filter(
    (attempt) =>
      attempt.isCorrect &&
      !INTRO_ID_PREFIXES.some((prefix) => attempt.questionId?.startsWith(prefix))
  ).length;
}

export function isLearningBlockComplete(attempts: CompletionAttempt[], block: LearningBlock): boolean {
  // Reference chapters are reading material -- treat them as
  // "no completion needed" so the recommendation algorithm doesn't
  // park on them, and the UI shows "參考" rather than misleadingly
  // marking them perpetually incomplete.
  if (block.completionMode === "reference") return true;
  // 入門 chapters (#533/#534) self-complete on real practice history (see
  // implicitCompleteWithHistory) BEFORE their own drill rules run.
  if (
    block.implicitCompleteWithHistory &&
    realPracticeEvidence(attempts) >= IMPLICIT_HISTORY_THRESHOLD
  ) {
    return true;
  }
  // Kana chapters (#533) are completed via their recognition drill -- one
  // correct attempt on any question of the chapter's script (ids are
  // "kana-<script>-…") -- mirroring the pattern-chapter rule below.
  if (block.kanaDrill) {
    const prefix = `kana-${block.kanaDrill.script}-`;
    return attempts.some(
      (attempt) => attempt.isCorrect && attempt.questionId?.startsWith(prefix)
    );
  }
  // The starter-vocab chapter (#533) mirrors the kana rule: one correct
  // starter-drill answer completes it.
  if (block.starterDrill) {
    return attempts.some(
      (attempt) => attempt.isCorrect && attempt.questionId?.startsWith("starter-")
    );
  }
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
