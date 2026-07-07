import type { PracticeQuestion, VocabularyItem } from "./types";
import { patternInstructionI18n, sentencePatternI18n } from "./sentencePatterns.i18n";

export type SentencePatternId =
  | "starter-desu"
  | "starter-particles"
  | "n5-sonzai"
  | "n5-ichi"
  | "n5-joshi2"
  | "n5-joshi3"
  | "te-kudasai"
  | "nakute-mo-ii"
  | "te-morau"
  | "to-omou"
  | "mae-ato"
  | "nagara-tari"
  | "te-aux";

export type SentencePatternItem = {
  id: string;
  patternId: SentencePatternId;
  promptText: string;
  /**
   * Pre-answer hint: a neutral situation description shown above the
   * prompt. Must NOT name the answer's grammatical role or use the
   * Chinese gloss of any candidate pattern (no 「請」「禁止」「不必」
   * 「必須」「可以」「以為」「說」 etc.); a guard script enforces this.
   */
  hintZh: string;
  /** Full Chinese translation, shown POST-answer in the feedback panel. */
  promptContextZh: string;
  expectedAnswer: string;
  options: string[];
  explanation: string;
};

const PATTERN_LABEL_ZH: Record<SentencePatternId, string> = {
  "starter-desu": "基本句 〜です",
  "starter-particles": "助詞入門",
  "n5-sonzai": "存在 あります・います",
  "n5-ichi": "位置與指示",
  "n5-joshi2": "助詞II へ・で・と・や",
  "n5-joshi3": "助詞III の・も・か・から",
  "te-kudasai": "請求 / 許可 / 禁止",
  "nakute-mo-ii": "不必 / 必須",
  "te-morau": "授受視角",
  "to-omou": "引用 / 意見",
  "mae-ato": "前後關係",
  "nagara-tari": "並列・同時",
  "te-aux": "補助動詞"
};

// ===========================================================================
// N5 pattern: n5-sonzai -- あります/います existence sentences (#543).
//   The biggest single N5 gap from the coverage audit. Kana-first with
//   starter-deck words; new words get a ※gloss in the explanation.
//   Unique-solution levers: alive/inanimate subject picks あります vs
//   います; で (action location) vs に (existence location) is the classic
//   trap and appears only where the verb makes it dead.
// ===========================================================================
const N5_SONZAI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-sonzai-001",
    patternId: "n5-sonzai",
    promptText: "へやに ねこ___ います。",
    hintZh: "告訴對方房間裡有什麼。",
    promptContextZh: "「房間裡有一隻貓。」",
    expectedAnswer: "が",
    options: ["が", "を", "へ", "で"],
    explanation:
      "「〜に 〜が います」是存在句的固定形：第一次提到「有什麼」時，那個東西用「が」。「を」接動作對象，但います不是動作；「へ」表方向；「で」是動作發生的場所，跟います（存在）接不上。※へや＝房間。"
  },
  {
    id: "pattern-n5-sonzai-002",
    patternId: "n5-sonzai",
    promptText: "つくえの うえに ほん___ あります。",
    hintZh: "說桌上有什麼東西。",
    promptContextZh: "「桌上有書。」",
    expectedAnswer: "が",
    options: ["が", "を", "で", "へ"],
    explanation:
      "存在句「〜に 〜が あります」：書是第一次登場的東西，用「が」。「で」是動作發生的場所，跟「あります（存在）」接不上。※つくえ＝桌子、うえ＝上面。"
  },
  {
    id: "pattern-n5-sonzai-003",
    patternId: "n5-sonzai",
    promptText: "いぬは にわ___ います。",
    hintZh: "回答狗在哪裡。",
    promptContextZh: "「狗在院子裡。」",
    expectedAnswer: "に",
    options: ["に", "で", "を", "へ"],
    explanation:
      "「存在的場所」用「に」——狗「在」院子，不是在院子「做」什麼。「で」配動作動詞（にわで あそびます）；這是 に／で 最重要的分工。※にわ＝院子。"
  },
  {
    id: "pattern-n5-sonzai-004",
    patternId: "n5-sonzai",
    promptText: "きょうしつに がくせいが ___。",
    hintZh: "說教室裡有誰。",
    promptContextZh: "「教室裡有學生。」",
    expectedAnswer: "います",
    options: ["います", "あります", "です", "でした"],
    explanation:
      "人和動物這些「有生命、會動的」用「います」；東西和植物用「あります」。學生是人 →「います」。※きょうしつ＝教室、がくせい＝學生。"
  },
  {
    id: "pattern-n5-sonzai-005",
    patternId: "n5-sonzai",
    promptText: "かばんの なかに けいたいが ___。",
    hintZh: "說包包裡有什麼東西。",
    promptContextZh: "「包包裡有手機。」",
    expectedAnswer: "あります",
    options: ["あります", "います", "ですか", "じゃありません"],
    explanation:
      "手機是東西（沒有生命），存在用「あります」。「います」留給人和動物。※なか＝裡面。"
  },
  {
    id: "pattern-n5-sonzai-006",
    patternId: "n5-sonzai",
    promptText: "すみません、トイレは どこ___ ありますか。",
    hintZh: "問廁所的位置。",
    promptContextZh: "「不好意思，廁所在哪裡？」",
    expectedAnswer: "に",
    options: ["に", "へ", "を", "が"],
    explanation:
      "問「在哪裡」＝問存在的場所，場所用「に」。「トイレは どこに ありますか」是問路的固定句。「へ」表方向，不表靜態存在的位置；「を」接動作對象；「が」的位置已被主題「は」佔走。※トイレ＝廁所。"
  },
  {
    id: "pattern-n5-sonzai-007",
    patternId: "n5-sonzai",
    promptText: "いま、いえに ねこは ___。",
    hintZh: "說現在家裡沒有貓（貓出門了）。",
    promptContextZh: "「現在貓不在家。」",
    expectedAnswer: "いません",
    options: ["いません", "ありません", "います", "いました"],
    explanation:
      "貓是動物 → 用います的否定「いません」。「ありません」是東西的否定；「いました」是過去，跟「いま（現在）」矛盾。提示說了貓不在，所以肯定的「います」也不對。"
  },
  {
    id: "pattern-n5-sonzai-008",
    patternId: "n5-sonzai",
    promptText: "ほんは つくえの うえに ___。",
    hintZh: "回答「書在哪裡」。",
    promptContextZh: "「書在桌子上。」",
    expectedAnswer: "あります",
    options: ["あります", "います", "です", "でしたか"],
    explanation:
      "這是「所在句」：已知的東西（ほんは）＋場所に＋あります。書是東西 →「あります」。「〜は 〜に あります」回答位置、「〜に 〜が あります」介紹存在，兩個句型是一對。※つくえ＝桌子、うえ＝上面。"
  }
];

