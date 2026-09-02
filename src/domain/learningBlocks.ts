import type { KanaScript } from "./kana";
import type { SentencePatternId } from "./sentencePatterns";
import type { PartOfSpeech, TargetForm, VerbGroup } from "./types";

export type LearningBlockDrillPreset = {
  partOfSpeech: PartOfSpeech | "mixed";
  verbGroup?: VerbGroup | "all";
  practiceFocus: "single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast";
  targetForm: TargetForm;
};

type LearningBlockDrill = {
  /**
   * Key into the i18n `copy[language]` object pointing at the button label
   * (e.g. "drillAdverbial"). Kept as a plain string so the schema doesn't
   * have to expand whenever a new drill label is added.
   */
  labelKey: string;
  preset: LearningBlockDrillPreset;
};

type LearningBlockPatternDrill = {
  labelKey: string;
  patternIds: SentencePatternId[];
};

type LearningBlockKanaDrill = {
  labelKey: string;
  /** Which gojuon script the recognition drill covers (#533). */
  script: KanaScript;
};

type LearningBlockStarterDrill = {
  labelKey: string;
};

type LearningBlockExamDrill = {
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
  // ---- N5 文法（#542/#543 起的 N5 句型補完系列）----------------------------
  {
    id: "n5-sonzai",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "存在句 あります・います",
    subtitle: "へやに ねこが います",
    explanation:
      "說「有什麼、在哪裡」的句型。兩個動詞分工：東西和植物用あります、人和動物用います。兩種句式是一對：介紹「有什麼」用「場所に 〜が あります/います」；回答「在哪裡」用「〜は 場所に あります/います」。存在的場所一定用に——「在某處做動作」才用で，這是に/で最重要的分界。",
    examples: [
      { formula: "へやに ねこが います", note: "存在文：房間裡有貓（動物→います）" },
      { formula: "つくえの うえに ほんが あります", note: "存在文：桌上有書（東西→あります）" },
      { formula: "ほんは つくえの うえに あります", note: "所在文：回答「書在哪」" },
      { formula: "トイレは どこに ありますか", note: "問路的固定句" },
      { formula: "ねこは いません／ほんは ありません", note: "否定：不在/沒有" }
    ],
    pitfalls: [
      "います限「有生命會動的」（人/動物）；植物和東西用あります",
      "存在用に、動作用で：にわに います（在院子）vs にわで あそびます（在院子玩）",
      "第一次介紹用「〜が あります」、已知話題用「〜は 〜に あります」——が/は 別互換"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Sonzai", patternIds: ["n5-sonzai"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["starter-particles"]
  },
  {
    id: "n5-ichi",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "位置詞與この・その",
    subtitle: "かばんの なかに あります",
    explanation:
      "位置的說法是「名詞の＋位置詞＋に」：かばんの なかに（包包裡）、つくえの うえに（桌上）。常用位置詞：うえ/した/なか/まえ/うしろ/となり/よこ/ちかく。指示詞這裡學「接名詞」的用法：この/その/あの＋名詞（これ/それ/あれ 單獨用、この 後面一定要接名詞），距離分工跟これ系一樣：近自己→この、近對方→その、都遠→あの。",
    examples: [
      { formula: "かばんの なかに けいたいが あります", note: "なか＝裡面" },
      { formula: "つくえの うえ／した", note: "うえ＝上面、した＝下面" },
      { formula: "えきの まえ／うしろ", note: "まえ＝前面、うしろ＝後面" },
      { formula: "へやの となり／よこ／ちかく", note: "となり＝隔壁、よこ＝側邊、ちかく＝附近" },
      { formula: "この ほんは わたしのです", note: "この＋名詞：近自己" },
      { formula: "その かさは あなたのですか", note: "その＋名詞：近對方" }
    ],
    pitfalls: [
      "この/その/あの 後面一定接名詞；單獨用要換 これ/それ/あれ",
      "となり＝並排相鄰（隔壁）、よこ＝側面方向、ちかく＝附近——三個範圍不同",
      "「桌上」日文說 つくえの うえ，東西放桌面都用うえ、不能省略"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Ichi", patternIds: ["n5-ichi"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-sonzai"]
  },
  {
    id: "n5-joshi2",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "助詞II へ・で・と・や",
    subtitle: "バスで がっこうへ いきます",
    explanation:
      "入門章教了は/を/に/が，這章補上移動與工具的助詞。へ（讀 e）＝移動的方向；で 一詞三用：動作的場所（としょかんで）、手段工具（バスで、はしで）、合計（ぜんぶで）；と＝把名詞「全部列出」的和（パンと たまご）；や＝「舉例、還有別的」的和，常配句尾的など（ほんや ペンなど）。と 和 や 的差別是 N5 考試最愛考的點。",
    examples: [
      { formula: "とうきょうへ いきます", note: "へ：移動方向（讀 e）" },
      { formula: "バスで いきます／はしで たべます", note: "で：交通工具、手段" },
      { formula: "としょかんで べんきょうします", note: "で：動作的場所" },
      { formula: "ぜんぶで いくらですか", note: "で：合計" },
      { formula: "パンと たまご", note: "と：全部列出" },
      { formula: "ほんや ペンなど", note: "や：舉例（還有別的）" }
    ],
    pitfalls: [
      "方向 へ/に 常可互換：へ 重「朝向」、に 重「到達點」",
      "と＝清單全列完；や＝只舉例（常配など）——考題用など當提示",
      "助詞 へ 讀作 e 不讀 he（跟 は 讀 wa 同一類規則）"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Joshi2", patternIds: ["n5-joshi2"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["starter-particles"]
  },
  {
    id: "n5-joshi3",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "助詞III の・も・か・から〜まで",
    subtitle: "わたしの／おとうとも／９じから",
    explanation:
      "剩下的 N5 常用助詞一次收齊。の＝「的」（わたしの かばん），還能代替說過的名詞（たなかさんの です＝田中的〈那支筆〉）；も＝「也」，直接取代は/が 的位置；「疑問詞＋も＋否定」＝全面否定（だれも いません）；か 放在名詞中間＝「或」（コーヒーか おちゃ）；〜から〜まで＝「從～到～」（時間、場所都能用）；だけ＝「只有」。",
    examples: [
      { formula: "わたしの かばん", note: "の：的（所有）" },
      { formula: "たなかさんの です", note: "の：代替前面的名詞" },
      { formula: "おとうとも がくせいです", note: "も：也" },
      { formula: "だれも いません", note: "疑問詞＋も＋否定＝全面否定" },
      { formula: "コーヒーか おちゃ", note: "か：或（二選一）" },
      { formula: "９じから ３じまで", note: "から〜まで：從～到～" },
      { formula: "ひとりだけ います", note: "だけ：只有" }
    ],
    pitfalls: [
      "も 直接取代は/が，不能寫「はも」「がも」",
      "だれも/なにも 後面接否定；「某人/某物」用 だれか/なにか＋肯定",
      "だけ 接肯定就好；「しか」也表「只」但一定要配否定（N4 再學）"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Joshi3", patternIds: ["n5-joshi3"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-joshi2"]
  },
  {
    id: "n5-hikaku",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "比較 より・ほうが・いちばん",
    subtitle: "バスは でんしゃより やすいです",
    explanation:
      "比較的三件組。①「AはBより〜」＝A比B更〜（より 接在比較基準後面）；②「〜のほうが〜」＝〜比較〜，問「AとBと、どちらが〜」時就用它回答；③最高級「（範圍）で 〜が いちばん〜」＝在～之中最～。記住兩個鐵則：二選一的疑問詞是どちら（不是なに）、疑問詞當主語只能接が。",
    examples: [
      { formula: "バスは でんしゃより やすいです", note: "A比B～" },
      { formula: "AとBと、どちらが すきですか", note: "二選一疑問" },
      { formula: "おちゃの ほうが すきです", note: "回答：～比較～" },
      { formula: "スポーツの なかで サッカーが いちばん すきです", note: "最高級：範圍＋で" },
      { formula: "きのうほど さむくないです", note: "ほど＋否定：沒～那麼～" }
    ],
    pitfalls: [
      "ほど 也接比較基準，但後面必須是否定（〜ほど〜ない）",
      "「哪個（二選一）」用どちら；三個以上才用どれ/なに",
      "最高級的範圍用で：クラスで、日本で、スポーツのなかで"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Hikaku", patternIds: ["n5-hikaku"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["starter-particles"]
  },
  {
    id: "n5-suki-dekiru",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "好惡與能力 〜が すき・できる",
    subtitle: "ねこが すきです／およぐことが できます",
    explanation:
      "說「喜歡什麼、會什麼」的句型家族，共同點是對象全用「が」：すき/きらい（喜歡/討厭）、じょうず/へた（擅長/不擅長）、わかる（懂）、できる（會）。中文語感容易想用を（喜歡「貓」、懂「日語」），但這一家族固定用が——N5 最重要的轉換之一。動詞要說「會做～」時，先用「こと」把動詞變名詞：およぐ ことが できます。",
    examples: [
      { formula: "ねこが すきです", note: "喜歡：對象用が" },
      { formula: "サッカーが じょうずです", note: "擅長" },
      { formula: "にほんごが わかります", note: "懂" },
      { formula: "りょうりが できます", note: "會（名詞）" },
      { formula: "およぐ ことが できます", note: "會做～：動詞＋ことが できる" }
    ],
    pitfalls: [
      "這家族的對象用が不用を：×にほんごを わかります",
      "口語裡聽得到「〜をすき」，但考試和書面以が為準",
      "きらい 長得像い形容詞，其實是な形容詞（きらいな 人）"
    ],
    patternDrills: [{ labelKey: "drillPatternN5SukiDekiru", patternIds: ["n5-suki-dekiru"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-hikaku"]
  },
  {
    id: "n5-sasoi",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "邀約與提議 ませんか・ましょう",
    subtitle: "いっしょに たべませんか／たべましょう",
    explanation:
      "開口約人的三件組：「ませんか」＝要不要〜？（問句，把決定權交給對方）；「ましょう」＝（我們）〜吧（提議，或接受邀約時回答）；「ましょうか」＝我來〜吧？（主動提出幫忙）。配套的還有：ます形語幹＋「に いきます/きます」＝去/來做某事（かいに いきます＝去買），以及提案的「〜は どうですか」＝〜怎麼樣？",
    examples: [
      { formula: "いっしょに たべませんか", note: "邀約：要不要～？" },
      { formula: "いいですね。たべましょう", note: "接受：～吧" },
      { formula: "にもつを もちましょうか", note: "主動幫忙：我來～吧？" },
      { formula: "かばんを かいに いきます", note: "移動目的：語幹＋に" },
      { formula: "どようびは どうですか", note: "提案：～怎麼樣？" }
    ],
    pitfalls: [
      "ませんか 是問對方；ましょう 是自己這邊的提議/接受——別搞反方向",
      "接「に いきます」的是ます形語幹（かい、たべ），不是辭書形或て形",
      "回答邀約：好→「ましょう」；婉拒→「ちょっと……」（不直說いいえ）"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Sasoi", patternIds: ["n5-sasoi"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-suki-dekiru"]
  },
  {
    id: "n5-onegai",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "請求與建議 ください・ほうがいい",
    subtitle: "りんごを みっつ ください",
    explanation:
      "開口要東西、給建議的句型組。購物點餐：「Nを（數量）ください」——數量詞直接放ください前面、不加助詞；想要的東西：「〜が ほしいです」（對象用が，跟すき同家族）；建議：「た形＋ほうがいいです」＝最好〜、「ない形＋ほうがいいです」＝最好別〜；請人別做：「ない形＋でください」。",
    examples: [
      { formula: "りんごを みっつ ください", note: "請給我～：數量不加助詞" },
      { formula: "くつが ほしいです", note: "想要：對象用が" },
      { formula: "ねた ほうがいいです", note: "建議做：た形＋ほうがいい" },
      { formula: "はいらない ほうがいいです", note: "建議別做：ない形" },
      { formula: "はなさないで ください", note: "請勿～" }
    ],
    pitfalls: [
      "ほうがいい 的「做」方向接た形（ねた），「別做」方向接ない形（はいらない）",
      "ほしい 的對象用が不用を——跟をすき同一個口語陷阱",
      "ないでください（請別做）≠ なくてもいいです（不必做）"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Onegai", patternIds: ["n5-onegai"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-sasoi"]
  },
  {
    id: "n5-riyuu",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "理由與逆接 から・ので・が",
    subtitle: "ねつが ありますから／むずかしいですが",
    explanation:
      "把兩句話連起來的基本盤。理由：「〜から」（どうして的回答固定用「〜からです」）；「〜ので」語氣較客觀委婉——名詞和な形容詞接ので要先加な（やすみなので）、接から則用だ（やすみだから）。轉折：句中的「〜が」＝雖然〜但是〜；它還有一個開場緩衝用法「すみませんが、〜」。句子開頭的接續詞一組四個：だから（所以）、でも（可是）、そして（而且）、それから（然後）。",
    examples: [
      { formula: "ねつが あったからです", note: "どうして的回答：〜からです" },
      { formula: "やすみなので／やすみだから", note: "名詞接續：なので vs だから" },
      { formula: "むずかしいですが、おもしろいです", note: "轉折：雖然〜但是〜" },
      { formula: "すみませんが、えきは どこですか", note: "開場緩衝的が" },
      { formula: "だから／でも／そして／それから", note: "句頭接續詞四件組" }
    ],
    pitfalls: [
      "から和ので意思幾乎相同（ので較客觀委婉），但接名詞時形不同：だから／なので",
      "「〜のでです」不成句——どうして的回答用「〜からです」",
      "句中的が（轉折）和句頭的でも（可是）方向相同，但位置不能互換"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Riyuu", patternIds: ["n5-riyuu"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-onegai"]
  },
  {
    id: "n5-toki",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "時間與經驗 とき・もう・でしょう",
    subtitle: "たべる とき／のぼった ことが あります",
    explanation:
      "時間、狀態與經驗的句型組。「〜とき」＝〜的時候，前面的時態看動作完成了沒：ごはんを たべる とき（吃之前）vs たべた とき（吃完）。完成/未完成一對：「もう〜ました」＝已經〜了、「まだ〜ていません」＝還沒〜。推測：「〜でしょう」＝大概〜吧（天氣預報的標準結尾）。經驗：「た形＋ことが あります」＝〜過；否定回答配「いちども〜ません」＝一次也沒有。",
    examples: [
      { formula: "ひまな とき、おんがくを ききます", note: "〜的時候" },
      { formula: "たべる とき／たべた とき", note: "とき前的時態＝動作完成與否" },
      { formula: "もう たべました／まだ たべていません", note: "已經〜／還沒〜" },
      { formula: "あしたは あめが ふるでしょう", note: "推測：大概〜吧" },
      { formula: "のぼった ことが あります", note: "經驗：〜過" }
    ],
    pitfalls: [
      "まだ的否定是「まだ〜ていません」，不是「まだ〜ませんでした」",
      "でしょう接普通形（ふるでしょう）；「ふるですか」不成句",
      "いちども、だれも、なにも——「も」系全家都要配否定"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Toki", patternIds: ["n5-toki"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-riyuu"]
  },
  {
    id: "n5-keiyoushi",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "形容詞的連接與變化",
    subtitle: "やすくて おいしい／きれいに なりました",
    explanation:
      "形容詞的三種「用法」。①修飾名詞：い形直接接（おおきい かばん）、な形加な（しずかな まち）。②並列（又〜又〜）：い形去い＋くて（やすくて おいしい）、な形＋で（げんきで しんせつ）。③變化（變得〜）：い形去い＋く なります（さむく なります）、な形＋に なります（きれいに なります）。兩個最容易栽的詞：きれい 結尾是い但其實是な形容詞；いい 的活用全部走よ系（よく、よくない、よかった）。",
    examples: [
      { formula: "おおきい かばん／しずかな まち", note: "修飾名詞：い直接接、な加な" },
      { formula: "やすくて、おいしいです", note: "い形並列：去い＋くて" },
      { formula: "げんきで、しんせつです", note: "な形並列：＋で" },
      { formula: "さむく なります／きれいに なります", note: "變化：く／に＋なります" },
      { formula: "いい → よく なりました", note: "いい 活用走よ系" }
    ],
    pitfalls: [
      "い形不加な：×おおきいな かばん；な形不變い：×しずかい",
      "きれい、ゆうめい、きらい——結尾是い的な形容詞，變化用に（×きれいく）",
      "いい 只有辭書形是いい，其他全用よ：よくて、よくない、よかった、よく なります"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Keiyoushi", patternIds: ["n5-keiyoushi"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-toki"]
  },
  {
    id: "n5-josuushi",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "助数詞 數量的說法",
    subtitle: "りんごを みっつ／ねこが いっぴき",
    explanation:
      "日語數東西要配「助数詞」，依類別選：〜つ（通用小物）、〜人（人；一人ひとり、二人ふたり特殊）、〜枚（薄平物）、〜本（細長物——注意中文的「書本」在日語用〜冊）、〜冊（書）、〜台（機器車輛）、〜匹（小動物）、〜回（次數）、〜歳（年齡）。三個音變規則：1・6・8・10 常促音化（いっぴき、はっさい）、3 常濁音化（さんぼん）。語順鐵則：數量詞放動詞前、後面不再加助詞——りんごを みっつ ください。",
    examples: [
      { formula: "がくせいが ふたり います", note: "人：ひとり、ふたり 特殊讀法" },
      { formula: "えんぴつを さんぼん", note: "細長物：三本濁音化" },
      { formula: "ねこが いっぴき", note: "小動物：一匹促音化" },
      { formula: "ほんを にさつ", note: "書用冊，不用本" },
      { formula: "みかんを いつつ ください", note: "數量詞後不加助詞" }
    ],
    pitfalls: [
      "音變是考點：いっぽん/さんぼん/ろっぽん、いっぴき/さんびき、はっさい/じゅっさい",
      "中文「一本書」≠ ほんを いっぽん——書用〜冊（さつ）",
      "數量詞直接放動詞前：×みっつを ください"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Josuushi", patternIds: ["n5-josuushi"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-keiyoushi"]
  },
  {
    id: "n5-teido",
    group: "basic",
    category: "N5 文法",
    kicker: "N5 句型",
    title: "程度與頻度 あまり・よく",
    subtitle: "あまり たかくないです／よく いきます",
    explanation:
      "程度與頻率的副詞系統。呼應否定的一對：「あまり〜ない」＝不太〜、「ぜんぜん〜ない」＝完全不〜——看到這兩個詞，句尾一定要找ない。概數一對：「ごろ」接時刻點（７じごろ）、「ぐらい」接數量長度（じゅっぷんぐらい）。頻度副詞從高到低：いつも＞よく＞ときどき＞たまに＞あまり（＋否定）＞ぜんぜん（＋否定）。具體頻率的說法：期間＋に＋次數——１しゅうかんに ２かい＝一週兩次。",
    examples: [
      { formula: "あまり おもしろくないです", note: "不太〜：配否定" },
      { formula: "ぜんぜん のみません", note: "完全不〜：配否定" },
      { formula: "７じごろ／じゅっぷんぐらい", note: "ごろ＝時刻點、ぐらい＝數量" },
      { formula: "いつも＞よく＞ときどき＞たまに", note: "頻度副詞的階梯" },
      { formula: "１しゅうかんに ２かい", note: "期間＋に＋次數" }
    ],
    pitfalls: [
      "あまり、ぜんぜん 後面必須是否定——×あまり おもしろいです",
      "ごろ 只接時刻點：×じゅっぷんごろ（長度要用ぐらい）",
      "頻度副詞要跟實際次數對得上：一年三次不能說よく"
    ],
    patternDrills: [{ labelKey: "drillPatternN5Teido", patternIds: ["n5-teido"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-josuushi"]
  },
  {
    id: "n4-ndesu",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "說明語氣 〜んです",
    subtitle: "どうしたんですか／引っ越しなんです",
    explanation:
      "N4 最高頻的語氣系統。「〜んです」不是單純的です——它帶著「說明、解釋」的態度：看到不尋常的狀況追問（どうしたんですか）、說明自己行為的緣由（誕生日なんです）、拜託人之前先鋪墊（質問があるんですが…）。接續整理：動詞・い形容詞普通形直接接（行くんです、痛いんです）；名詞・な形容詞現在肯定要加な（引っ越しなんです）；過去だった直接接（病気だったんです）。問答成組：〜んですか 的回答用 〜んです。",
    examples: [
      { formula: "どうしたんですか", note: "求說明的追問" },
      { formula: "電車が止まったんです", note: "回答：說明緣由" },
      { formula: "引っ越しなんですが、…", note: "名詞＋な＋んです；が＝鋪墊" },
      { formula: "病気だったんです", note: "過去だった直接接" },
      { formula: "質問があるんですが、今いいですか", note: "開口前的前置き" }
    ],
    pitfalls: [
      "普通形＋です/ます 不成句：×行くです——要嘛 行きます、要嘛 行くんです",
      "名詞・な形容詞加な：学生なんです；但過去 だったんです 不再加な",
      "看到情況才用んですか；沒有前提就用會顯得質問——單純問句用ますか"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Ndesu", patternIds: ["n4-ndesu"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n5-teido"]
  },
  {
    id: "n4-suiryou",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "推量與原因 かもしれない・て",
    subtitle: "雨が降るかもしれません／終わらなくて",
    explanation:
      "把握度的階梯：〜かもしれない（說不定，五成以下）＜〜だろう/でしょう（大概吧）。だろう是でしょう的普通體。接續共同鐵則：名詞・な形容詞一律裸接、だ要去掉——学生かもしれない、休みだろう、元気でしょう（對照：んです才要な）。另一塊是「て形表原因」：感情或狀態的緣由用て/なくて——知らせを聞いて安心した、宿題が終わらなくて困っている。否定公式：ない去い＋くて。",
    examples: [
      { formula: "雨が降るかもしれません", note: "說不定：可能性" },
      { formula: "明日は晴れるだろう", note: "だろう＝でしょう的普通體" },
      { formula: "学生かもしれない／休みだろう", note: "名詞裸接、だ去掉" },
      { formula: "知らせを聞いて、安心しました", note: "て＝感情的原因" },
      { formula: "終わらなくて、困っています", note: "原因的否定：なくて" }
    ],
    pitfalls: [
      "かも/だろう/でしょう 前面 だ 全部去掉：×学生だかもしれない",
      "但んです要な：学生なんです——兩家規則別互相污染",
      "原因的否定用なくて（狀態・感情）；ないで是「不做A而做B」的付帶狀況"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Suiryou", patternIds: ["n4-suiryou"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-ndesu"]
  },
  {
    id: "n4-ishi",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "打算與決定 つもり・ことにする",
    subtitle: "行こうと思っています／行くことにしました",
    explanation:
      "「打算」的三個說法，強度與場合不同：「意向形＋と思っています」＝當下的意志表明（やめようと思っています）；「〜つもりだ」＝抱著的打算，否定放前面（買わないつもり），轉述別人用つもりらしい；「〜予定だ」＝排程——無生物（飛機、會議）只能用予定，つもり要有意志的人。決定一對：自己拍板＝「〜ことにする」、別人／組織拍板＝「〜ことになる」；決定後持續遵守＝「〜ことにしている」。",
    examples: [
      { formula: "たばこをやめようと思っています", note: "意志：意向形＋と思う" },
      { formula: "日本で働くつもりです／買わないつもりです", note: "打算與其否定" },
      { formula: "飛行機は出発する予定です", note: "排程：無生物用予定" },
      { formula: "走ることにしました／転勤することになりました", note: "自己決定 vs 外部決定" },
      { formula: "食べないことにしています", note: "決定並持續" }
    ],
    pitfalls: [
      "二類動詞的意向形＝語幹＋よう（やめよう）；ろう是一類る動詞的（帰ろう）",
      "つもり是名詞不會活用；別人的打算＝つもりらしい（意向形不能接らしい）",
      "ことにする（自己）／ことになる（外部）——主語是誰拍的板"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Ishi", patternIds: ["n4-ishi"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-suiryou"]
  },
  {
    id: "n4-meirei",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "命令與禁止 しろ・するな",
    subtitle: "早く逃げろ！／ここに捨てるな",
    explanation:
      "命令的階梯，從粗到軟：命令形（一類＝語尾え段：走れ；二類＝語幹＋ろ：逃げろ；する→しろ、来る→こい）→「〜なさい」（ます形語幹＋なさい，家長老師的口吻）→ て形請求（N5 教過）。禁止＝辭書形＋な（捨てるな）。口語義務縮約：「〜なきゃ」（＝なければ）與「〜なくちゃ」（＝なくては）。轉述指示用「〜ように言う」（医者にやめるように言われた）。命令形本人少用，但告示（止まれ）、緊急（逃げろ）、引用（しろと言われた）都靠它。",
    examples: [
      { formula: "早く逃げろ！／もっと速く走れ！", note: "命令形：二類ろ、一類え段" },
      { formula: "ここにごみを捨てるな", note: "禁止：辭書形＋な" },
      { formula: "早く宿題をしなさい", note: "溫和命令：ます形語幹＋なさい" },
      { formula: "帰らなきゃ／帰らなくちゃ", note: "口語義務縮約" },
      { formula: "やめるように言いました", note: "間接命令：ように言う" }
    ],
    pitfalls: [
      "なさい接ます形語幹（しなさい）；接辭書形（×するなさい）不成句",
      "な兩張臉：辭書形＋な＝禁止（行くな）；ます語幹＋な＝催促（行きな）——完全相反",
      "する的命令形＝しろ（書面測驗會看到文語せよ）"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Meirei", patternIds: ["n4-meirei"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-ishi"]
  },
  {
    id: "n4-shushoku",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "名詞修飾節 〜した＋名詞",
    subtitle: "きのう買った本／大阪に住んでいる友だち",
    explanation:
      "N4 句法最大的一跳：把整個句子塞到名詞前面當形容詞用——きのう買った本（昨天買的書）、大阪に住んでいる友だち（住大阪的朋友）。三條鐵則：①修飾節內用普通形，敬體（ます/です）進不去；②修飾節的時態看「事件本身」發生了沒，不看主句——来週泊まるホテルは、もう予約しました（住宿未發生用辭書形、即使主句是過去）；③修飾節內的主語用が（母が作った料理），且可換成の（母の作った料理）。引介名字用「〜という＋名詞」（さくらという店）；下定義用「〜というのは」。",
    examples: [
      { formula: "きのう買った本", note: "修飾節＝普通形" },
      { formula: "来週泊まるホテルは、もう予約しました", note: "時態看事件不看主句" },
      { formula: "母が作った料理（＝母の作った料理）", note: "節內主語が、可換の" },
      { formula: "「さくら」という店", note: "引介：〜という＋名詞" },
      { formula: "「さくら」というのは、花の名前です", note: "定義：〜というのは" }
    ],
    pitfalls: [
      "敬體不進修飾節：×歌っています人→歌っている人",
      "は進不了修飾節——節內主語只能が（或換の）",
      "修飾節時態獨立：昨天買的＝買った、下週住的＝泊まる"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Shushoku", patternIds: ["n4-shushoku"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-meirei"]
  },
  {
    id: "n4-kansetsu",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "間接疑問 かどうか・〜か",
    subtitle: "行くかどうか／いつ始まるか",
    explanation:
      "把問句塞進句子裡＝間接疑問，分工只有一條線：句子裡「有疑問詞」（いつ、どこ、だれ、どうして…）就用「〜か」——いつ始まるか知っていますか；「沒有疑問詞」的是否句用「〜かどうか」——行くかどうか、まだ決めていません（展開形＝行くか行かないか）。接續規則跟推量家族一樣：名詞・な形容詞裸接、だ去掉（本当かどうか）；內部一律普通形，敬體不進去（×来るですか→来るか），禮貌放在句尾就好。",
    examples: [
      { formula: "行くかどうか、まだ決めていません", note: "無疑問詞→かどうか" },
      { formula: "いつ始まるか、知っていますか", note: "有疑問詞→か" },
      { formula: "本当かどうか、分かりません", note: "名詞裸接、だ去掉" },
      { formula: "何時に来るか教えてください", note: "內部用普通形" },
      { formula: "行くか行かないか", note: "かどうか的展開形" }
    ],
    pitfalls: [
      "疑問詞＋かどうか是錯的：×いつ来るかどうか→いつ来るか",
      "內部敬體不成句：×来ますか教えて→来るか教えて",
      "名詞接かどうか要去だ：×本当だかどうか"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Kansetsu", patternIds: ["n4-kansetsu"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-shushoku"]
  },
  {
    id: "n4-fukugou",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "複合動詞 〜はじめる・〜方",
    subtitle: "雨が降りだした／漢字の読み方",
    explanation:
      "把兩個動詞黏成一個＝複合動詞，前半用ます形語幹。階段四件組：〜はじめる（開始）、〜だす（突然開始，配急に）、〜つづける（持續）、〜おわる（做完）——注意自他：はじめる/つづける是他動（自己做），はじまる/つづく是自動（事情自己發生），別黏錯。方向一對：〜ていく（帶去、離開說話者）/〜てくる（帶來、朝向說話者）——同一對也能表時間推移（変わってきた＝一路變到現在、変わっていく＝今後繼續變）。構詞兩件：ます形語幹＋方（かた）＝〜的方法（読み方）；い形容詞去い＋さ＝名詞化（高さ）。",
    examples: [
      { formula: "急に雨が降りだした", note: "突發開始：〜だす" },
      { formula: "去年から習いはじめた／3時間走りつづけた", note: "開始與持續（他動）" },
      { formula: "持っていく／買ってくる", note: "方向：離開いく、回來くる" },
      { formula: "この漢字の読み方", note: "ます語幹＋方＝方法" },
      { formula: "山の高さ", note: "い形去い＋さ＝名詞化" }
    ],
    pitfalls: [
      "自他別黏錯：×習いはじまる→習いはじめる（はじまる是会議がはじまる的自動詞）",
      "急に、突然 配〜だす；一般的開始用〜はじめる",
      "ていく/てくる的時間用法方向要想：朝現在＝てきた、朝未來＝ていく"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Fukugou", patternIds: ["n4-fukugou"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-kansetsu"]
  },
  {
    id: "n4-henka",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "變化 ようになる・くする・まま",
    subtitle: "泳げるようになった／つけたまま",
    explanation:
      "變化的完整系統。「〜ようになる」＝變得（會）〜：接可能動詞是能力變化（泳げるようになった）、接一般動詞是習慣變化（早く起きるようになった）；否定的變化＝ない去い＋くなる（来なくなった）。「〜ようにする」＝盡量做到（努力目標），跟「ことにする（下決心）」是鄰居。他動的變化：把東西弄成〜——い形容詞＋くする（明るくする）、な形容詞/名詞＋にする（静かにする）；對照N5的自變（くなる/になる）。「〜まま」＝保持原樣：た形＋まま（つけたまま寝た）、ない形＋まま（消さないまま出かけた）。",
    examples: [
      { formula: "泳げるようになりました", note: "能力變化：可能動詞＋ようになる" },
      { formula: "野菜を食べるようにしています", note: "努力目標：ようにする" },
      { formula: "明るくする／静かにする", note: "他動變化：く／に＋する" },
      { formula: "来なくなりました", note: "否定的變化：なく＋なる" },
      { formula: "つけたまま寝てしまった", note: "保持原樣：た形＋まま" }
    ],
    pitfalls: [
      "ようにする＝盡量努力、ことにする＝下定決心——語感不同但常可互換，看語境",
      "變化標記對號入座：い形→く、な形/名詞→に（做｜変：する｜なる 都適用）",
      "まま前面：完成的狀態用た形（つけたまま）、沒做的狀態用ない形（消さないまま）"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Henka", patternIds: ["n4-henka"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-fukugou"]
  },
  {
    id: "n4-jikan",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "時間 間・までに・おきに",
    subtitle: "寝ている間に／金曜日までに",
    explanation:
      "時間的精細化。「〜間（あいだ）」＝整段期間，配持續的述語（夏休みの間ずっと家にいた）；「〜間に」＝那段期間裡的某一點，配一次性的事（寝ている間に電話が来た）——差別在述語是「持續」還是「一次」。期限一對：「〜までに」＝在某時之前完成（一次性動作：金曜日までに出す）；「〜まで」＝持續到某時為止（持續動作：来るまで待つ）。另外：「〜おきに」＝固定間隔（6時間おきに）；「名詞＋中（ちゅう）」＝正在進行（電話中・工事中）。",
    examples: [
      { formula: "夏休みの間、ずっと家にいた", note: "整段：間＋持續" },
      { formula: "寝ている間に電話が来た", note: "期間內某點：間に＋一次" },
      { formula: "金曜日までに出す／来るまで待つ", note: "期限までに vs 持續まで" },
      { formula: "6時間おきに飲む", note: "固定間隔：おきに" },
      { formula: "電話中・工事中", note: "正在進行：名詞＋中" }
    ],
    pitfalls: [
      "間（持續述語）vs 間に（一次性事件）——看後面的動作",
      "までに（期限＋一次動作）vs まで（持續到〜）——出す用までに、待つ用まで",
      "おきに是間隔；平均分配的「每份」是ずつ，別混"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Jikan", patternIds: ["n4-jikan"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-henka"]
  },
  {
    id: "n4-juju",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "授受與請託 くれる・いただく",
    subtitle: "先生がくださった／手伝っていただけませんか",
    explanation:
      "給與收的方向系統，加上敬語階。三根軸：あげる（我方給出去）、くれる（別人給我方）、もらう（我方收到，主語是收方）。敬語階往上：あげる→さしあげる（謙讓，給長輩）、くれる→くださる（尊敬，長輩給我）、もらう→いただく（謙讓，從長輩收下）。方向靠主語＋對象判斷：先生が私に→くださる；私が先生に（給）→さしあげる；私が先生に（收）→いただく。鄭重請託＝「〜ていただけませんか」＝能不能請您〜（もらう的謙讓可能形）。",
    examples: [
      { formula: "友だちが私にくれた", note: "別人給我：くれる" },
      { formula: "私は友だちにもらった", note: "我收到：もらう（主語＝收方）" },
      { formula: "先生が私にくださった", note: "長輩給我：くださる（尊敬）" },
      { formula: "先生にさしあげた／いただいた", note: "給長輩／從長輩收（謙讓）" },
      { formula: "手伝っていただけませんか", note: "鄭重請託" }
    ],
    pitfalls: [
      "くれる/くださる＝別人→我方；あげる/さしあげる＝我方→別人，方向別搞反",
      "もらう/いただく的主語是『收到的人』：私は先生にいただいた",
      "やる是給晚輩/動植物，對長輩用會失禮——長輩用さしあげる"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Juju", patternIds: ["n4-juju"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-jikan"]
  },
  {
    id: "n4-chikaku",
    group: "basic",
    category: "N4 文法",
    kicker: "N4 句型",
    title: "知覺與限定 見える・しか",
    subtitle: "海が見える／100円しかない",
    explanation:
      "知覺：「見える／聞こえる」＝（不靠意志）自然映入眼／傳入耳（窓から海が見える）；跟可能形「見られる／聞ける」＝（有機會、有條件）能看/能聽（予約すれば見られる）不同。感覺用「〜がする」＝匂い・音・味・気がする。限定與比較：「〜ほど〜ない」＝沒有〜那麼〜（昨日ほど寒くない，後面一定否定）；「〜しか〜ない」＝只有〜（100円しかない，後面一定否定，跟配肯定的だけ相對）；「〜ずつ」＝平均每份（一つずつ）。",
    examples: [
      { formula: "窓から海が見える", note: "自然映入：見える" },
      { formula: "予約すれば見られる", note: "有機會能看：可能形" },
      { formula: "いい匂いがする", note: "知覺：がする" },
      { formula: "昨日ほど寒くない", note: "比較否定：ほど〜ない" },
      { formula: "100円しかない／一つずつ", note: "限定しか／分配ずつ" }
    ],
    pitfalls: [
      "見える/聞こえる（自然）≠ 見られる/聞ける（有機會、能力）",
      "ほど〜ない、しか〜ない——後面一定接否定",
      "しか（配否定）vs だけ（配肯定）：しかない／だけある"
    ],
    patternDrills: [{ labelKey: "drillPatternN4Chikaku", patternIds: ["n4-chikaku"] }],
    implicitCompleteWithHistory: true,
    recommendedAfter: ["n4-juju"]
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
    id: "conditional",
    group: "basic",
    category: "動詞變化",
    kicker: "如果・一…就",
    title: "假定形・ば形 (V えば)",
    subtitle: "書く → 書けば / 食べる → 食べれば",
    explanation:
      "「如果…就…」的ば。動詞：一類最後一字換え段＋ば；二類去る＋れば；三類：する → すれば、来る → 来れば。否定從ない形變：ない去い＋ければ（行かない → 行かなければ）。い形容詞去い＋ければ（高ければ）。な形容詞和名詞不用變化，直接接なら（静かなら、学生なら）。",
    examples: [
      { formula: "書く → 書けば", note: "一類：く換け＋ば" },
      { formula: "飲む → 飲めば", note: "一類：む換め＋ば" },
      { formula: "食べる → 食べれば", note: "二類：去る＋れば" },
      { formula: "する → すれば / 来る → 来れば", note: "三類（来れば讀こ→くれば）" },
      { formula: "行かない → 行かなければ", note: "否定：ない去い＋ければ" },
      { formula: "高い → 高ければ", note: "い形容詞：去い＋ければ" },
      { formula: "静かなら / 学生なら", note: "な形容詞・名詞：直接＋なら" }
    ],
    pitfalls: [
      "な形容詞・名詞不能直接接「なければ」——肯定條件就是直接接なら（×静かなければ、○静かなら）；否定條件先變ではない再變でなければ（静かでなければ）",
      "「いい」要走「よ」：よければ（×いければ）",
      "上面變出來的都是肯定條件；「如果不…」一律先變否定再變ば形：動詞・い形 ない → なければ（高くない → 高くなければ）、な形・名詞 ではない → でなければ",
      "ば／たら／なら／と 四種「如果」怎麼選，見「ば / たら / なら / と（四種條件）」章"
    ],
    drills: [
      {
        labelKey: "drillConditional",
        preset: {
          partOfSpeech: "verb",
          verbGroup: "all",
          practiceFocus: "single",
          targetForm: "conditional"
        }
      }
    ],
    recommendedAfter: ["masu"],
    requiredForms: ["conditional"]
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
      "前項是動作動詞、後句又接意志／命令時，「ば」會不自然，改用「たら」（東京へ行ったら、連絡して）",
      "ば形本身怎麼變（え段＋ば；い形 ければ；な形/名詞 なら）見「假定形・ば形」章與規則表的轉換表"
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
  },
  {
    id: "n3-jikan-kikan",
    group: "basic",
    category: "N3 文法",
    kicker: "期間・範圍・頻率",
    title: "最中に / 途中で / から〜にかけて / ごとに・おきに",
    subtitle: "食事の最中に / 帰る途中で / 夜から朝にかけて / 三日おきに",
    explanation:
      "把時間講細一點的一組。「〜間に」（一段期間裡的某一點，N4 已學）之外，還有更精準的說法。「〜最中に」＝正在做某事的當口、常接突發或插入的事件（食事の最中に電話が来た），比「間に」更聚焦「就在那個節骨眼」。「〜途中で／途中に」＝過程中（帰る途中でパンを買った＝回家路上）。「〜から〜にかけて」＝大致從A到B一帶／一段（時間或空間，比「から〜まで」模糊、強調連續一片：夜から朝にかけて雨）。頻率一對最容易考：「〜ごとに」＝每（三日ごと＝每三天，1日目→4日目）；「〜おきに」＝每隔、中間空掉（三日おき＝中間空3天，1日目→5日目）。",
    examples: [
      { formula: "食事の最中に電話が来た", note: "最中に：正在…的當口（常接突發事件）" },
      { formula: "帰る途中で、本屋に寄った", note: "途中で：過程中、路上" },
      { formula: "この道の途中に、コンビニがある", note: "途中に：中間的位置" },
      { formula: "夜から朝にかけて、雨が降った", note: "から〜にかけて：連續的範圍" },
      { formula: "オリンピックは四年ごとに開かれる", note: "ごとに：每（含該單位）" }
    ],
    pitfalls: [
      "ごとに（三日ごと：1日目→4日目、間隔3天）vs おきに（三日おき：中間空3天、1日目→5日目）——差一天，考試最愛考",
      "から〜にかけて 是「大致A到B一帶」；要明確的起訖點用 から〜まで（にかけて 端點雖可放時刻，語感仍是模糊範圍、不保證精確或全覆蓋）",
      "最中に 只接「正在持續」的事、後句常是突發或插入的事件；一般的「…的時候」還是用 とき／間に"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n4-jikan"]
  },
  {
    id: "n3-jikan-keiki",
    group: "basic",
    category: "N3 文法",
    kicker: "契機・順序",
    title: "たとたん / たびに / ついでに / てはじめて / てからでないと",
    subtitle: "開けたとたん / 会うたびに / 買い物のついでに",
    explanation:
      "動作之間的觸發與先後關係。「〜たとたん(に)」＝一…就…（瞬間、意外、不受控；ドアを開けたとたん、猫が飛び出した）——兩件事幾乎同時、後件是沒料到的。「〜たびに」＝每逢…就…（每次都這樣；会うたびにけんかする）。「〜ついでに」＝做A順便做B（趁著做A的機會；買い物のついでに、郵便局に寄った）。「〜てはじめて」＝…之後才（第一次體會到；親になってはじめて、親のありがたさがわかった）。「〜てからでないと／てからでなければ」＝不先…就不行（前提條件；手を洗ってからでないと、食べられない）。",
    examples: [
      { formula: "ドアを開けたとたん、猫が飛び出した", note: "たとたん：一…就…（瞬間、意外）" },
      { formula: "彼は会うたびに、同じ話をする", note: "たびに：每逢…就…" },
      { formula: "散歩のついでに、パンを買ってきた", note: "ついでに：順便" },
      { formula: "働いてはじめて、お金の大切さがわかった", note: "てはじめて：…之後才（體會）" },
      { formula: "予約してからでないと、入れません", note: "てからでないと：不先…就不行" }
    ],
    pitfalls: [
      "たとたん 後件多為意外/突發的瞬間結果，不可接說話者的意志・命令・請求・預定（×〜しよう／〜してください）——那類改用「たら」",
      "ついでに 的主要目的是 A、B 只是順手；主次顛倒就不自然",
      "てはじめて 帶「原本不懂、經歷後才懂」的頓悟感，常配 わかった／気づいた；單純時間先後用「てから」就好"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n3-jikan-kikan"]
  },
  {
    id: "n3-fukugou-aspect",
    group: "basic",
    category: "N3 文法",
    kicker: "動作的階段",
    title: "かける / きる / っぱなし / 一方だ / 直す / ようとする",
    subtitle: "言いかける / 使いきる / つけっぱなし / 増える一方だ",
    explanation:
      "動作進行到哪個階段的一整組（接續各不同：かける/きる/っぱなし/直す 接ます形語幹；一方だ 接辭書形；(よ)うとする 接意向形）。「〜かける／〜かけの」＝做到一半、正要開始（言いかけてやめた＝話說一半；食べかけのパン＝吃到一半的麵包）。「〜きる」＝徹底做完、做到底（使いきる＝用光）；「〜きれる／〜きれない」＝（不）能做完（食べきれない＝吃不完）。「〜っぱなし」＝①放著不管（電気をつけっぱなし＝燈開著沒關）②持續不間斷（立ちっぱなし＝一直站著，常帶負擔）。「〜一方だ」＝辭書形＋一方だ、持續往一個方向（單向變化，多帶負面：物価は上がる一方だ＝物價一直漲）。「〜直す」＝重做一次（書き直す＝重寫）。「〜(よ)うとする」＝意向形＋とする、正要／試圖（帰ろうとした時＝正要回家時）；「〜(よ)うとしない」＝有意志的人「怎麼也不肯做」（話を聞こうとしない）、無意志的東西「沒有要…的跡象」（雨がやもうとしない＝雨沒有要停）。",
    examples: [
      { formula: "言いかけて、やめた", note: "かける：做到一半" },
      { formula: "この本は一日で読みきった", note: "きる：徹底做完" },
      { formula: "宿題が多くて、やりきれない", note: "きれない：做不完" },
      { formula: "エアコンをつけっぱなしで寝た", note: "っぱなし：放著不管" },
      { formula: "参加者は減る一方だ", note: "一方だ：單向持續（多負面）" }
    ],
    pitfalls: [
      "接續：かける/きる/っぱなし/直す 接ます形語幹；一方だ 接辭書形；(よ)うとする 接意向形——別一律當ます形",
      "っぱなし 有兩類：①放著不管（つけっぱなし，該關卻放著、帶負面）②持續不間斷（立ちっぱなし＝一直站，常帶負擔）；單純中性的「保持狀態」用 〜たまま",
      "（よ）うとしない：人＝怎麼也不肯（常帶不滿）；無意志的東西＝沒有要變化的跡象（雨がやもうとしない）"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n4-fukugou"]
  },
  {
    id: "n3-gimu",
    group: "basic",
    category: "N3 文法",
    kicker: "義務・當然・不必要",
    title: "べきだ / ことはない / ないこともない / こと / 必要がある",
    subtitle: "謝るべきだ / 泣くことはない / できないこともない",
    explanation:
      "「應該／不必／得」這一組評價與義務。「〜べきだ／〜べきではない」＝（道理上）應該／不應該（謝るべきだ＝該道歉）——是主張、帶說話者的判斷；接辭書形，する 可用「すべき」或「するべき」。「〜ことはない」＝用不著、沒必要（心配することはない＝不用擔心）——安慰、勸阻對方。「〜ないことはない／〜ないこともない」＝並不是不…（雙重否定＝部分肯定、保留：食べられないことはない＝也不是不能吃、勉強可以）。「〜こと」（放句尾）＝規定・指示（廊下を走らないこと＝不准在走廊奔跑）。「〜必要がある」＝有必要、得（予約する必要がある）。",
    examples: [
      { formula: "悪いと思うなら、謝るべきだ", note: "べきだ：（道理上）應該" },
      { formula: "そんなに気にすることはない", note: "ことはない：用不著、沒必要" },
      { formula: "辛いけど、食べられないこともない", note: "ないこともない：也不是不能（保留）" },
      { formula: "ここに車を止めないこと", note: "こと：規定・指示（句尾）" },
      { formula: "パスポートを持っていく必要がある", note: "必要がある：有必要" }
    ],
    pitfalls: [
      "べきだ 是「道理上應該」的主張（帶判斷）；「必要がある」是客觀的「有此需要」——語氣不同",
      "ことはない（不必、勸阻）≠ Vることがある（有時會）≠ Vたことがある（曾經）——接續和意思都不同，別搞混",
      "ないことはない 是雙重否定的「保留式肯定」（勉強可以、並非完全不行），語氣婉轉、不是強烈肯定"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  },
  {
    id: "n3-teido-hikaku",
    group: "basic",
    category: "N3 文法",
    kicker: "程度・比較",
    title: "ほど / ほど〜はない / くらい / に比べて",
    subtitle: "死ぬほど疲れた / 富士山ほど美しい山はない",
    explanation:
      "講「多…／有多…／比…」的程度與比較。「〜ほど」＝到…的程度（死ぬほど疲れた＝累得要死；三日ほど休む＝休三天左右）——標出程度，可以是誇張的比喻、也可以是客觀的量。「〜ほど〜はない／〜くらい〜はない」＝同類裡沒有比…更…的（最高級：富士山ほど美しい山はない）——ほど 前面放的是「最高基準」、後面的「〜はない／いない」否定「有比它更…的存在」。「〜くらい／〜ぐらい」＝大約、到…的程度（子どもでもわかるくらい簡単＝簡單到連小孩都懂）——偏口語、約略、舉例或講「最起碼」；ほど 偏「達到某基準」。「〜に比べて」＝跟…相比（去年に比べて、今年は暑い）。",
    examples: [
      { formula: "死ぬほど疲れた", note: "ほど：到…的程度（誇張）" },
      { formula: "富士山ほど美しい山はない", note: "ほど〜はない：最高級（沒有比…更）" },
      { formula: "子どもでもわかるくらい簡単だ", note: "くらい：到…的程度" },
      { formula: "去年に比べて、今年は暑い", note: "に比べて：跟…相比" }
    ],
    pitfalls: [
      "「Nほど〜Nはない」＝同類中沒有比N更〜（最高級）；「AはBほど〜ない」＝A不像B那麼〜（比較否定，N4學過）——同一個ほど、看句型判斷",
      "最高級句的「〜はない／いない」前面是被否定存在的比較集合（美しい山はない／速い人はいない）；ほど 前的名詞是最高基準、不是主語",
      "くらい／ぐらい 偏口語・約略・舉例・最起碼（死ぬくらい疲れた 也行）；ほど 偏達到某基準。に比べて／と比べて 皆可，に 偏比較基準、と 偏拿來對照"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n4-chikaku"]
  },
  {
    id: "n3-kyouchou",
    group: "basic",
    category: "N3 文法",
    kicker: "強調・取り立て",
    title: "こそ / さえ・でさえ / など・なんか・なんて / だけで",
    subtitle: "今度こそ / 子どもでさえ / 勉強なんて / 見ただけで",
    explanation:
      "把某個成分「特別挑出來」強調的一組。「〜こそ」＝正是…、就是…（今度こそ成功する＝這次一定成功；こちらこそ＝我才是）。「〜さえ／〜でさえ」＝連…都、甚至…（子どもでさえ知っている＝連小孩都知道）——取り立て一個意外或極端/最低限的例子，暗示其他更不用說。「〜など／〜なんか／〜なんて」＝…之類、…什麼的：など 偏書面/列舉，なんか 偏口語（輕視或自謙），なんて 偏口語（可輕視、也可接整句表意外：合格するなんて！）。「〜だけで」＝光是…就（見ただけで泣いた＝光是看到就哭了）。",
    examples: [
      { formula: "今度こそ、合格するぞ", note: "こそ：正是、這次一定" },
      { formula: "子どもでさえ、その言葉を知っている", note: "でさえ：連…都（極端例）" },
      { formula: "勉強なんか、したくない", note: "なんか：…之類（輕視）" },
      { formula: "考えただけで、こわくなる", note: "だけで：光是…就" }
    ],
    pitfalls: [
      "「さえ」取り立て（連…都）vs 條件（只要X就）——條件是「Xさえ＋条件形」（さえ〜ば／さえすれば／でさえあれば），看有沒有形成『只要…就』、不是單看ば",
      "など／なんか／なんて 不是單純中性→輕蔑：など 偏書面/列舉（也可輕視/自謙）、なんか 口語（輕視或自謙）、なんて 口語（輕視、引用整句、或表意外）",
      "こそ 是正面強調（正是這個）；でさえ 是舉意外/極端例；だけで 是「光憑這一點就」——三種不同的強調"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["plain"]
  },
  {
    id: "n3-kooo-fukushi",
    group: "basic",
    category: "N3 文法",
    kicker: "副詞的呼應",
    title: "決して / なかなか / 別に〜ない / 今にも〜そうだ",
    subtitle: "決して忘れない / なかなか来ない / 今にも降りそうだ",
    explanation:
      "有些副詞出現，句尾就得配特定的形——這叫「呼應」，是讀解和文法題的常客。否定呼應：「決して〜ない」＝絕對不…、決非…（用於強烈的否定：決して忘れない／決して悪い人ではない）；「なかなか〜ない」＝遲遲不…、怎麼也不…（期待卻沒發生：バスがなかなか来ない）；「別に〜ない」＝沒特別…、也沒什麼（別に問題ない＝沒什麼問題）。様態呼應：「今にも〜そうだ」＝眼看就要…（眼前可預測的變化：今にも雨が降りそうだ）。看到前面的副詞，就要預判句尾。",
    examples: [
      { formula: "この約束は決して忘れない", note: "決して〜ない：絕對不" },
      { formula: "待っているのに、バスがなかなか来ない", note: "なかなか〜ない：遲遲不" },
      { formula: "「どうかした？」「別に何でもない」", note: "別に〜ない：沒特別" },
      { formula: "空が暗くて、今にも雨が降りそうだ", note: "今にも〜そうだ：眼看就要" }
    ],
    pitfalls: [
      "「決して」幾乎一定跟否定呼應；「なかなか」「別に」要看句尾——否定時各有特定語感，肯定時另有他意（見下）",
      "なかなか＋肯定＝相當、很（なかなかおいしい）；なかなか＋否定＝遲遲不。別に＋否定＝沒特別，口語「別にいい／別に」也是這個別に——都看句尾判斷",
      "今にも〜そうだ 是「眼看就要發生」（眼前可預測的變化：雨、倒れる、泣く…），接ます形語幹（降りそう／倒れそう）；跟伝聞的「そうだ」（接普通形）不同"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n3-suiryou"]
  },
  {
    id: "n3-heiretsu",
    group: "basic",
    category: "N3 文法",
    kicker: "並列・添加",
    title: "だけでなく〜も / はもちろん / も〜ば〜も",
    subtitle: "英語だけでなく中国語も / 漢字はもちろん / 頭もよければ",
    explanation:
      "把兩件事並列、添加的一組。「〜だけでなく〜も」＝不只…也…（英語だけでなく、中国語も話せる＝不只英語，中文也會）。「〜はもちろん(〜も)」＝…自不用說，（連）…也（漢字はもちろん、ひらがなも書けない＝別說漢字了，連平假名也不會寫）——前項是理所當然、後項才是重點。「〜も〜ば〜も／〜も〜なら〜も」＝又…又…、有…也有…（並舉同類：頭もよければ、性格もいい＝又聰明、人又好）——用「ば／なら」把兩個並列項串起來。",
    examples: [
      { formula: "英語だけでなく、中国語も話せる", note: "だけでなく〜も：不只…也…" },
      { formula: "漢字はもちろん、ひらがなも書けない", note: "はもちろん：…自不用說" },
      { formula: "彼は頭もよければ、性格もいい", note: "も〜ば〜も：又…又…" },
      { formula: "この店は安いし、量も多い", note: "（近義）〜し：列舉理由・並列" }
    ],
    pitfalls: [
      "はもちろん 前項是「當然、不用說」，重點在後項（連…都）；だけでなく 則單純「不只A、還有B」",
      "も〜ば〜も 的「ば」不是條件，是把兩個並列項串起來（頭もよ『ければ』…）——別誤讀成假設",
      "同是「不只」，だけでなく（中性）／ばかりでなく（略書面、見已授ばかり章）／のみならず（書面）語體不同"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n3-bakari"]
  },
  {
    id: "n3-joutai",
    group: "basic",
    category: "N3 文法",
    kicker: "狀態・樣子",
    title: "だらけ / ずに / がする",
    subtitle: "泥だらけ / 何も言わずに / いい匂いがする",
    explanation:
      "描述狀態、樣子的一組。「〜だらけ」＝滿是…、全是…（名詞＋だらけ，多帶負面：泥だらけ＝滿身泥；間違いだらけ＝錯誤一堆）。「〜ずに」＝沒有…就…（＝ないで 的書面體：何も言わずに帰った＝什麼都沒說就走了）——注意する的變化是「せずに」。「〜がする」＝（感覺到）有…（知覺：音・匂い・味・気・感じ がする；いい匂いがする＝聞到香味；何かが起こる気がする＝總覺得會出事）——N4 學過音・匂い，這裡把整組收齊。",
    examples: [
      { formula: "子どもが泥だらけになって帰ってきた", note: "だらけ：滿是…（多負面）" },
      { formula: "彼は何も言わずに部屋を出た", note: "ずに：沒…就…（＝ないで、書面）" },
      { formula: "宿題もせずに遊びに行った", note: "する→せずに（不規則）" },
      { formula: "台所からいい匂いがする", note: "がする：知覺（音・匂い・味・気）" }
    ],
    pitfalls: [
      "だらけ 接名詞、幾乎都是負面（泥・間違い・借金だらけ）；中性的「充滿」用「〜でいっぱい」",
      "ずに＝ないで（書面體）；する 的形是「せずに」不是「しずに」",
      "がする 的對象用が（匂いがする）；「気がする」＝總覺得、有種預感（接普通形＋気がする）"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n4-chikaku"]
  },
  {
    id: "n3-ganbou",
    group: "basic",
    category: "N3 文法",
    kicker: "願望・請求",
    title: "てほしい / といい・ばいい / ように（依頼・忠告）",
    subtitle: "手伝ってほしい / 雨が降るといい / 早く来るように言う",
    explanation:
      "希望別人怎麼做、或表達願望的一組。「〜てほしい」＝希望（別人）…（跟自己想做的「〜たい」不同：手伝ってほしい＝希望你幫忙；否定＝〜ないでほしい）。「〜といい／〜ばいい／〜たらいい」＝…就好了（願望或建議：雨が降るといい＝希望下雨；どうすればいい？＝該怎麼辦才好？）。「〜ように」（依頼・忠告）＝要（某人）…（後面接言う・頼む・注意する 等傳達動詞：早く来るように言った＝叫他早點來；忘れ物をしないように注意した）——跟表「目的・防止」的ように（忘れないようにメモする，見 n3-mokuteki）同形，看後面接的是傳達動詞、還是自己的意志動作來分。",
    examples: [
      { formula: "この仕事を手伝ってほしい", note: "てほしい：希望（別人）…" },
      { formula: "明日、晴れるといいですね", note: "といい：…就好了（願望）" },
      { formula: "どうすればいいか、分からない", note: "ばいい：怎麼做才好" },
      { formula: "先生は、早く来るように言った", note: "ように＋言う：依頼・忠告" }
    ],
    pitfalls: [
      "「〜たい」是自己想做，「〜てほしい」是希望別人做——主體不同，別搞混",
      "といい／ばいい／たらいい 都能表願望・建議；問「該怎麼辦」最常用「どうすればいい／どうしたらいい」",
      "ように＋言う／頼む／注意する 等傳達動詞＝依頼・忠告（要某人…）；Vる／Vないように＋自己的意志動作＝目的・防止（忘れないようにメモする）——看後面接什麼"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n3-mokuteki"]
  },
  {
    id: "n3-ukemi-shieki",
    group: "basic",
    category: "N3 文法",
    kicker: "受身・使役的發展",
    title: "受身 / 使役 / 使役受身 / 迷惑の受身",
    subtitle: "先生に褒められた / 掃除させた / お酒を飲まされた",
    explanation:
      "被動與使役的整理與進階。受身（被…）＝「AはBに〜られる」：先生に褒められた＝被老師稱讚。使役（讓/叫…）＝「AはBに/を〜させる」：母は弟に部屋を掃除させた＝媽媽叫弟弟掃房間。進階兩個：使役受身「〜させられる」＝被迫做（自己不願意卻被叫做：父にお酒を飲まされた＝被爸爸逼著喝酒）——一類動詞口語常縮成「飲まされる」（す結尾不縮：話させられる），二類是「食べさせられる」。迷惑の受身（間接被動）＝因為別人的動作而受害、困擾：雨に降られた＝被雨淋（掃興）；子どもに泣かれた＝小孩一直哭（很困擾）——動詞是自動詞、受害者當主語。",
    examples: [
      { formula: "先生に作文を褒められた", note: "受身：被…（AはBに〜られる）" },
      { formula: "母は弟に部屋を掃除させた", note: "使役：讓/叫…（に/を〜させる）" },
      { formula: "子どものとき、ピアノを習わされた", note: "使役受身：被迫（〜させられる）" },
      { formula: "帰り道で雨に降られた", note: "迷惑の受身：受害（自動詞）" }
    ],
    pitfalls: [
      "使役受身縮約：一類多數可縮（飲ませられる→飲まされる、書かせられる→書かされる），但す結尾的不縮（話す→話させられる、不是話さされる）；二類本來就不縮（食べさせられる）",
      "迷惑の受身用自動詞（降る・泣く・来る），受害的人當主語，帶「被…害到、掃興」的語感",
      "受身的動作者用「に」（先生に褒められた）；使役：他動詞又有目的語時、被叫的人用「に」（弟に部屋を掃除させた）；自動詞時被叫的人常用「を」（弟を行かせた）、也可依語意用に"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["passive"]
  },
  {
    id: "n3-okage-sei",
    group: "basic",
    category: "N3 文法",
    kicker: "原因的評價",
    title: "おかげで / せいで（恩惠 vs 責怪）",
    subtitle: "あなたのおかげで / 雨のせいで",
    explanation:
      "同樣講「因為…」，但帶了說話者的評價。「〜おかげで／おかげだ」＝多虧…、託…的福（正面：好結果歸功於某原因：あなたのおかげで成功した＝多虧你才成功）。「〜せいで／せいだ」＝都怪…、因為…（負面：壞結果歸咎於某原因：雨のせいで試合が中止になった＝都怪下雨比賽取消了）。「〜せいか」＝不知是不是因為…（推測原因、語氣不確定：年のせいか、疲れやすい＝不知是不是上了年紀、容易累）。中性、不帶褒貶的「因為」用「〜ため（に）」（見既有目的・原因章）。",
    examples: [
      { formula: "先生のおかげで、合格できた", note: "おかげで：多虧…（正面）" },
      { formula: "寝坊したせいで、電車に遅れた", note: "せいで：都怪…（負面）" },
      { formula: "年のせいか、最近よく忘れる", note: "せいか：不知是不是因為…" },
      { formula: "皮肉：勉強しなかったおかげで落ちた", note: "おかげで 也可反諷" }
    ],
    pitfalls: [
      "おかげで＝好結果的功勞（正面）、せいで＝壞結果的過錯（負面）——選錯就變成褒貶顛倒",
      "せいか 是「不確定是不是這個原因」的推測，比 せいで 語氣軟",
      "「おかげで」偶爾用來反諷（明明是壞事卻說『託你的福』）；中性的因果用 ため（に）"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n3-mokuteki"]
  },
  {
    id: "n3-keishiki-meishi",
    group: "basic",
    category: "N3 文法",
    kicker: "形式名詞",
    title: "ことがある / まま / ふりをする",
    subtitle: "遅れることがある / つけたまま / 知らないふり",
    explanation:
      "把動詞句名詞化的形式名詞用法。「Vることがある」＝有時會…、有時會發生…（たまに学校に遅れることがある＝偶爾會遲到）——跟「Vたことがある」（曾經、經驗，N4）接續不同、意思不同。「〜まま／〜たまま」＝保持原狀（N4 學過、這裡複習：めがねをかけたまま寝た＝戴著眼鏡就睡了；ない形也可：何も食べないまま出かけた）。「〜ふりをする」＝假裝…（知らないふりをする＝裝作不知道；寝たふり＝裝睡）——動詞・い形容詞普通形＋ふり、な形容詞語幹＋なふり（元気なふり）、名詞＋のふり（病気のふり）。",
    examples: [
      { formula: "私はたまに、朝ごはんを抜くことがある", note: "Vることがある：有時會（習慣）" },
      { formula: "エアコンをつけたまま出かけた", note: "たまま：保持原狀（N4 複習）" },
      { formula: "彼は知らないふりをした", note: "ふりをする：假裝" },
      { formula: "聞こえないふりをして、歩き続けた", note: "ふり：裝作沒…" }
    ],
    pitfalls: [
      "Vることがある（有時會、偶爾發生）≠ Vたことがある（曾經、經驗）——接續（辭書形/た形）決定意思",
      "まま 前面：做了的狀態用た形（つけたまま）、沒做的狀態用ない形（消さないまま）",
      "ふりをする 接續：動詞・い形＋ふり、な形容詞＋なふり（元気なふり、不是元気だふり）、名詞＋のふり（病気のふり）"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["n4-henka"]
  },
  {
    id: "n3-hanashi-kotoba",
    group: "basic",
    category: "N3 文法",
    kicker: "口語・文末",
    title: "縮約形 ちゃう・とく・なきゃ / もの・もん",
    subtitle: "食べちゃった / やっとく / 帰らなきゃ / だって〜もん",
    explanation:
      "聽解和會話最常出現的口語縮約與文末表現。縮約形：「〜ちゃう／じゃう」＝〜てしまう／でしまう（食べちゃった＝吃掉了/不小心吃了）；「〜とく／どく」＝〜ておく／でおく（やっとく＝先做好；飲んどく＝飲んでおく）；「〜てる」＝〜ている（待ってる）；「〜なきゃ／なくちゃ」＝なければ／なくては（帰らなきゃ＝得回家了；なきゃ 是「なければ〔ならない／いけない〕」省略了後半，N4 學過）。文末：「〜もの／もん」＝表理由、辯解（撒嬌或不服氣的口氣：だって、疲れたもん＝人家就是累了嘛）——多用於口語，もん 比 もの 更隨性。",
    examples: [
      { formula: "アイス、全部食べちゃった", note: "ちゃう＝てしまう（完了/不小心）" },
      { formula: "資料、コピーしとくね", note: "とく＝ておく（事先做好）" },
      { formula: "もう時間がない。行かなきゃ", note: "なきゃ＝なければ（ならない省略）" },
      { formula: "「どうして来たの？」「だって、心配だったんだもん」", note: "もん：辯解・撒嬌的理由" }
    ],
    pitfalls: [
      "縮約還原：ちゃう→てしまう、じゃう→でしまう、とく→ておく、どく→でおく（飲んどく＝飲んでおく）、てる→ている、なきゃ→なければ（〜ならない省略）、なくちゃ→なくては",
      "「ぐ・ぬ・ぶ・む」結尾的て形是で系，縮約也走で系：飲んでしまう→飲んじゃう、飲んでおく→飲んどく",
      "もの／もん 放句尾表理由、帶「你想想嘛／人家就是…」的辯解語氣；正式場合不用"
    ],
    completionMode: "reference",
    examDrill: { labelKey: "drillN3Grammar", level: "N3", promptLabel: "文法形式選擇" },
    drillNote: "※ 這章是文法整理；按鈕去練 N3 文法形式選擇題庫，邊練邊熟。",
    recommendedAfter: ["teTa"]
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