// ===========================================================================
// N5 pattern: n5-ichi -- position words + この/その demonstratives (#543).
//   Position-word cloze items are locked by the hint's Chinese description
//   of the spatial relation (the established pattern-item lever) plus
//   option control; この/その items anchor on who is holding the object.
// ===========================================================================
const N5_ICHI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-ichi-001",
    patternId: "n5-ichi",
    promptText: "けいたいは かばんの ___に あります。",
    hintZh: "說手機的位置：在包包「裡面」。",
    promptContextZh: "「手機在包包裡面。」",
    expectedAnswer: "なか",
    options: ["なか", "うえ", "した", "まえ"],
    explanation:
      "位置的說法是「名詞＋の＋位置詞＋に」：かばんの なかに＝在包包裡面。なか＝裡面、うえ＝上面、した＝下面、まえ＝前面。"
  },
  {
    id: "pattern-n5-ichi-002",
    patternId: "n5-ichi",
    promptText: "ねこは つくえの ___に います。",
    hintZh: "說貓的位置：在桌子「下面」。",
    promptContextZh: "「貓在桌子下面。」",
    expectedAnswer: "した",
    options: ["した", "うえ", "なか", "うしろ"],
    explanation:
      "した＝下面。「つくえの したに」＝在桌子下面。「つくえの なか」指的是抽屜等收納空間的內部（放課本的地方），不是桌子底下；うしろ＝後面。※つくえ＝桌子。"
  },
  {
    id: "pattern-n5-ichi-003",
    patternId: "n5-ichi",
    promptText: "ほんは つくえの ___に あります。",
    hintZh: "說書的位置：在桌子「上面」。",
    promptContextZh: "「書在桌子上面。」",
    expectedAnswer: "うえ",
    options: ["うえ", "した", "まえ", "となり"],
    explanation:
      "うえ＝上面。中文說「桌上」，日文要用「名詞＋の＋位置詞」的結構：「つくえの うえに」。東西放在桌面上都用 うえ。"
  },
  {
    id: "pattern-n5-ichi-004",
    patternId: "n5-ichi",
    promptText: "がっこうは えきの ___に あります。",
    hintZh: "說學校的位置：在車站「前面」。",
    promptContextZh: "「學校在車站前面。」",
    expectedAnswer: "まえ",
    options: ["まえ", "うしろ", "なか", "うえ"],
    explanation:
      "まえ＝前面、うしろ＝後面。「えきの まえ」（車站前）是描述地點最常用的說法之一。※えき＝車站。"
  },
  {
    id: "pattern-n5-ichi-005",
    patternId: "n5-ichi",
    promptText: "トイレは へやの ___に あります。",
    hintZh: "說廁所的位置：在房間「旁邊」（緊鄰的隔壁）。",
    promptContextZh: "「廁所在房間旁邊。」",
    expectedAnswer: "となり",
    options: ["となり", "うえ", "なか", "まえ"],
    explanation:
      "となり＝旁邊（緊鄰、同類並排）。日文還有「よこ」也是旁邊，差別：となり 強調並排相鄰（隔壁），よこ 只說在側面方向。※トイレ＝廁所、へや＝房間。"
  },
  {
    id: "pattern-n5-ichi-006",
    patternId: "n5-ichi",
    promptText: "ぎんこうは スーパーの ___に あります。",
    hintZh: "說銀行的位置：在超市「後面」。",
    promptContextZh: "「銀行在超市後面。」",
    expectedAnswer: "うしろ",
    options: ["うしろ", "まえ", "した", "となり"],
    explanation:
      "うしろ＝後面。まえ／うしろ 是一對，配路標描述最常用。※ぎんこう＝銀行、スーパー＝超市。"
  },
  {
    id: "pattern-n5-ichi-007",
    patternId: "n5-ichi",
    promptText: "（じぶんの てに ある ほんを みて）___ ほんは わたしのです。",
    hintZh: "說自己手上拿著的這本書是自己的。",
    promptContextZh: "「（看著自己手上的書）這本書是我的。」",
    expectedAnswer: "この",
    options: ["この", "その", "あの", "どの"],
    explanation:
      "「この＋名詞」＝靠近自己的。これ 單獨用（これは ほんです）、この 後面一定接名詞（この ほん）。在自己手上 → この。※て＝手。"
  },
  {
    id: "pattern-n5-ichi-008",
    patternId: "n5-ichi",
    promptText: "（あいての てに ある かさを みて）___ かさは あなたのですか。",
    hintZh: "問對方手上拿著的那把傘是不是對方的。",
    promptContextZh: "「（看著對方手上的傘）那把傘是你的嗎？」",
    expectedAnswer: "その",
    options: ["その", "この", "あの", "どの"],
    explanation:
      "「その＋名詞」＝靠近對方的。傘在對方手上 → その。あの＝離雙方都遠；どの＝哪一個（疑問）。※かさ＝傘、あいて＝對方。"
  }
];

// ===========================================================================
// N5 pattern: n5-joshi2 -- へ・で(手段/場所)・と(並列)・や (#544).
//   Known near-synonym traps are kept OUT of the option sets by design:
//   に never appears where へ is the answer (direction overlap), enumerative
//   に (パンに たまご) never competes where と(並列) is the answer, と never
//   appears where や+など is the answer, と(with) never competes with で.
// ===========================================================================
const N5_JOSHI2_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-joshi2-001",
    patternId: "n5-joshi2",
    promptText: "あした、とうきょう___ いきます。",
    hintZh: "說明天要去哪個城市。",
    promptContextZh: "「明天去東京。」",
    expectedAnswer: "へ",
    options: ["へ", "を", "が", "と"],
    explanation:
      "移動的方向用「へ」（讀作 e）。方向也可以用「に」，語感差異：へ 強調「朝那個方向」、に 強調「到達點」——這題選項中用「へ」。「を」接動作對象；「と」是「和某人」。※とうきょう＝東京。"
  },
  {
    id: "pattern-n5-joshi2-002",
    patternId: "n5-joshi2",
    promptText: "バス___ がっこうへ いきます。",
    hintZh: "說怎麼去上學。",
    promptContextZh: "「搭公車去學校。」",
    expectedAnswer: "で",
    options: ["で", "に", "を", "へ"],
    explanation:
      "交通工具、手段用「で」：バスで＝搭公車。「に」在這裡接不上（バスに のります〈上車〉才用に）；方向已經有「がっこうへ」了。※バス＝公車。"
  },
  {
    id: "pattern-n5-joshi2-003",
    patternId: "n5-joshi2",
    promptText: "はし___ ごはんを たべます。",
    hintZh: "說用什麼吃飯。",
    promptContextZh: "「用筷子吃飯。」",
    expectedAnswer: "で",
    options: ["で", "を", "に", "へ"],
    explanation:
      "工具用「で」：はしで＝用筷子。動作對象「ごはんを」已經在句子裡；「に」表時間點或到達點、「へ」只表方向，都接不上工具。※はし＝筷子。"
  },
  {
    id: "pattern-n5-joshi2-004",
    patternId: "n5-joshi2",
    promptText: "きのう、パン___ たまごを かいました。",
    hintZh: "說昨天買的兩樣東西（全部列出）。",
    promptContextZh: "「昨天買了麵包和蛋。」",
    expectedAnswer: "と",
    options: ["と", "を", "へ", "で"],
    explanation:
      "把名詞「全部列出來」的「和」用「と」：パンと たまご＝麵包和蛋（就這兩樣）。若只是舉例（還有別的）用「や」。「を」已經接在たまご後面了。※パン＝麵包、たまご＝蛋。"
  },
  {
    id: "pattern-n5-joshi2-005",
    patternId: "n5-joshi2",
    promptText: "かばんの なかに ほん___ ペンなどが あります。",
    hintZh: "說包包裡放著哪些東西（沒有一一說完）。",
    promptContextZh: "「包包裡有書、筆等等。」",
    expectedAnswer: "や",
    options: ["や", "も", "を", "へ"],
    explanation:
      "「舉幾個例子、暗示還有別的」用「や」，常和句尾的「など（等等）」搭配：ほんや ペンなど。全部列完用「と」（不和など搭配）。※ペン＝筆。"
  },
  {
    id: "pattern-n5-joshi2-006",
    patternId: "n5-joshi2",
    promptText: "りんごは ぜんぶ___ いくらですか。",
    hintZh: "問全部加起來的價錢。",
    promptContextZh: "「蘋果全部多少錢？」",
    expectedAnswer: "で",
    options: ["で", "を", "に", "も"],
    explanation:
      "「合計、總共」用「で」：ぜんぶで いくら＝全部加起來多少錢。「を」「に」「も」都無法把「ぜんぶ」變成合計的單位。※りんご＝蘋果、ぜんぶ＝全部。"
  },
  {
    id: "pattern-n5-joshi2-007",
    patternId: "n5-joshi2",
    promptText: "としょかん___ べんきょうします。",
    hintZh: "說在哪裡讀書。",
    promptContextZh: "「在圖書館讀書。」",
    expectedAnswer: "で",
    options: ["で", "へ", "が", "と"],
    explanation:
      "「在某處做動作」用「で」——讀書是動作。「へ」是朝某方向移動（としょかんへ いきます 才用へ）；「が」會把圖書館變成讀書的主語，不通。※としょかん＝圖書館、べんきょうします＝讀書/學習。"
  },
  {
    id: "pattern-n5-joshi2-008",
    patternId: "n5-joshi2",
    promptText: "にちようび、ともだちと こうえん___ いきます。",
    hintZh: "說星期天和朋友要去的地方。",
    promptContextZh: "「星期天和朋友去公園。」",
    expectedAnswer: "へ",
    options: ["へ", "を", "が", "で"],
    explanation:
      "移動的方向用「へ」。「で」是動作發生的場所——こうえんで あそびます（在公園玩）才用で，「去」公園是移動。※にちようび＝星期天、こうえん＝公園。"
  }
];

// ===========================================================================
// N5 pattern: n5-joshi3 -- の・も・か(選擇)・から〜まで・だけ (#544).
//   は never competes where も/だけ is the answer (topicalized readings are
//   grammatical); と never competes with selectional か.
// ===========================================================================
const N5_JOSHI3_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-n5-joshi3-001",
    patternId: "n5-joshi3",
    promptText: "これは わたし___ かばんです。",
    hintZh: "說這個包包是誰的。",
    promptContextZh: "「這是我的包包。」",
    expectedAnswer: "の",
    options: ["の", "は", "が", "を"],
    explanation:
      "「誰的東西」用「の」連接：わたしの かばん＝我的包包。「は」「が」標主題/主語，放進去句子就斷掉了；「を」接動作對象。"
  },
  {
    id: "pattern-n5-joshi3-002",
    patternId: "n5-joshi3",
    promptText: "「これは だれの ペンですか。」「たなかさん___ です。」",
    hintZh: "回答筆的主人是誰（不重複說「筆」）。",
    promptContextZh: "「這是誰的筆？」「是田中的。」",
    expectedAnswer: "の",
    options: ["の", "は", "が", "へ"],
    explanation:
      "「の」可以代替前面說過的名詞：たなかさんの（です）＝田中的（筆）——不用把「ペン」再說一次。這是の的「代替」用法。※ペン＝筆。"
  },
  {
    id: "pattern-n5-joshi3-003",
    patternId: "n5-joshi3",
    promptText: "わたしは がくせいです。おとうと___ がくせいです。",
    hintZh: "接著介紹弟弟的身分。",
    promptContextZh: "「我是學生。弟弟也是學生。」",
    expectedAnswer: "も",
    options: ["も", "に", "を", "へ"],
    explanation:
      "「也」用「も」：前一句說了我是學生，弟弟「也」是 → おとうとも。「も」直接取代は/が 的位置；「に」「を」「へ」都放不進主語的位置。※おとうと＝弟弟。"
  },
  {
    id: "pattern-n5-joshi3-004",
    patternId: "n5-joshi3",
    promptText: "きょうしつに だれ___ いません。",
    hintZh: "說教室裡一個人都沒有。",
    promptContextZh: "「教室裡誰都不在。」",
    expectedAnswer: "も",
    options: ["も", "か", "を", "の"],
    explanation:
      "「疑問詞＋も＋否定」＝全面否定：だれも いません（誰都不在）、なにも ありません（什麼都沒有）。這句是在「陳述」教室裡誰都不在，所以用 だれも＋否定；「だれか」是「某人」，用在別的句型（如 だれか いませんか？）。"
  },
  {
    id: "pattern-n5-joshi3-005",
    patternId: "n5-joshi3",
    promptText: "コーヒー___ おちゃ、どちらが いいですか。",
    hintZh: "請對方二選一。",
    promptContextZh: "「咖啡或茶，哪個好？」",
    expectedAnswer: "か",
    options: ["か", "や", "も", "を"],
    explanation:
      "「A或B（二選一）」用「か」：コーヒーか おちゃ。「や」是舉例（還有別的），跟「どちら（兩個之中哪個）」矛盾。※コーヒー＝咖啡、おちゃ＝茶。"
  },
  {
    id: "pattern-n5-joshi3-006",
    patternId: "n5-joshi3",
    promptText: "がっこうは ９じ___ ３じまでです。",
    hintZh: "說學校的起訖時間。",
    promptContextZh: "「學校從九點到三點。」",
    expectedAnswer: "から",
    options: ["から", "まで", "に", "へ"],
    explanation:
      "「從～到～」＝「〜から〜まで」：９じから ３じまで。起點用から、終點用まで——句尾已有まで，空格是起點。※〜じ＝〜點鐘。"
  },
  {
    id: "pattern-n5-joshi3-007",
    patternId: "n5-joshi3",
    promptText: "いえ___ えきまで あるきます。",
    hintZh: "說走路的起點和終點。",
    promptContextZh: "「從家走到車站。」",
    expectedAnswer: "から",
    options: ["から", "まで", "を", "で"],
    explanation:
      "「〜から〜まで」也用在場所：いえから えきまで＝從家到車站。「で」是動作場所（不是起點）；「を」的通過用法（みちを あるきます）接的是走過的路，不是起點。※あるきます＝走路。"
  },
  {
    id: "pattern-n5-joshi3-008",
    patternId: "n5-joshi3",
    promptText: "きょうしつに がくせいが ひとり___ います。",
    hintZh: "說教室裡除了一個學生，沒有別人。",
    promptContextZh: "「教室裡只有一個學生。」",
    expectedAnswer: "だけ",
    options: ["だけ", "も", "を", "へ"],
    explanation:
      "「只、只有」用「だけ」：ひとりだけ＝只有一個人。「ひとりも」要接否定（ひとりも いません＝一個人都沒有），跟句尾肯定的「います」矛盾。※ひとり＝一個人。"
  }
];

// ===========================================================================
// Lesson-0 pattern A: starter-desu -- the AはBです sentence family (#534).
//   Absolute-beginner floor: kana-only sentences built from the starter
//   vocabulary deck. Unique solutions are locked by IN-SENTENCE anchors
//   (はい/いいえ for polarity, きのう/あした/いま for tense, はじめまして
//   for self-introduction) plus option control -- only ONE option ever
//   satisfies the anchors.
// ===========================================================================
const STARTER_DESU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-starter-desu-001",
    patternId: "starter-desu",
    promptText: "「がくせいですか。」「はい、わたしは いま がくせい___。」",
    hintZh: "回答關於自己身分的問題。",
    promptContextZh: "「你是學生嗎？」「是的，我現在是學生。」",
    expectedAnswer: "です",
    options: ["です", "でした", "じゃありません", "ですか"],
    explanation:
      "對方用肯定形問「がくせいですか」，回答「はい」＝同意「是學生」，所以接現在肯定的「です」；「じゃありません」和「はい」矛盾。「いま」表示現在，排除過去的「でした」（像昨天那樣已經過去的事）。※がくせい＝學生。"
  },
  {
    id: "pattern-starter-desu-002",
    patternId: "starter-desu",
    promptText: "「せんせいですか。」「いいえ、わたしは せんせい___。」",
    hintZh: "更正對方對自己身分的誤會。",
    promptContextZh: "「你是老師嗎？」「不，我不是老師。」",
    expectedAnswer: "じゃありません",
    options: ["じゃありません", "です", "じゃありませんでした", "ですか"],
    explanation:
      "對方用肯定形問「せんせいですか」，回答「いいえ」＝否定「是老師」→ 現在否定「じゃありません」。「です」和「いいえ」矛盾；「じゃありませんでした」是過去否定，但問句問的是現在；「ですか」用來發問。"
  },
  {
    id: "pattern-starter-desu-003",
    patternId: "starter-desu",
    promptText: "きのうは あめ___。",
    hintZh: "說昨天的天氣。",
    promptContextZh: "「昨天下雨（昨天是雨天）。」",
    expectedAnswer: "でした",
    options: ["でした", "です", "ですか", "じゃありません"],
    explanation:
      "「きのう（昨天）」是過去的事，名詞句的過去肯定用「でした」。「です」是現在；「じゃありません」是現在否定；「ですか」是問句。※あめ＝雨。"
  },
  {
    id: "pattern-starter-desu-004",
    patternId: "starter-desu",
    promptText: "「きのうは あめでしたか。」「いいえ、あめ___。」",
    hintZh: "更正對方對昨天天氣的印象。",
    promptContextZh: "「昨天下雨了嗎？」「不，昨天沒有下雨。」",
    expectedAnswer: "じゃありませんでした",
    options: ["じゃありませんでした", "でした", "です", "じゃありません"],
    explanation:
      "對方用肯定形問「あめでしたか」，回答「いいえ」＝否定它＋「きのう」是過去 → 過去否定「じゃありませんでした」。「でした」跟「いいえ」矛盾；「じゃありません」是現在否定，跟過去的問句對不上。"
  },
  {
    id: "pattern-starter-desu-005",
    patternId: "starter-desu",
    promptText: "「あのう、あれは いぬ___。」「はい、そうです。」",
    hintZh: "指著遠處的動物，向對方確認。",
    promptContextZh: "「請問……那是狗嗎？」「對，是的。」",
    expectedAnswer: "ですか",
    options: ["ですか", "です", "でした", "じゃありません"],
    explanation:
      "對方回答了「はい、そうです」——會得到回答的，一定是問句，所以句尾用「ですか」。若用「です」就是告訴對方，後面不會接「はい」的回答。"
  },
  {
    id: "pattern-starter-desu-006",
    patternId: "starter-desu",
    promptText: "あしたは やすみ___。",
    hintZh: "說明天的安排。",
    promptContextZh: "「明天放假（明天是休息日）。」",
    expectedAnswer: "です",
    options: ["です", "でした", "じゃありませんでした", "でしたか"],
    explanation:
      "「あした（明天）」還沒發生，日文的名詞句用現在形「です」就能表達未來。「でした」「じゃありませんでした」「でしたか」都帶過去，跟「あした」矛盾。※やすみ＝休假。"
  },
  {
    id: "pattern-starter-desu-007",
    patternId: "starter-desu",
    promptText: "はじめまして。わたしの なまえは たなか___。",
    hintZh: "第一次見面的開場白。",
    promptContextZh: "「初次見面，我的名字是田中。」",
    expectedAnswer: "です",
    options: ["です", "ですか", "じゃありません", "じゃありませんでした"],
    explanation:
      "「はじめまして」是初次見面的招呼，接著介紹自己的名字＝現在肯定「です」。介紹自己不會用否定或問句結尾。"
  },
  {
    id: "pattern-starter-desu-008",
    patternId: "starter-desu",
    promptText: "これは わたしの かばん___。わたしのは あれです。",
    hintZh: "說明哪一個包包才是自己的。",
    promptContextZh: "「這不是我的包包，我的是那個。」",
    expectedAnswer: "じゃありません",
    options: ["じゃありません", "です", "でした", "ですか"],
    explanation:
      "第二句說「我的是那個（あれ）」，所以第一句一定在否定「這個是我的」→「じゃありません」。若第一句用「です」，兩句就互相矛盾了。"
  }
];

// ===========================================================================
// Lesson-0 pattern B: starter-particles -- は・を・に・が (+で/と) (#534).
//   Same floor as starter-desu. The double-solution traps here are the
//   particle system itself: へ/に for direction and は/が for subjects are
//   NEVER offered head-to-head unless the sentence makes one impossible
//   (e.g. an interrogative subject だれ can't take は).
// ===========================================================================
const STARTER_PARTICLES_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-starter-particles-001",
    patternId: "starter-particles",
    promptText: "わたし___ まいにち みずを のみます。",
    hintZh: "描述自己每天的習慣。",
    promptContextZh: "「我每天喝水。」",
    expectedAnswer: "は",
    options: ["は", "を", "に", "で"],
    explanation:
      "「わたし」是這句話的主題（談論的對象），用「は」標記。「を」接動作的對象（這句已經有みずを）；「に」表時間點或目的地；「で」表動作發生的場所。"
  },
  {
    id: "pattern-starter-particles-002",
    patternId: "starter-particles",
    promptText: "あさ、みず___ のみます。",
    hintZh: "說早上做的一件事。",
    promptContextZh: "「早上喝水。」",
    expectedAnswer: "を",
    options: ["を", "に", "へ", "が"],
    explanation:
      "「みず」是「のみます（喝）」的對象，動作的對象用「を」。「が」標記做動作的主語，水不是喝東西的一方；「に」表時間點或方向、「へ」只表方向——都接不上「喝」的對象。"
  },
  {
    id: "pattern-starter-particles-003",
    patternId: "starter-particles",
    promptText: "あした、がっこう___ いきます。",
    hintZh: "說明天要去的地方。",
    promptContextZh: "「明天去學校。」",
    expectedAnswer: "に",
    options: ["に", "を", "で", "と"],
    explanation:
      "「いきます（去）」的目的地用「に」。「を」是動作對象；「で」是動作發生的場所（在～做某事），不是要去的方向；「と」是「和某人一起」。※方向也可以用「へ」，這題選項中用「に」。"
  },
  {
    id: "pattern-starter-particles-004",
    patternId: "starter-particles",
    promptText: "だれ___ きますか。",
    hintZh: "問會來的人是哪一位。",
    promptContextZh: "「誰要來？」",
    expectedAnswer: "が",
    options: ["が", "を", "に", "で"],
    explanation:
      "疑問詞（だれ、なに）當主語時用「が」——順帶記住：這裡不能用「は」，因為「は」前面必須是雙方已知的話題，而「誰」正是未知才要問的。「を」接動作對象、「に」表時間或方向、「で」表動作場所，都放不進主語的位置。"
  },
  {
    id: "pattern-starter-particles-005",
    patternId: "starter-particles",
    promptText: "そこに いぬ___ います。",
    hintZh: "告訴對方你發現了什麼。",
    promptContextZh: "「那裡有一隻狗。」",
    expectedAnswer: "が",
    options: ["が", "を", "へ", "で"],
    explanation:
      "用「います／あります」說「有什麼東西存在」時，第一次提到的東西用「が」。「を」接動作對象，但「います」不是動作；「へ」表方向；「いぬで います」則不成句——「〜でいます」只接「元気でいます」這種狀態說法。"
  },
  {
    id: "pattern-starter-particles-006",
    patternId: "starter-particles",
    promptText: "よる、ほん___ よみます。",
    hintZh: "說晚上的活動。",
    promptContextZh: "「晚上讀書（看書）。」",
    expectedAnswer: "を",
    options: ["を", "が", "に", "へ"],
    explanation:
      "「ほん」是「よみます（閱讀）」的對象 →「を」。「が」標記主語（做動作的人），書不是做動作的一方；「に」表時間點或方向、「へ」只表方向，接不上「讀」的對象。"
  },
  {
    id: "pattern-starter-particles-007",
    patternId: "starter-particles",
    promptText: "あした、わたしは ともだち___ はなします。",
    hintZh: "說自己明天的計畫。",
    promptContextZh: "「明天我和朋友說話（聊天）。」",
    expectedAnswer: "と",
    options: ["と", "を", "が", "へ"],
    explanation:
      "「はなします」的交談對象用「と」——聊天是互相進行的。主語已經是「わたしは」，所以「が」放不進去；「を」不能標交談的對象，它標「說出的內容」（如：にほんごを はなします）；「へ」表方向。※「ともだちに はなします」也說得通，但語感是單方向「對朋友說」，這題選項中用「と」。"
  },
  {
    id: "pattern-starter-particles-008",
    patternId: "starter-particles",
    promptText: "いえ___ ごはんを たべます。",
    hintZh: "說吃飯的地點。",
    promptContextZh: "「在家吃飯。」",
    expectedAnswer: "で",
    options: ["で", "に", "を", "へ"],
    explanation:
      "「做動作的場所」用「で」——在家「吃」是一個動作。「に」表存在的場所或目的地（いえに います、いえに かえります），配動作動詞的場所要用「で」。這是に／で最重要的分工。"
  }
];

// ===========================================================================
// Pattern 1: te-kudasai -- request / permission / prohibition family
//   Correct answers cluster around てください / てもいい / てはいけない.
//   Items mix all three so the learner has to read context.
// ===========================================================================
const TE_KUDASAI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-te-kudasai-001",
    patternId: "te-kudasai",
    promptText: "上司から：「来週までに資料を ___ 。」",
    hintZh: "上司對下屬指示工作期限。",
    promptContextZh: "上司對下屬：「下週前把資料交出來。」",
    expectedAnswer: "提出してください",
    options: [
      "提出してください",
      "提出してもいいです",
      "提出してはいけません",
      "提出しなくてもいいです"
    ],
    explanation:
      "上司給下屬的工作指示，是請求 → 「てください」。「てもいい」是徵求／給予許可；「てはいけない」是禁止；「なくてもいい」是不必。"
  },
  {
    id: "pattern-te-kudasai-002",
    patternId: "te-kudasai",
    promptText: "学生から先生に：「すみません、辞書を ___ か？」",
    hintZh: "學生向老師詢問可否動用某物。",
    promptContextZh: "學生問老師：「不好意思，可以用辭典嗎？」",
    expectedAnswer: "使ってもいいです",
    options: [
      "使ってもいいです",
      "使ってください",
      "使ってはいけません",
      "使わなくてもいいです"
    ],
    explanation:
      "尋求許可，配「か」變成疑問 → 「てもいい+か」。「てください」是請對方做、「てはいけません」是禁止、「なくてもいい」是不必。"
  },
  {
    id: "pattern-te-kudasai-003",
    patternId: "te-kudasai",
    promptText: "図書館の貼り紙：「館内で食べ物を ___ 。」",
    hintZh: "圖書館關於館內飲食的告示。",
    promptContextZh: "圖書館告示：「館內請勿飲食。」",
    expectedAnswer: "食べてはいけません",
    options: [
      "食べてはいけません",
      "食べてもいいです",
      "食べてください",
      "食べなくてもいいです"
    ],
    explanation:
      "公共場合的禁止規定 → 「てはいけません」。「てもいい」是允許；「てください」是請對方做；「なくてもいい」是不必。"
  },
  {
    id: "pattern-te-kudasai-004",
    patternId: "te-kudasai",
    promptText: "電車の中で友達に：「もう少し小さい声で ___ ね。」",
    hintZh: "電車內就音量大小對朋友說話。",
    promptContextZh: "電車內提醒朋友：「請小聲一點喔。」",
    expectedAnswer: "話してください",
    options: [
      "話してください",
      "話してもいいです",
      "話してはいけません",
      "話さなくてもいいです"
    ],
    explanation:
      "朋友間的禮貌請求 → 「てください」（配「ね」緩和語氣）。「てはいけません」對朋友太重；「てもいい」「なくてもいい」與請求語氣不符。"
  },
  {
    id: "pattern-te-kudasai-005",
    patternId: "te-kudasai",
    promptText: "病院で：「お酒は ___ か？」",
    hintZh: "病人就飲酒一事詢問醫生。",
    promptContextZh: "病人問醫生：「可以喝酒嗎？」",
    expectedAnswer: "飲んでもいいです",
    options: [
      "飲んでもいいです",
      "飲んでください",
      "飲んではいけません",
      "飲まなくてもいいです"
    ],
    explanation:
      "病人問醫生「可以」喝酒嗎，是徵求許可 → 「てもいいですか」。「てください」是醫生要病人喝；「てはいけません」是醫生禁止；「なくてもいい」是醫生說可不必喝。"
  },
  {
    id: "pattern-te-kudasai-006",
    patternId: "te-kudasai",
    promptText: "駐車場の看板：「ここに車を ___ 。」",
    hintZh: "停車場的告示牌內容。",
    promptContextZh: "停車場標誌：「禁止停車。」",
    expectedAnswer: "止めてはいけません",
    options: [
      "止めてはいけません",
      "止めてもいいです",
      "止めてください",
      "止めなくてもいいです"
    ],
    explanation:
      "明確的禁止標示 → 「てはいけません」。其他選項分別是允許停（てもいい）、請停（てください）、不必停（なくてもいい）。"
  },
  {
    id: "pattern-te-kudasai-007",
    patternId: "te-kudasai",
    promptText: "店員から客に：「お手数ですが、こちらに名前を ___ 。」",
    hintZh: "店員引導顧客在表單上填寫姓名。",
    promptContextZh: "店員對顧客：「麻煩您在這裡寫名字。」",
    expectedAnswer: "書いてください",
    options: [
      "書いてください",
      "書いてもいいです",
      "書いてはいけません",
      "書かなくてもいいです"
    ],
    explanation:
      "店員客氣請求顧客寫名字 → 「てください」（配「お手数ですが」更禮貌）。其他選項都不符合「請對方做」的語氣。"
  },
  {
    id: "pattern-te-kudasai-008",
    patternId: "te-kudasai",
    promptText: "母から子に：「危ないから、火に ___ 。」",
    hintZh: "母親對小孩關於火的安全話。",
    promptContextZh: "母親對小孩：「危險，不准碰火。」",
    expectedAnswer: "触ってはいけません",
    options: [
      "触ってはいけません",
      "触ってもいいです",
      "触ってください",
      "触らなくてもいいです"
    ],
    explanation:
      "保護孩子的安全警告 → 強烈禁止「てはいけません」。其他選項分別是允許、請求、不必。"
  }
];

// ===========================================================================
// Pattern 2: nakute-mo-ii -- "no need to" vs "must" vs "must not"
//   Tests when the situation calls for permission to skip an action,
//   versus an obligation that can't be skipped.
// ===========================================================================
const NAKUTE_MO_II_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-nakute-mo-ii-001",
    patternId: "nakute-mo-ii",
    promptText: "もう熱が下がったから、明日は薬を ___ 。",
    hintZh: "退燒後的服藥判斷。",
    promptContextZh: "燒已經退了，明天可以不必吃藥了。",
    expectedAnswer: "飲まなくてもいい",
    options: [
      "飲まなくてもいい",
      "飲まなければならない",
      "飲んではいけない",
      "飲んでもいい"
    ],
    explanation:
      "前因「熱が下がった」(已退燒)，後句表「不必再吃」→ 「なくてもいい」。「なければならない」是「必須」（情境相反）；「てはいけない」是「不可」（醫療上不對）；「てもいい」是「可以喝」（語意太弱）。"
  },
  {
    id: "pattern-nakute-mo-ii-002",
    patternId: "nakute-mo-ii",
    promptText: "明日は試験があるから、今日は早く ___ 。",
    hintZh: "考試前夜的就寢安排。",
    promptContextZh: "明天有考試，今天必須早睡。",
    expectedAnswer: "寝なければならない",
    options: [
      "寝なければならない",
      "寝なくてもいい",
      "寝てはいけない",
      "寝てもいい"
    ],
    explanation:
      "前句「試験がある」是強烈動機 → 「必須早睡」用「なければならない」。「なくてもいい」是不必；「てはいけない」是禁止；「てもいい」語感太弱。"
  },
  {
    id: "pattern-nakute-mo-ii-003",
    patternId: "nakute-mo-ii",
    promptText: "土日はオフィスに ___ 。",
    hintZh: "週末是否進公司。",
    promptContextZh: "週末不必到辦公室上班。",
    expectedAnswer: "来なくてもいいです",
    options: [
      "来なくてもいいです",
      "来なければなりません",
      "来てはいけません",
      "来てください"
    ],
    explanation:
      "「土日」表休假日，自然語意是「不必來」→ 「なくてもいい」。「なければならない」是必須；「てはいけない」是禁止來；「てください」是請求來。"
  },
  {
    id: "pattern-nakute-mo-ii-004",
    patternId: "nakute-mo-ii",
    promptText: "免許を持っていれば、車を ___ 。",
    hintZh: "駕照與開車的關係。",
    promptContextZh: "有駕照的話，就可以開車。",
    expectedAnswer: "運転してもいい",
    options: [
      "運転してもいい",
      "運転しなくてもいい",
      "運転しなければならない",
      "運転してはいけない"
    ],
    explanation:
      "「免許を持っていれば」是條件，後句表「在此條件下就獲得許可」→ 「てもいい」。「なくてもいい」是「不必開」；「なければならない」是「必須開」；「てはいけない」是「不可開」（與前句矛盾）。"
  },
  {
    id: "pattern-nakute-mo-ii-005",
    patternId: "nakute-mo-ii",
    promptText: "病気の時は、無理して仕事に ___ 。",
    hintZh: "生病時對上班的建議。",
    promptContextZh: "生病的時候不必勉強來上班。",
    expectedAnswer: "来なくてもいいです",
    options: [
      "来なくてもいいです",
      "来なければなりません",
      "来てはいけません",
      "来てもいいです"
    ],
    explanation:
      "「無理して」帶有負面色彩，後句語意是「不必勉強」→ 「なくてもいい」。「なければならない」是「必須來」（反向）；「てはいけない」是「不可來」；「てもいい」是「可以來」。"
  },
  {
    id: "pattern-nakute-mo-ii-006",
    patternId: "nakute-mo-ii",
    promptText: "図書館では本を借りる時、お金を ___ 。",
    hintZh: "圖書館借書的費用。",
    promptContextZh: "在圖書館借書時不必付錢。",
    expectedAnswer: "払わなくてもいい",
    options: [
      "払わなくてもいい",
      "払わなければならない",
      "払ってはいけない",
      "払ってもいい"
    ],
    explanation:
      "圖書館借書通常免費 → 「不必付」用「なくてもいい」。「なければならない」是「必須付」；「てはいけない」是「不可付」（沒道理）；「てもいい」是「可以付」（語意弱）。"
  },
  {
    id: "pattern-nakute-mo-ii-007",
    patternId: "nakute-mo-ii",
    promptText: "授業が始まる前に、必ず教科書を ___ 。",
    hintZh: "上課前的書本準備。",
    promptContextZh: "上課前一定要準備好教科書。",
    expectedAnswer: "準備しなければならない",
    options: [
      "準備しなければならない",
      "準備しなくてもいい",
      "準備してはいけない",
      "準備してもいい"
    ],
    explanation:
      "「必ず」(一定要) 直接指出強烈義務 → 「なければならない」。其他選項與「必ず」的強制感不合。"
  },
  {
    id: "pattern-nakute-mo-ii-008",
    patternId: "nakute-mo-ii",
    promptText: "このパーティーはカジュアルだから、ドレスコードは特になく、スーツを ___ 。",
    hintZh: "輕鬆派對的服裝判斷。",
    promptContextZh: "派對是輕鬆場合，沒有特別的服裝要求，不必穿西裝。",
    expectedAnswer: "着なくてもいい",
    options: [
      "着なくてもいい",
      "着なければならない",
      "着てはいけない",
      "着るしかない"
    ],
    explanation:
      "「ドレスコードは特になく」(沒有特別服裝要求) 是強烈的「不必」信號 → 「なくてもいい」。「なければならない」「着るしかない」是「必須／只能穿」（與前句衝突）；「てはいけない」是「不可穿」（過度禁止）。"
  }
];

// ===========================================================================
// Pattern 3: te-morau -- giving/receiving favours (授受表現)
//   The crux is "whose perspective": あげる (I → other), くれる (other → me),
//   もらう (I ask someone to do).
//   Distractors include いただく / くださる (humble / honorific) so register
//   discrimination is also exercised.
// ===========================================================================
const TE_MORAU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-te-morau-001",
    patternId: "te-morau",
    promptText: "妹は宿題が分からなかったので、私は妹に教えて ___ 。",
    hintZh: "妹妹有學業困難時與我之間的互動。",
    promptContextZh: "妹妹不會作業，我教了她。",
    expectedAnswer: "あげた",
    options: ["あげた", "くれた", "もらった", "いただいた"],
    explanation:
      "「我」對下位的妹妹做 → 「てあげる」。「てくれる」是別人為我做；「てもらう」是我請別人做；「ていただく」是「てもらう」的謙讓。"
  },
  {
    id: "pattern-te-morau-002",
    patternId: "te-morau",
    promptText: "重い荷物だったから、友達が空港まで運んで ___ 。",
    hintZh: "重行李與機場接送時和朋友的互動。",
    promptContextZh: "因為行李太重，朋友幫我搬到機場。",
    expectedAnswer: "くれた",
    options: ["くれた", "あげた", "もらった", "差し上げた"],
    explanation:
      "別人（朋友）為我做 → 「てくれる」。「てあげる」是我為別人做；「てもらう」需要「に」標記做事者；「差し上げる」是「あげる」的謙讓語，用於我方對上位者做（朋友是平輩，不適用）。"
  },
  {
    id: "pattern-te-morau-003",
    patternId: "te-morau",
    promptText: "先生は私の作文を丁寧に直して ___ 。",
    hintZh: "老師處理我作文的方式。",
    promptContextZh: "老師仔細地幫我改了作文。",
    expectedAnswer: "くださった",
    options: ["くださった", "あげた", "もらった", "差し上げた"],
    explanation:
      "上位（老師）為「我」做 → 「てくださる」（「てくれる」的尊敬）。「てあげる」是我為別人做；「てもらう」需 我に老師 結構；「差し上げる」是我對上位做。"
  },
  {
    id: "pattern-te-morau-004",
    patternId: "te-morau",
    promptText: "兄に頼んで、東京駅まで送って ___ 。",
    hintZh: "我與兄長之間關於送站的安排。",
    promptContextZh: "我請哥哥送我到東京車站。",
    expectedAnswer: "もらった",
    options: ["もらった", "くれた", "あげた", "くださった"],
    explanation:
      "「兄に頼んで」表示「我主動請」→ 「てもらう」。「てくれる」是別人主動；「てあげる」是我對別人做；「てくださる」是上位主動。"
  },
  {
    id: "pattern-te-morau-005",
    patternId: "te-morau",
    promptText: "道に迷っている子供がいたので、駅まで案内して ___ 。",
    hintZh: "為迷路的小孩帶路到車站。",
    promptContextZh: "有個小孩在路上迷路了，我帶他到車站。",
    expectedAnswer: "あげた",
    options: ["あげた", "くれた", "もらった", "差し上げた"],
    explanation:
      "「我」對晚輩（小孩）做善行 → 「てあげる」。「てくれる」是別人為我（×方向相反）；「てもらう」是我請別人做（×）；「差し上げる」是「あげる」的謙讓語（我方對上位者做事時用），對一般小孩不自然（×）。唯「あげた」自然。"
  },
  {
    id: "pattern-te-morau-006",
    patternId: "te-morau",
    promptText: "母が毎朝、お弁当を作って ___ 。",
    hintZh: "母親每天為家人準備便當。",
    promptContextZh: "媽媽每天早上幫我做便當。",
    expectedAnswer: "くれる",
    options: ["くれる", "あげる", "もらう", "くださる"],
    explanation:
      "家人（母）為「我」做 → 「てくれる」（家人不用敬語）。「てあげる」是我為別人做；「てもらう」是主動請別人；「てくださる」對自家人過於敬重。"
  },
  {
    id: "pattern-te-morau-007",
    patternId: "te-morau",
    promptText: "課長に、来週の会議の資料を見て ___ つもりです。",
    hintZh: "下週會議資料與課長的安排。",
    promptContextZh: "我打算請課長看一下下週的會議資料。",
    expectedAnswer: "いただく",
    options: ["いただく", "もらう", "くださる", "くれる"],
    explanation:
      "上位（課長）為「我」做、且我主動請求 → 「ていただく」（「てもらう」的謙讓語）。「てもらう」對上位欠禮；「てくださる」是上位主動為我做、不配「に」；「てくれる」對上位太隨意。"
  },
  {
    id: "pattern-te-morau-008",
    patternId: "te-morau",
    promptText: "子供たちに本を読んで ___ のは、毎晩の楽しみだ。",
    hintZh: "每晚與孩子們的閱讀時光。",
    promptContextZh: "每晚為孩子們讀書是我的樂趣。",
    expectedAnswer: "あげる",
    options: ["あげる", "くれる", "もらう", "差し上げる"],
    explanation:
      "「我」對下位的孩子做 → 「てあげる」。「てくれる」是別人為我做；「てもらう」是請別人做；「差し上げる」對上位用，對孩子過度。"
  }
];

// ===========================================================================
// Pattern 4: to-omou -- indirect quote / opinion / direct quote
//   The hard distinctions: と vs って, plain vs polite form inside the
//   quote, presence/absence of だ after na-adj/noun.
// ===========================================================================
const TO_OMOU_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-to-omou-001",
    patternId: "to-omou",
    promptText: "彼は明日試験がある ___ 言った。",
    hintZh: "他關於明天考試的話。",
    promptContextZh: "他說明天有考試。",
    expectedAnswer: "と",
    options: ["と", "が", "に", "で"],
    explanation:
      "間接引用內容後接「と言う」的「と」是引用助詞。「が」標記主語；「に」標記方向或對象；「で」標記方法或場所。四個都是助詞，但只有「と」能標記引用內容（口語可改說「って」）。"
  },
  {
    id: "pattern-to-omou-002",
    patternId: "to-omou",
    promptText: "明日は雨が ___ と思います。",
    hintZh: "對明天天氣的猜測。",
    promptContextZh: "我覺得明天會下雨。",
    expectedAnswer: "降る",
    options: ["降る", "降ります", "降りだ", "降って"],
    explanation:
      "間接引用 / 意見前接「普通形」→ 「降る」。「降ります」是ます形（×和「と思う」混用）；「降りだ」不存在；「降って」是 て形（不能接「と思う」）。"
  },
  {
    id: "pattern-to-omou-003",
    patternId: "to-omou",
    promptText: "彼は明日北海道に ___ と思っているらしい。",
    hintZh: "他對於去北海道一事的打算。",
    promptContextZh: "聽說他打算明天去北海道。",
    expectedAnswer: "行く",
    options: ["行く", "行きます", "行った", "行って"],
    explanation:
      "「と思う」前接普通形 → 「行く」(普通形・非過去肯定)。「行きます」是ます形（×間接引用 / と思う）；「行った」是過去式（與「明日」未來感衝突）；「行って」是 て形（不能直接接と）。"
  },
  {
    id: "pattern-to-omou-004",
    patternId: "to-omou",
    promptText: "この問題はとても ___ と思う。",
    hintZh: "對這個問題難度的判斷。",
    promptContextZh: "我覺得這個問題很難。",
    expectedAnswer: "難しい",
    options: ["難しい", "難しいだ", "難しく", "難しくて"],
    explanation:
      "意見句中的「と思う」前接 い形容詞 → 直接接「難しい」（い形容詞本身就是普通形）。「難しいだ」是錯（い形不加だ）；「難しく」「難しくて」是其他變化形。"
  },
  {
    id: "pattern-to-omou-005",
    patternId: "to-omou",
    promptText: "妹は新しい服を ___ と言った。",
    hintZh: "妹妹關於新衣服的話。",
    promptContextZh: "妹妹說想要新衣服。",
    expectedAnswer: "買いたい",
    options: ["買いたい", "買いたいです", "買いたいだ", "買って"],
    explanation:
      "間接引用「妹妹的願望」→ 接普通形「買いたい」(たい 本身就是い形容詞)。「買いたいです」是 ですます體（與と言った 混用較少見）；「買いたいだ」不存在；「買って」是 て形。"
  },
  {
    id: "pattern-to-omou-006",
    patternId: "to-omou",
    promptText: "兄は今、駅前にいる ___ 言ってた。",
    hintZh: "哥哥剛才提到的所在位置。",
    promptContextZh: "哥哥剛才說他現在在車站前。",
    expectedAnswer: "って",
    options: ["って", "は", "が", "で"],
    explanation:
      "「って」是「と」的口語簡縮，與「言ってた」(言っていた 的口語) 搭配自然。「は」是話題助詞、「が」是主語助詞、「で」是方法／場所助詞，皆不能標記引用內容。"
  },
  {
    id: "pattern-to-omou-007",
    patternId: "to-omou",
    promptText: "あの店は ___ と思う。",
    hintZh: "對那家店氛圍的看法。",
    promptContextZh: "我覺得那家店很安靜。",
    expectedAnswer: "静かだ",
    options: ["静かだ", "静か", "静かで", "静かに"],
    explanation:
      "な形容詞做普通形句尾需加「だ」→ 「静かだ」。「静か」少了だ（×）；「静かで」是 て形（不能直接接と思う）；「静かに」是修飾形（要接動詞）。"
  },
  {
    id: "pattern-to-omou-008",
    patternId: "to-omou",
    promptText: "私はあの人がきっと ___ と思う。",
    hintZh: "關於那個人身分的推測。",
    promptContextZh: "我覺得那個人一定是學生。",
    expectedAnswer: "学生だ",
    options: ["学生だ", "学生な", "学生で", "学生の"],
    explanation:
      "名詞用普通形結尾接「と思う」需要加「だ」→ 「学生だ」。「学生な」是な形容詞的連體形（名詞沒有な-form，無效）；「学生で」是 て形（不能直接接と）；「学生の」是所有格（接名詞，不能直接接と思う）。"
  }
];

// ===========================================================================
// Pattern 5: mae-ato -- ordering of two actions (まえに / あとで / てから).
//   The scene fixes the time order; distractors are the same verb in the
//   other forms, which become temporally impossible (e.g. "after leaving"
//   can't lock the home door).
// ===========================================================================
const MAE_ATO_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-mae-ato-001",
    patternId: "mae-ato",
    promptText: "会社へ ___ 、家のかぎをかけました。",
    hintZh: "早上要出門上班，人還站在玄關，準備踏出家門。",
    promptContextZh: "去公司之前，鎖上了家裡的門。",
    expectedAnswer: "行くまえに",
    options: ["行くまえに", "行ってから", "行ったあとで", "行ったとき"],
    explanation:
      "鎖自家門一定發生在離開家以前，「Vるまえに」表示在某動作發生『以前』先做另一件事。「行ってから」「行ったあとで」「行ったとき」都表示人已離開或到了公司，無法再鎖自家門、時間矛盾。"
  },
  {
    id: "pattern-mae-ato-002",
    patternId: "mae-ato",
    promptText: "手を ___ 、ケーキを食べてください。",
    hintZh: "小朋友剛從外面玩回來，手有點髒，桌上放著要吃的蛋糕。",
    promptContextZh: "把手洗乾淨後再吃蛋糕。",
    expectedAnswer: "あらってから",
    options: ["あらってから", "あらうまえに", "あらうとき", "あらいながら"],
    explanation:
      "句意是把手洗好、緊接著去吃，「Vてから」表示前項做完『再』接著做後項。「あらうまえに」是手還沒洗就先吃、不衛生；「あらうとき」「あらいながら」變成一邊洗手一邊吃、不合理。"
  },
  {
    id: "pattern-mae-ato-003",
    patternId: "mae-ato",
    promptText: "電車に ___ 、ホームでパンを買いました。",
    hintZh: "在車站月台上，列車還沒進站，肚子有點餓所以走到小賣店。",
    promptContextZh: "上電車之前，在月台上買了麵包。",
    expectedAnswer: "乗るまえに",
    options: ["乗るまえに", "乗ってから", "乗ったあとで", "乗ったとき"],
    explanation:
      "在月台買麵包一定發生在上車以前，「Vるまえに」表示在動作發生前先做某事。「乗ってから」「乗ったあとで」「乗ったとき」都表示人已在車上，無法回月台買、時間矛盾。"
  },
  {
    id: "pattern-mae-ato-004",
    patternId: "mae-ato",
    promptText: "ごはんを ___ 、すぐ歯をみがきましょう。",
    hintZh: "一家人剛吃完晚餐，碗盤還在桌上，媽媽提醒孩子下一件該做的事。",
    promptContextZh: "吃完飯後，馬上去刷牙吧。",
    expectedAnswer: "食べたあとで",
    options: ["食べたあとで", "食べるまえに", "食べるとき", "食べながら"],
    explanation:
      "刷牙是用餐『完成後』做的事，「Vたあとで」表示某動作做完後再做別的，配合「すぐ（馬上）」。「食べるまえに」是用餐前刷牙、時間相反；「食べるとき」「食べながら」變成一邊吃一邊刷、不合理。"
  }
];

// ===========================================================================
// Pattern 6: nagara-tari -- linking actions (ながら同時 / たり列舉 / て順接 /
//   し加理由). The context decides which link fits; the distractors are the
//   other three links, which give a different (wrong) meaning here.
// ===========================================================================
const NAGARA_TARI_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-nagara-tari-001",
    patternId: "nagara-tari",
    promptText: "最近は天気が ___ 、寒かったりして、体によくない。",
    hintZh: "最近天氣很不穩定，一下子熱、一下子冷，身體有點吃不消。",
    promptContextZh: "最近天氣一下子熱、一下子冷，對身體不好。",
    expectedAnswer: "暑かったり",
    options: ["暑かったり", "暑くて", "暑いし", "暑いと"],
    explanation:
      "後句「寒かったりして」已用「たり」，前後成對舉出『忽冷忽熱』兩種交替狀態，用「Aたり、Bたり」。「暑くて」是接續、「暑いし」是加理由、「暑いと」是條件，都無法與後面的「たり」配對表交替。"
  },
  {
    id: "pattern-nagara-tari-002",
    patternId: "nagara-tari",
    promptText: "朝起きて、顔を ___ 、それから会社へ行きます。",
    hintZh: "敘述早上起床後到出門上班之間，依時間先後完成的固定流程。",
    promptContextZh: "早上起床，洗了臉，然後再去公司。",
    expectedAnswer: "洗って",
    options: ["洗って", "洗いながら", "洗ったり", "洗うし"],
    explanation:
      "句中「それから」標示『先洗臉、再出門』的時間順序，動作接續用「て」。「洗いながら」是同時做、「洗ったり」是舉例、「洗うし」是補理由，都不表先後。"
  },
  {
    id: "pattern-nagara-tari-003",
    patternId: "nagara-tari",
    promptText: "この店は安い ___ 、料理もおいしいから、よく来ます。",
    hintZh: "說明一家店令人常常光顧，背後不只一個原因的情況。",
    promptContextZh: "這家店又便宜，菜也好吃，所以我常來。",
    expectedAnswer: "し",
    options: ["し", "ながら", "たり", "て"],
    explanation:
      "句尾「〜から、よく来ます」在堆疊「便宜」「好吃」兩個原因，用「し」。「ながら」「たり」「て」都不是在加列原因；且「安い」是形容詞，後三者也接不上。"
  },
  {
    id: "pattern-nagara-tari-004",
    patternId: "nagara-tari",
    promptText: "弟は歩き ___ スマホを見るので、よく人にぶつかります。",
    hintZh: "描述弟弟走路時眼睛沒離開手機螢幕，因此常出狀況。",
    promptContextZh: "弟弟走著路就看手機，所以常常撞到人。",
    expectedAnswer: "ながら",
    options: ["ながら", "たり", "て", "し"],
    explanation:
      "「走路」與「看手機」由同一人同時並行進行，用「ながら」（接ます形語幹「歩き」）。「たり」是舉例、「て」會變成先走完再看、「し」是補理由，都不符。"
  },
  {
    id: "pattern-nagara-tari-005",
    patternId: "nagara-tari",
    promptText: "デパートでくつを買って、ごはんを ___ 帰りました。",
    hintZh: "敘述在百貨公司辦完幾件事後才返家的一連串行程。",
    promptContextZh: "在百貨公司買了鞋，吃了飯，然後就回家了。",
    expectedAnswer: "食べて",
    options: ["食べて", "食べたり", "食べながら", "食べるし"],
    explanation:
      "前面「買って」已用接續形，整句是「買鞋→吃飯→回家」的時間順序，用「て」。「食べたり」是舉例、「食べながら」是同時、「食べるし」是補理由，都接不上這條時間線。"
  },
  {
    id: "pattern-nagara-tari-006",
    patternId: "nagara-tari",
    promptText: "今日は天気もいい ___ 、宿題も終わったから、公園で遊びましょう。",
    hintZh: "提議去公園玩之前，先擺出好幾項對自己有利的條件。",
    promptContextZh: "今天天氣又好，作業也做完了，所以去公園玩吧。",
    expectedAnswer: "し",
    options: ["し", "ながら", "たり", "で"],
    explanation:
      "句中「〜から、遊びましょう」前接「天氣好」「作業做完」兩個有利原因，用「し」。「ながら」是同時、「たり」是舉例、「で」是中止接續，都不是在加列原因；且「いい」是形容詞，後三者也接不上。"
  }
];

// ===========================================================================
// Pattern 7: te-aux -- て + auxiliary verb (てみる試 / ている狀態 / てしまう
//   完了・遺憾). The scene's nuance picks the auxiliary; distractors are the
//   other auxiliaries on the same verb.
// ===========================================================================
const TE_AUX_ITEMS: SentencePatternItem[] = [
  {
    id: "pattern-te-aux-001",
    patternId: "te-aux",
    promptText: "この店、おいしそうだから、今度入っ___。",
    hintZh: "走在街上發現一家從沒去過的餐廳，外觀很不錯，於是對朋友提議下次來這裡。",
    promptContextZh: "這家店看起來很好吃，下次進去吃吃看吧。",
    expectedAnswer: "てみよう",
    options: ["てみよう", "ておこう", "てしまおう", "ている"],
    explanation:
      "對沒去過的店、配合「今度」提出『嘗試一下』的語氣，用表嘗試的「〜てみる」的意向形「てみよう」。「ておこう」是為將來預做準備、「てしまおう」是把某事做完或帶懊悔、「ている」是持續狀態，皆不合。"
  },
  {
    id: "pattern-te-aux-002",
    patternId: "te-aux",
    promptText: "兄は今、となりの部屋でテレビを見___。",
    hintZh: "家人問哥哥人在哪裡，回答的人指向隔壁房間，描述哥哥此刻的動作。",
    promptContextZh: "哥哥現在在隔壁房間看電視。",
    expectedAnswer: "ている",
    options: ["ている", "てみる", "ておく", "てしまう"],
    explanation:
      "「今」加上描述某人此刻持續進行的動作，用表進行的「〜ている」。「てみる」是嘗試、「ておく」是事先準備、「てしまう」是完成或懊悔，都不能表當下持續。"
  },
  {
    id: "pattern-te-aux-003",
    patternId: "te-aux",
    promptText: "あ、ケーキを全部一人で食べ___。ごめん。",
    hintZh: "原本說好要留給家人的蛋糕，自己一回神才發現整個都吃光了，趕緊向對方道歉。",
    promptContextZh: "啊，我一個人把蛋糕全部吃光了，對不起。",
    expectedAnswer: "てしまった",
    options: ["てしまった", "てみた", "ておいた", "ていた"],
    explanation:
      "把該留的蛋糕全吃光並道歉，是非本意、後悔的『完了』，用「〜てしまう」，與「ごめん」相呼應。「てみた」是嘗試、「ておいた」是事先準備、「ていた」是當時狀態，都無法傳達懊悔。"
  },
  {
    id: "pattern-te-aux-004",
    patternId: "te-aux",
    promptText: "この道は、駅までずっと続い___。",
    hintZh: "向問路的人說明眼前這條路的走向，這條路一路通到車站，沿途不會中斷。",
    promptContextZh: "這條路一直延伸到車站。",
    expectedAnswer: "ている",
    options: ["ている", "てみる", "ておく", "てしまう"],
    explanation:
      "配合「ずっと」描述道路目前一路延續到車站的『既成狀態』，用表狀態的「〜ている」。「てみる」是嘗試、「ておく」是事先準備、「てしまう」是完成或懊悔，都無法描述這種延伸狀態。"
  }
];

export const sentencePatternItems: SentencePatternItem[] = [
  ...STARTER_DESU_ITEMS,
  ...STARTER_PARTICLES_ITEMS,
  ...N5_SONZAI_ITEMS,
  ...N5_ICHI_ITEMS,
  ...N5_JOSHI2_ITEMS,
  ...N5_JOSHI3_ITEMS,
  ...TE_KUDASAI_ITEMS,
  ...NAKUTE_MO_II_ITEMS,
  ...TE_MORAU_ITEMS,
  ...TO_OMOU_ITEMS,
  ...MAE_ATO_ITEMS,
  ...NAGARA_TARI_ITEMS,
  ...TE_AUX_ITEMS
];

export type SentencePatternPoolOptions = {
  /**
   * If set, only items with one of these patternIds are returned. If
   * unset, returns the full pool (all four patterns mixed). Designed
   * to share its shape with the upcoming exam-mode id-filter (PR C) so
   * the challenge-page filter state can be the same type.
   */
  patternIds?: SentencePatternId[];
};

export function buildSentencePatternPool(
  options: SentencePatternPoolOptions = {}
): PracticeQuestion[] {
  const { patternIds } = options;
  const filtered = patternIds && patternIds.length > 0
    ? sentencePatternItems.filter((item) => patternIds.includes(item.patternId))
    : sentencePatternItems;
  return filtered.map(toPracticeQuestion);
}

function toPracticeQuestion(item: SentencePatternItem): PracticeQuestion {
  const vocabulary: VocabularyItem = {
    id: item.id,
    surface: item.patternId,
    reading: item.patternId,
    meaningZh: PATTERN_LABEL_ZH[item.patternId],
    partOfSpeech: "noun",
    group: null,
    lesson: null,
    tags: ["sentence_pattern", item.patternId],
    examples: [
      {
        japanese: item.promptText.replace("___", item.expectedAnswer),
        meaningZh: item.promptContextZh,
        // Same source as promptContextZh, so it shares that overlay -- keeps
        // the post-answer example line in the UI language (#400).
        meaningI18n: sentencePatternI18n[item.id]?.promptContextI18n
      }
    ],
    level: "N5"
  };
  const overlay = sentencePatternI18n[item.id];
  return {
    id: item.id,
    vocabulary,
    targetForm: "reading",
    expectedAnswers: [item.expectedAnswer],
    explanation: item.explanation,
    explanationI18n: overlay?.explanationI18n,
    promptLabel: `句型練習：${PATTERN_LABEL_ZH[item.patternId]}`,
    promptText: item.promptText,
    promptContextZh: item.promptContextZh,
    promptContextI18n: overlay?.promptContextI18n,
    hintZh: item.hintZh,
    hintI18n: overlay?.hintI18n,
    instructionZh: "依語境選最自然的句型。",
    instructionI18n: patternInstructionI18n,
    options: item.options
  };
}
