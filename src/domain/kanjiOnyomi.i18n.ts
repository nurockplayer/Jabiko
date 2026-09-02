import type { KanjiOnyomiEntry } from "./kanjiOnyomi";
import type { LocaleCode, LocalizedText } from "./types";
import { pickLocalized } from "./localizedContent";

/**
 * Per-locale overlays for the 漢字讀音 table's Chinese glosses, keyed by the
 * kanji character. Imported by the (lazy) KanjiOnyomiPanel, so it rides in that
 * panel's chunk — never the eager bundle. Only `meaningZh` is overlaid; the
 * readings (on/kun, kana) are Japanese and never touched. Populated by the
 * study-content translation pass (#400).
 *
 * @public — kept exported: scripts/i18n-overlay-audit.mjs and
 * scripts/check-i18n-coverage.mjs resolve this record from the source by name,
 * mirroring the other `*.i18n.ts` overlay exports.
 */
export const kanjiMeaningI18n: Record<string, LocalizedText> = {
  "安": {
    "en": "cheap; at ease",
    "ja": "安い・安心"
  },
  "医": {
    "en": "medicine; doctor",
    "ja": "医・医療"
  },
  "員": {
    "en": "member; staff",
    "ja": "員・人員"
  },
  "飲": {
    "en": "drink",
    "ja": "飲む"
  },
  "院": {
    "en": "institution; hall",
    "ja": "院・機関"
  },
  "雨": {
    "en": "rain",
    "ja": "雨"
  },
  "下": {
    "en": "below; down",
    "ja": "下・下方"
  },
  "歌": {
    "en": "song; sing",
    "ja": "歌・歌う"
  },
  "会": {
    "en": "meet; meeting",
    "ja": "会う・会"
  },
  "開": {
    "en": "open; begin",
    "ja": "開く・開始"
  },
  "学": {
    "en": "study; learning",
    "ja": "学ぶ・学問"
  },
  "帰": {
    "en": "return home",
    "ja": "帰る"
  },
  "気": {
    "en": "spirit; energy",
    "ja": "気・気力"
  },
  "起": {
    "en": "wake; occur",
    "ja": "起きる・起こる"
  },
  "休": {
    "en": "rest",
    "ja": "休む"
  },
  "強": {
    "en": "strong",
    "ja": "強い"
  },
  "教": {
    "en": "teach",
    "ja": "教える"
  },
  "近": {
    "en": "near; nearby",
    "ja": "近い・近く"
  },
  "犬": {
    "en": "dog",
    "ja": "犬"
  },
  "見": {
    "en": "see; look",
    "ja": "見る"
  },
  "元": {
    "en": "origin; source",
    "ja": "元・根源"
  },
  "古": {
    "en": "old; ancient",
    "ja": "古い"
  },
  "校": {
    "en": "school",
    "ja": "学校"
  },
  "考": {
    "en": "think; consider",
    "ja": "考える"
  },
  "行": {
    "en": "go; carry out",
    "ja": "行く・行う"
  },
  "高": {
    "en": "tall; expensive",
    "ja": "高い"
  },
  "作": {
    "en": "make; produce",
    "ja": "作る・製作"
  },
  "使": {
    "en": "use",
    "ja": "使う"
  },
  "始": {
    "en": "begin",
    "ja": "始める"
  },
  "思": {
    "en": "think; feel",
    "ja": "思う"
  },
  "止": {
    "en": "stop",
    "ja": "止まる"
  },
  "持": {
    "en": "hold; have",
    "ja": "持つ"
  },
  "社": {
    "en": "company; shrine",
    "ja": "会社・社"
  },
  "者": {
    "en": "person; one who",
    "ja": "者・人"
  },
  "借": {
    "en": "borrow",
    "ja": "借りる"
  },
  "取": {
    "en": "take; obtain",
    "ja": "取る"
  },
  "住": {
    "en": "live; reside",
    "ja": "住む"
  },
  "書": {
    "en": "write",
    "ja": "書く"
  },
  "小": {
    "en": "small",
    "ja": "小さい"
  },
  "上": {
    "en": "above; up",
    "ja": "上・上方"
  },
  "食": {
    "en": "eat; food",
    "ja": "食べる・食べ物"
  },
  "新": {
    "en": "new",
    "ja": "新しい"
  },
  "人": {
    "en": "person",
    "ja": "人"
  },
  "生": {
    "en": "life; live; be born",
    "ja": "生・生きる・生まれる"
  },
  "先": {
    "en": "ahead; previous",
    "ja": "先"
  },
  "走": {
    "en": "run",
    "ja": "走る"
  },
  "待": {
    "en": "wait",
    "ja": "待つ"
  },
  "貸": {
    "en": "lend",
    "ja": "貸す"
  },
  "大": {
    "en": "big",
    "ja": "大きい"
  },
  "短": {
    "en": "short",
    "ja": "短い"
  },
  "知": {
    "en": "know",
    "ja": "知る"
  },
  "長": {
    "en": "long; length",
    "ja": "長い・長さ"
  },
  "答": {
    "en": "answer",
    "ja": "答える・答え"
  },
  "読": {
    "en": "read",
    "ja": "読む"
  },
  "日": {
    "en": "day; sun",
    "ja": "日・太陽"
  },
  "入": {
    "en": "enter; put in",
    "ja": "入る・入れる"
  },
  "買": {
    "en": "buy",
    "ja": "買う"
  },
  "病": {
    "en": "illness; disease",
    "ja": "病気・病"
  },
  "物": {
    "en": "thing; object",
    "ja": "物"
  },
  "聞": {
    "en": "listen; ask",
    "ja": "聞く"
  },
  "勉": {
    "en": "diligence; effort",
    "ja": "勉・努力"
  },
  "忘": {
    "en": "forget",
    "ja": "忘れる"
  },
  "本": {
    "en": "book; origin",
    "ja": "本・本源"
  },
  "名": {
    "en": "name",
    "ja": "名・名前"
  },
  "友": {
    "en": "friend",
    "ja": "友"
  },
  "来": {
    "en": "come",
    "ja": "来る"
  },
  "立": {
    "en": "stand; establish",
    "ja": "立つ・設立"
  },
  "話": {
    "en": "speak; talk",
    "ja": "話す・話"
  },
  "案": {
    "en": "plan; proposal",
    "ja": "案・提案"
  },
  "育": {
    "en": "raise; nurture",
    "ja": "育てる・育成"
  },
  "運": {
    "en": "carry; luck",
    "ja": "運ぶ・運"
  },
  "覚": {
    "en": "remember; awaken",
    "ja": "覚える・覚醒"
  },
  "角": {
    "en": "corner; angle",
    "ja": "角・角度"
  },
  "楽": {
    "en": "fun; music",
    "ja": "楽しい・音楽"
  },
  "観": {
    "en": "view; observe",
    "ja": "観る・観点"
  },
  "希": {
    "en": "hope; rare",
    "ja": "希望・希少"
  },
  "記": {
    "en": "record; note",
    "ja": "記録・記す"
  },
  "逆": {
    "en": "reverse; opposite",
    "ja": "逆"
  },
  "急": {
    "en": "hurry; urgent",
    "ja": "急ぐ・緊急"
  },
  "求": {
    "en": "seek; demand",
    "ja": "求める"
  },
  "去": {
    "en": "leave; past",
    "ja": "去る・過去"
  },
  "業": {
    "en": "work; studies",
    "ja": "事業・学業"
  },
  "金": {
    "en": "gold; money",
    "ja": "金・お金"
  },
  "苦": {
    "en": "suffering; bitter",
    "ja": "苦しい・苦い"
  },
  "景": {
    "en": "scenery; view",
    "ja": "景色・景観"
  },
  "軽": {
    "en": "light",
    "ja": "軽い"
  },
  "験": {
    "en": "test; experience",
    "ja": "試験・経験"
  },
  "互": {
    "en": "mutual",
    "ja": "互い"
  },
  "向": {
    "en": "face; direction",
    "ja": "向く・方向"
  },
  "工": {
    "en": "work; craft",
    "ja": "工・工芸"
  },
  "才": {
    "en": "talent; years old",
    "ja": "才能・歳"
  },
  "参": {
    "en": "participate; go",
    "ja": "参加・参る"
  },
  "散": {
    "en": "scatter; stroll",
    "ja": "散る・散歩"
  },
  "子": {
    "en": "child",
    "ja": "子・子供"
  },
  "死": {
    "en": "death",
    "ja": "死ぬ"
  },
  "質": {
    "en": "nature; quality",
    "ja": "性質・品質"
  },
  "受": {
    "en": "receive; accept",
    "ja": "受ける"
  },
  "終": {
    "en": "end; finish",
    "ja": "終わる"
  },
  "習": {
    "en": "learn; practice",
    "ja": "習う"
  },
  "集": {
    "en": "gather; collect",
    "ja": "集める"
  },
  "重": {
    "en": "heavy; important",
    "ja": "重い・重要"
  },
  "心": {
    "en": "heart; mind",
    "ja": "心"
  },
  "真": {
    "en": "true; real",
    "ja": "真・本当"
  },
  "親": {
    "en": "parent; intimate",
    "ja": "親・親しい"
  },
  "進": {
    "en": "advance",
    "ja": "進む"
  },
  "性": {
    "en": "nature; gender",
    "ja": "性質・性別"
  },
  "静": {
    "en": "quiet; calm",
    "ja": "静か"
  },
  "切": {
    "en": "cut",
    "ja": "切る"
  },
  "説": {
    "en": "explain; theory",
    "ja": "説明・学説"
  },
  "洗": {
    "en": "wash",
    "ja": "洗う"
  },
  "足": {
    "en": "foot; enough",
    "ja": "足・足りる"
  },
  "続": {
    "en": "continue",
    "ja": "続く・続ける"
  },
  "卒": {
    "en": "graduate; finish",
    "ja": "卒業"
  },
  "転": {
    "en": "turn; fall over",
    "ja": "転がる・転ぶ"
  },
  "度": {
    "en": "times; degree",
    "ja": "回数・程度"
  },
  "内": {
    "en": "inside; within",
    "ja": "内・内側"
  },
  "肉": {
    "en": "meat",
    "ja": "肉"
  },
  "破": {
    "en": "break; tear",
    "ja": "破る・破壊"
  },
  "敗": {
    "en": "defeat; failure",
    "ja": "失敗・敗北"
  },
  "配": {
    "en": "distribute; worry",
    "ja": "配る・心配"
  },
  "白": {
    "en": "white",
    "ja": "白い"
  },
  "発": {
    "en": "depart; occur",
    "ja": "出発・発生"
  },
  "皮": {
    "en": "skin; hide",
    "ja": "皮"
  },
  "夫": {
    "en": "husband",
    "ja": "夫"
  },
  "風": {
    "en": "wind; style",
    "ja": "風・風格"
  },
  "分": {
    "en": "divide; understand",
    "ja": "分ける・分かる"
  },
  "閉": {
    "en": "close; shut",
    "ja": "閉じる"
  },
  "別": {
    "en": "separate; distinguish",
    "ja": "別れる・区別"
  },
  "便": {
    "en": "convenient; mail",
    "ja": "便利・郵便"
  },
  "歩": {
    "en": "walk",
    "ja": "歩く"
  },
  "宝": {
    "en": "treasure; precious",
    "ja": "宝・貴重"
  },
  "法": {
    "en": "law; method",
    "ja": "法律・方法"
  },
  "望": {
    "en": "hope; gaze afar",
    "ja": "希望・眺める"
  },
  "満": {
    "en": "full; fill",
    "ja": "満ちる・満たす"
  },
  "民": {
    "en": "people; nation",
    "ja": "民・人民"
  },
  "無": {
    "en": "nothing; without",
    "ja": "無・無い"
  },
  "明": {
    "en": "bright; clear",
    "ja": "明るい・明らか"
  },
  "問": {
    "en": "ask; question",
    "ja": "問う"
  },
  "有": {
    "en": "have; exist",
    "ja": "有る"
  },
  "予": {
    "en": "beforehand",
    "ja": "予め"
  },
  "様": {
    "en": "appearance; Mr./Ms.",
    "ja": "様子・…様"
  },
  "用": {
    "en": "use; purpose",
    "ja": "用いる・用途"
  },
  "利": {
    "en": "profit; convenience",
    "ja": "利益・便利"
  },
  "旅": {
    "en": "travel",
    "ja": "旅"
  },
  "握": {
    "en": "grasp; grip",
    "ja": "握る"
  },
  "委": {
    "en": "entrust; committee",
    "ja": "委託・委員"
  },
  "易": {
    "en": "easy; trade",
    "ja": "容易・交易"
  },
  "域": {
    "en": "area; region",
    "ja": "区域・領域"
  },
  "印": {
    "en": "seal; mark",
    "ja": "印・記号"
  },
  "引": {
    "en": "pull; lead",
    "ja": "引く・引導"
  },
  "営": {
    "en": "manage; operate",
    "ja": "経営・営む"
  },
  "映": {
    "en": "reflect; project",
    "ja": "映る・映写"
  },
  "演": {
    "en": "perform; act",
    "ja": "演じる・演技"
  },
  "応": {
    "en": "respond; answer",
    "ja": "応じる・応対"
  },
  "横": {
    "en": "sideways; beside",
    "ja": "横・横側"
  },
  "憶": {
    "en": "memory; recollect",
    "ja": "記憶・思う"
  },
  "化": {
    "en": "change; -ization",
    "ja": "変化・化"
  },
  "価": {
    "en": "value; price",
    "ja": "価値・価格"
  },
  "加": {
    "en": "add; increase",
    "ja": "加える・増加"
  },
  "果": {
    "en": "result; fruit",
    "ja": "結果・果実"
  },
  "過": {
    "en": "pass; exceed; spend",
    "ja": "過ぎる・超過・過ごす"
  },
  "画": {
    "en": "picture; plan",
    "ja": "絵画・計画"
  },
  "解": {
    "en": "undo; understand",
    "ja": "解く・理解"
  },
  "悔": {
    "en": "regret",
    "ja": "後悔・悔やむ"
  },
  "械": {
    "en": "machine",
    "ja": "機械"
  },
  "階": {
    "en": "stage; floor",
    "ja": "階段・階"
  },
  "概": {
    "en": "approximate; outline",
    "ja": "大概・概要"
  },
  "格": {
    "en": "status; standard",
    "ja": "格・資格・規格"
  },
  "較": {
    "en": "compare",
    "ja": "比較"
  },
  "滑": {
    "en": "slippery; smooth",
    "ja": "滑る・滑らか"
  },
  "感": {
    "en": "feel; sense",
    "ja": "感じる・感覚"
  },
  "監": {
    "en": "supervise; watch",
    "ja": "監督・監視"
  },
  "関": {
    "en": "relation; barrier",
    "ja": "関係・関所"
  },
  "願": {
    "en": "wish; request",
    "ja": "願い・お願い"
  },
  "危": {
    "en": "dangerous",
    "ja": "危ない・危険"
  },
  "喜": {
    "en": "joy; delight",
    "ja": "喜ぶ・喜び"
  },
  "基": {
    "en": "foundation; basis",
    "ja": "基礎・基本"
  },
  "寄": {
    "en": "draw near; send",
    "ja": "寄る・寄せる"
  },
  "期": {
    "en": "period; term",
    "ja": "期間・時期"
  },
  "機": {
    "en": "machine; chance",
    "ja": "機械・機会"
  },
  "季": {
    "en": "season",
    "ja": "季節"
  },
  "規": {
    "en": "rule; standard",
    "ja": "規則・規定"
  },
  "技": {
    "en": "skill; craft",
    "ja": "技術・技"
  },
  "義": {
    "en": "meaning; justice",
    "ja": "意義・正義"
  },
  "及": {
    "en": "reach; extend to",
    "ja": "及ぶ・波及"
  },
  "究": {
    "en": "research; investigate",
    "ja": "研究・究める"
  },
  "給": {
    "en": "supply; wages",
    "ja": "供給・給料"
  },
  "距": {
    "en": "distance",
    "ja": "距離"
  },
  "供": {
    "en": "provide; offer",
    "ja": "提供・供える"
  },
  "極": {
    "en": "extreme; limit",
    "ja": "極める・極限"
  },
  "禁": {
    "en": "prohibit",
    "ja": "禁止"
  },
  "遇": {
    "en": "encounter; treatment",
    "ja": "遭遇・待遇"
  },
  "係": {
    "en": "relation; in charge",
    "ja": "関係・係"
  },
  "携": {
    "en": "carry; cooperate",
    "ja": "携帯・提携"
  },
  "敬": {
    "en": "respect",
    "ja": "敬う・尊敬"
  },
  "経": {
    "en": "pass through; experience",
    "ja": "経る・経験"
  },
  "計": {
    "en": "calculate; plan",
    "ja": "計算・計画"
  },
  "決": {
    "en": "decide",
    "ja": "決める・決定"
  },
  "結": {
    "en": "tie; form",
    "ja": "結ぶ・結成"
  },
  "健": {
    "en": "healthy; robust",
    "ja": "健康・健やか"
  },
  "賢": {
    "en": "wise; clever",
    "ja": "賢い・賢明"
  },
  "遣": {
    "en": "dispatch; send",
    "ja": "派遣・遣わす"
  },
  "険": {
    "en": "dangerous; steep",
    "ja": "危険・険しい"
  },
  "厳": {
    "en": "strict; solemn",
    "ja": "厳しい・厳格"
  },
  "減": {
    "en": "decrease",
    "ja": "減る・減少"
  },
  "現": {
    "en": "appear; present",
    "ja": "現れる・現在"
  },
  "護": {
    "en": "protect; guard",
    "ja": "保護・守護"
  },
  "興": {
    "en": "rise; interest",
    "ja": "興る・興味"
  },
  "交": {
    "en": "associate; cross",
    "ja": "交わる・交差"
  },
  "公": {
    "en": "public; open",
    "ja": "公共・公開"
  },
  "効": {
    "en": "effect; effective",
    "ja": "効果・効く"
  },
  "康": {
    "en": "health; well-being",
    "ja": "健康・安康"
  },
  "硬": {
    "en": "hard; stiff",
    "ja": "硬い・硬直"
  },
  "合": {
    "en": "join; fit; match",
    "ja": "合う・合わせる・符合"
  },
  "告": {
    "en": "tell; report",
    "ja": "告げる・報告"
  },
  "困": {
    "en": "be troubled; distressed",
    "ja": "困る・困惑"
  },
  "婚": {
    "en": "marriage",
    "ja": "結婚"
  },
  "混": {
    "en": "mix; confusion",
    "ja": "混ぜる・混乱"
  },
  "差": {
    "en": "difference; gap",
    "ja": "差・差異"
  },
  "査": {
    "en": "investigate; inspect",
    "ja": "調査・検査"
  },
  "座": {
    "en": "seat; sit",
    "ja": "座席・座る"
  },
  "採": {
    "en": "adopt; take",
    "ja": "採る・採用"
  },
  "済": {
    "en": "finish; settle; economy",
    "ja": "済む・経済"
  },
  "細": {
    "en": "fine; detailed",
    "ja": "細い・詳細"
  },
  "在": {
    "en": "exist; lie in",
    "ja": "存在・在る"
  },
  "察": {
    "en": "observe; perceive",
    "ja": "観察・察する"
  },
  "算": {
    "en": "calculate; budget",
    "ja": "計算・予算"
  },
  "賛": {
    "en": "approve; agree",
    "ja": "賛成・賛同"
  },
  "司": {
    "en": "manage; take charge",
    "ja": "司る・管理"
  },
  "姿": {
    "en": "figure; appearance",
    "ja": "姿・様子"
  },
  "施": {
    "en": "implement; apply",
    "ja": "実施・施す"
  },
  "視": {
    "en": "see; regard",
    "ja": "見る・視る"
  },
  "試": {
    "en": "try; test",
    "ja": "試す・試験"
  },
  "事": {
    "en": "matter; affair",
    "ja": "事柄・事務"
  },
  "似": {
    "en": "resemble; similar",
    "ja": "似る・類似"
  },
  "治": {
    "en": "govern; cure",
    "ja": "治める・治療"
  },
  "示": {
    "en": "indicate; show",
    "ja": "示す・表示"
  },
  "式": {
    "en": "style; ceremony",
    "ja": "方式・儀式"
  },
  "識": {
    "en": "recognize; knowledge",
    "ja": "認識・知識"
  },
  "失": {
    "en": "lose; loss",
    "ja": "失う・損失"
  },
  "実": {
    "en": "actual; fruit",
    "ja": "実際・果実"
  },
  "謝": {
    "en": "thank; apologize",
    "ja": "感謝・謝る"
  },
  "種": {
    "en": "kind; seed",
    "ja": "種類・種"
  },
  "需": {
    "en": "need; demand",
    "ja": "需要・必要"
  },
  "収": {
    "en": "income; collect",
    "ja": "収入・収める"
  },
  "準": {
    "en": "standard; prepare",
    "ja": "標準・準備"
  },
  "巡": {
    "en": "go around; circulate",
    "ja": "巡る・循環"
  },
  "助": {
    "en": "help; be saved",
    "ja": "助ける・助かる"
  },
  "傷": {
    "en": "wound; injure",
    "ja": "傷・傷つける"
  },
  "招": {
    "en": "invite; invite trouble",
    "ja": "招待・招く"
  },
  "消": {
    "en": "disappear; erase",
    "ja": "消える・消す"
  },
  "焦": {
    "en": "be impatient; scorch",
    "ja": "焦る・焦げる"
  },
  "証": {
    "en": "prove; evidence",
    "ja": "証明・証拠"
  },
  "象": {
    "en": "image; phenomenon; elephant",
    "ja": "形象・現象・象"
  },
  "常": {
    "en": "usual; constant",
    "ja": "普段・常に"
  },
  "情": {
    "en": "emotion; situation",
    "ja": "感情・情況"
  },
  "職": {
    "en": "occupation; duty",
    "ja": "職業・職務"
  },
  "触": {
    "en": "touch; contact",
    "ja": "触れる・接触"
  },
  "信": {
    "en": "believe; trust",
    "ja": "信じる・信頼"
  },
  "審": {
    "en": "examine; judge",
    "ja": "審査・審判"
  },
  "診": {
    "en": "diagnose; examine",
    "ja": "診断・診療"
  },
  "針": {
    "en": "needle; policy",
    "ja": "針・方針"
  },
  "推": {
    "en": "push; infer",
    "ja": "推す・推測"
  },
  "衰": {
    "en": "decline; weaken",
    "ja": "衰える・衰弱"
  },
  "遂": {
    "en": "accomplish; at last",
    "ja": "遂げる・遂に"
  },
  "是": {
    "en": "right; correct",
    "ja": "是・正しい"
  },
  "制": {
    "en": "system; control",
    "ja": "制度・制御"
  },
  "勢": {
    "en": "momentum; power",
    "ja": "勢い・勢力"
  },
  "政": {
    "en": "politics; government",
    "ja": "政治・政事"
  },
  "正": {
    "en": "correct; upright",
    "ja": "正しい・端正"
  },
  "製": {
    "en": "manufacture",
    "ja": "製造"
  },
  "析": {
    "en": "analyze; dissect",
    "ja": "分析・解析"
  },
  "責": {
    "en": "responsibility; blame",
    "ja": "責任・責める"
  },
  "接": {
    "en": "contact; connect",
    "ja": "接触・接続"
  },
  "設": {
    "en": "set up; establish",
    "ja": "設置・設立"
  },
  "節": {
    "en": "joint; season; moderation",
    "ja": "節・季節・節制"
  },
  "潜": {
    "en": "hide; dive in",
    "ja": "潜む・潜入"
  },
  "選": {
    "en": "choose",
    "ja": "選ぶ・選択"
  },
  "善": {
    "en": "good; virtuous",
    "ja": "善・良い"
  },
  "然": {
    "en": "so; natural",
    "ja": "然り・自然"
  },
  "全": {
    "en": "all; complete",
    "ja": "全部・完全"
  },
  "素": {
    "en": "material; plain",
    "ja": "素材・素朴"
  },
  "組": {
    "en": "organize; assemble",
    "ja": "組織・組む"
  },
  "創": {
    "en": "create; found",
    "ja": "創造・創建"
  },
  "想": {
    "en": "think; thought",
    "ja": "想う・思想"
  },
  "操": {
    "en": "operate; manipulate",
    "ja": "操作・操縦"
  },
  "争": {
    "en": "contend; compete",
    "ja": "争う・競争"
  },
  "相": {
    "en": "mutual; appearance",
    "ja": "相互・様相"
  },
  "装": {
    "en": "device; adorn; attire",
    "ja": "装置・装飾・服装"
  },
  "送": {
    "en": "send; transmit",
    "ja": "送る・伝送"
  },
  "遭": {
    "en": "encounter; run into",
    "ja": "遭う・遭遇"
  },
  "像": {
    "en": "image; likeness",
    "ja": "像・映像"
  },
  "増": {
    "en": "increase",
    "ja": "増える・増加"
  },
  "造": {
    "en": "manufacture; build",
    "ja": "製造・建造"
  },
  "則": {
    "en": "rule; law",
    "ja": "規則・法則"
  },
  "息": {
    "en": "breath",
    "ja": "呼吸・息"
  },
  "測": {
    "en": "measure; guess",
    "ja": "測る・推測"
  },
  "属": {
    "en": "belong; attached",
    "ja": "属する・附属"
  },
  "族": {
    "en": "family; tribe",
    "ja": "家族・民族"
  },
  "存": {
    "en": "exist; preserve",
    "ja": "存在・保存"
  },
  "尊": {
    "en": "respect; noble",
    "ja": "尊敬・尊い"
  },
  "打": {
    "en": "hit; strike",
    "ja": "打つ・叩く"
  },
  "対": {
    "en": "toward; opposite",
    "ja": "対・相対"
  },
  "態": {
    "en": "state; attitude",
    "ja": "状態・態度"
  },
  "退": {
    "en": "retreat; withdraw",
    "ja": "退く・退出"
  },
  "託": {
    "en": "entrust; commit",
    "ja": "託す・委託"
  },
  "嘆": {
    "en": "sigh; lament",
    "ja": "嘆く・感嘆"
  },
  "団": {
    "en": "group; body",
    "ja": "団体・集団"
  },
  "断": {
    "en": "cut off; judge; refuse",
    "ja": "断つ・判断・断る"
  },
  "段": {
    "en": "stage; passage",
    "ja": "段階・段落"
  },
  "地": {
    "en": "land; place",
    "ja": "土地・地方"
  },
  "致": {
    "en": "cause; bring about",
    "ja": "致す・招致"
  },
  "着": {
    "en": "wear; arrive",
    "ja": "着る・到着"
  },
  "仲": {
    "en": "relations; mediate",
    "ja": "仲・仲介"
  },
  "注": {
    "en": "pour; pay attention",
    "ja": "注ぐ・注意"
  },
  "張": {
    "en": "spread; assert; stretch",
    "ja": "張る・主張・伸張"
  },
  "調": {
    "en": "investigate; adjust",
    "ja": "調査・調整"
  },
  "定": {
    "en": "decide; fix",
    "ja": "決定・固定"
  },
  "底": {
    "en": "bottom; thorough",
    "ja": "底・徹底"
  },
  "抵": {
    "en": "resist; roughly",
    "ja": "抵抗・大抵"
  },
  "程": {
    "en": "degree; process",
    "ja": "程度・過程"
  },
  "適": {
    "en": "suit; appropriate",
    "ja": "適合・適当"
  },
  "添": {
    "en": "attach; add",
    "ja": "添付・添える"
  },
  "伝": {
    "en": "convey; transmit",
    "ja": "伝える・伝達"
  },
  "努": {
    "en": "strive; make effort",
    "ja": "努力・努める"
  },
  "倒": {
    "en": "fall; knock down",
    "ja": "倒れる・倒す"
  },
  "投": {
    "en": "throw",
    "ja": "投げる・投擲"
  },
  "等": {
    "en": "and so on; equal",
    "ja": "等・等しい"
  },
  "統": {
    "en": "unify; system",
    "ja": "統一・系統"
  },
  "動": {
    "en": "move; motion",
    "ja": "移動・動作"
  },
  "督": {
    "en": "urge; supervise",
    "ja": "督促・監督"
  },
  "任": {
    "en": "duty; appoint",
    "ja": "任務・委任"
  },
  "認": {
    "en": "admit; approve",
    "ja": "承認・認可"
  },
  "念": {
    "en": "thought; idea",
    "ja": "念・概念"
  },
  "悩": {
    "en": "worry; be troubled",
    "ja": "悩む・煩悩"
  },
  "派": {
    "en": "faction; dispatch",
    "ja": "派閥・派遣"
  },
  "廃": {
    "en": "abolish; abandon",
    "ja": "廃止・廃れる"
  },
  "迫": {
    "en": "press; draw near",
    "ja": "迫る・切迫"
  },
  "判": {
    "en": "judge; decide",
    "ja": "判断・判定"
  },
  "反": {
    "en": "opposite; oppose",
    "ja": "反対・反する"
  },
  "否": {
    "en": "deny; no",
    "ja": "否定・否や"
  },
  "比": {
    "en": "compare",
    "ja": "比べる・比較"
  },
  "疲": {
    "en": "tired",
    "ja": "疲れる"
  },
  "費": {
    "en": "expense; spend",
    "ja": "費用・消費"
  },
  "非": {
    "en": "non-; not",
    "ja": "非・～でない"
  },
  "備": {
    "en": "prepare; equip",
    "ja": "備える・準備"
  },
  "微": {
    "en": "slight; faint",
    "ja": "微か・微小"
  },
  "美": {
    "en": "beautiful",
    "ja": "美しい"
  },
  "標": {
    "en": "mark; goal",
    "ja": "標識・目標"
  },
  "表": {
    "en": "express; surface; table",
    "ja": "表す・表面・表"
  },
  "評": {
    "en": "evaluate; criticize",
    "ja": "評価・評論"
  },
  "府": {
    "en": "government; prefecture",
    "ja": "政府・府"
  },
  "普": {
    "en": "widespread; ordinary",
    "ja": "普遍・普通"
  },
  "負": {
    "en": "bear; lose; carry",
    "ja": "負担・負ける・負う"
  },
  "払": {
    "en": "pay; brush off",
    "ja": "払う・支払い"
  },
  "並": {
    "en": "line up; side by side",
    "ja": "並べる・並ぶ"
  },
  "保": {
    "en": "keep; protect",
    "ja": "保つ・保護"
  },
  "補": {
    "en": "supplement; make up",
    "ja": "補う・補充"
  },
  "包": {
    "en": "wrap; parcel",
    "ja": "包む・包み"
  },
  "報": {
    "en": "report; repay; news",
    "ja": "報告・報いる・情報"
  },
  "訪": {
    "en": "visit",
    "ja": "訪れる・訪問"
  },
  "防": {
    "en": "prevent; defend",
    "ja": "防ぐ・防御"
  },
  "末": {
    "en": "end; tip",
    "ja": "末・末端"
  },
  "務": {
    "en": "duty; task",
    "ja": "務め・任務"
  },
  "命": {
    "en": "life; command",
    "ja": "命・命令"
  },
  "迷": {
    "en": "be lost; puzzled",
    "ja": "迷う・迷路"
  },
  "面": {
    "en": "face; aspect; surface",
    "ja": "面・方面・表面"
  },
  "門": {
    "en": "gate; field",
    "ja": "門・専門"
  },
  "約": {
    "en": "promise; approximately",
    "ja": "約束・約"
  },
  "訳": {
    "en": "translate; reason",
    "ja": "訳す・訳"
  },
  "油": {
    "en": "oil",
    "ja": "油"
  },
  "優": {
    "en": "excellent; gentle",
    "ja": "優秀・優しい"
  },
  "由": {
    "en": "reason; cause",
    "ja": "理由・由来"
  },
  "誘": {
    "en": "invite; induce",
    "ja": "誘う・誘導"
  },
  "容": {
    "en": "contain; content; appearance",
    "ja": "容れる・内容・容貌"
  },
  "揺": {
    "en": "shake; sway",
    "ja": "揺れる・動揺"
  },
  "陽": {
    "en": "sun; positive",
    "ja": "太陽・陽"
  },
  "抑": {
    "en": "suppress; restrain",
    "ja": "抑える・抑制"
  },
  "頼": {
    "en": "request; rely on",
    "ja": "頼む・頼る"
  },
  "絡": {
    "en": "contact; entwine",
    "ja": "連絡・絡む"
  },
  "理": {
    "en": "reason; arrange",
    "ja": "道理・整理"
  },
  "離": {
    "en": "separate; distance",
    "ja": "離れる・距離"
  },
  "律": {
    "en": "law; rhythm",
    "ja": "法律・規律"
  },
  "略": {
    "en": "omit; strategy",
    "ja": "省略・策略"
  },
  "流": {
    "en": "flow; wash away",
    "ja": "流れる・流す"
  },
  "料": {
    "en": "material; fee",
    "ja": "材料・料金"
  },
  "領": {
    "en": "domain; lead",
    "ja": "領域・領導"
  },
  "類": {
    "en": "kind; similar",
    "ja": "種類・類似"
  },
  "例": {
    "en": "example; for instance",
    "ja": "例・例えば"
  },
  "齢": {
    "en": "age",
    "ja": "年齢"
  },
  "連": {
    "en": "connect; continuous",
    "ja": "連なる・連続"
  },
  "露": {
    "en": "expose; dew",
    "ja": "露出・露"
  },
  "惑": {
    "en": "be puzzled; bewilder",
    "ja": "惑う・困惑"
  },
  "囲": {
    "en": "surround; range",
    "ja": "囲む・範囲"
  },
  "隠": {
    "en": "hide",
    "ja": "隠す"
  },
  "衛": {
    "en": "defend; guard",
    "ja": "防衛・保衛"
  },
  "益": {
    "en": "benefit; profit",
    "ja": "利益・益"
  },
  "円": {
    "en": "circle; yen",
    "ja": "円・日本円"
  },
  "汚": {
    "en": "dirty; pollute",
    "ja": "汚い・汚染"
  },
  "央": {
    "en": "center",
    "ja": "中央"
  },
  "億": {
    "en": "hundred million",
    "ja": "億"
  },
  "我": {
    "en": "I; self",
    "ja": "我・自己"
  },
  "改": {
    "en": "change; correct",
    "ja": "改める・改正"
  },
  "界": {
    "en": "world; boundary",
    "ja": "界・境界"
  },
  "害": {
    "en": "harm; damage",
    "ja": "害・損害"
  },
  "隔": {
    "en": "interval; separate",
    "ja": "間隔・隔てる"
  },
  "革": {
    "en": "reform; leather",
    "ja": "改革・皮革"
  },
  "割": {
    "en": "divide; proportion",
    "ja": "分割・割合"
  },
  "括": {
    "en": "include; bundle",
    "ja": "包括・総括"
  },
  "完": {
    "en": "complete; whole",
    "ja": "完成・完全"
  },
  "干": {
    "en": "interfere; dry",
    "ja": "干渉・干す"
  },
  "緩": {
    "en": "slow; loosen",
    "ja": "緩やか・緩める"
  },
  "還": {
    "en": "return; give back",
    "ja": "返還・還元"
  },
  "議": {
    "en": "discuss; meeting",
    "ja": "議論・会議"
  },
  "喫": {
    "en": "eat/drink; endure",
    "ja": "喫する・喫茶"
  },
  "客": {
    "en": "guest; customer",
    "ja": "客・顧客"
  },
  "脚": {
    "en": "leg",
    "ja": "脚・足"
  },
  "窮": {
    "en": "poverty; extremity",
    "ja": "窮乏・窮める"
  },
  "拒": {
    "en": "refuse",
    "ja": "拒む・拒否"
  },
  "享": {
    "en": "enjoy; receive",
    "ja": "享受・享有"
  },
  "協": {
    "en": "cooperate; harmonize",
    "ja": "協調・協力"
  },
  "恐": {
    "en": "fear; perhaps",
    "ja": "恐れる・恐らく"
  },
  "均": {
    "en": "average; equal",
    "ja": "平均・均等"
  },
  "句": {
    "en": "phrase; sentence",
    "ja": "句・語句"
  },
  "偶": {
    "en": "by chance; spouse",
    "ja": "偶然・配偶"
  },
  "恵": {
    "en": "blessing; wisdom",
    "ja": "恩恵・恵み"
  },
  "継": {
    "en": "succeed; continue",
    "ja": "継ぐ・継続"
  },
  "撃": {
    "en": "attack; strike",
    "ja": "攻撃・打撃"
  },
  "欠": {
    "en": "lack; be absent",
    "ja": "欠ける・欠席"
  },
  "権": {
    "en": "right; power",
    "ja": "権利・権力"
  },
  "幻": {
    "en": "illusion; phantom",
    "ja": "幻覚・幻"
  },
  "限": {
    "en": "limit; bound",
    "ja": "限る・限界"
  },
  "固": {
    "en": "firm; fixed",
    "ja": "固い・固定"
  },
  "誇": {
    "en": "boast; be proud",
    "ja": "誇る・誇り"
  },
  "誤": {
    "en": "mistake",
    "ja": "誤り・誤る"
  },
  "巧": {
    "en": "skillful; clever",
    "ja": "巧み・巧妙"
  },
  "抗": {
    "en": "resist; oppose",
    "ja": "対抗・抵抗"
  },
  "控": {
    "en": "control; refrain",
    "ja": "控える・節制"
  },
  "更": {
    "en": "change; further",
    "ja": "更新・更に"
  },
  "構": {
    "en": "structure; mind",
    "ja": "構造・構う"
  },
  "航": {
    "en": "navigate; sail",
    "ja": "航行・航海"
  },
  "衡": {
    "en": "balance; weigh",
    "ja": "均衡・衡量"
  },
  "骨": {
    "en": "bone",
    "ja": "骨"
  },
  "災": {
    "en": "disaster; calamity",
    "ja": "災害・災難"
  },
  "削": {
    "en": "cut down; delete",
    "ja": "削減・削除"
  },
  "策": {
    "en": "plan; measure",
    "ja": "策略・対策"
  },
  "擦": {
    "en": "rub; scrub",
    "ja": "摩擦・擦る"
  },
  "殺": {
    "en": "kill",
    "ja": "殺す・殺害"
  },
  "雑": {
    "en": "messy; mixed",
    "ja": "雑・混雑"
  },
  "暫": {
    "en": "temporarily",
    "ja": "暫く"
  },
  "残": {
    "en": "remain; leftover",
    "ja": "残る・残留"
  },
  "旨": {
    "en": "gist; purport",
    "ja": "主旨・趣旨"
  },
  "慈": {
    "en": "affection; mercy",
    "ja": "慈愛・慈悲"
  },
  "趣": {
    "en": "taste; purport",
    "ja": "趣味・趣旨"
  },
  "周": {
    "en": "surroundings; perimeter",
    "ja": "周囲・周辺"
  },
  "愁": {
    "en": "grief; sorrow",
    "ja": "憂愁・哀愁"
  },
  "拾": {
    "en": "pick up; gather",
    "ja": "拾う・拾得"
  },
  "縮": {
    "en": "shrink; contract",
    "ja": "縮む・収縮"
  },
  "熟": {
    "en": "ripen; master",
    "ja": "成熟・熟練"
  },
  "純": {
    "en": "pure; simple",
    "ja": "純粋・単純"
  },
  "遵": {
    "en": "obey; follow",
    "ja": "遵守・遵法"
  },
  "順": {
    "en": "order; obey",
    "ja": "順序・従順"
  },
  "序": {
    "en": "order; sequence",
    "ja": "順序・次序"
  },
  "除": {
    "en": "remove; exclude",
    "ja": "除く・排除"
  },
  "償": {
    "en": "compensate; atone",
    "ja": "賠償・補償"
  },
  "昇": {
    "en": "rise; be promoted",
    "ja": "上昇・昇進"
  },
  "渉": {
    "en": "interfere; negotiate",
    "ja": "干渉・交渉"
  },
  "詳": {
    "en": "detailed",
    "ja": "詳しい・詳細"
  },
  "状": {
    "en": "condition; shape",
    "ja": "状態・形状"
  },
  "蒸": {
    "en": "steam; evaporate",
    "ja": "蒸す・蒸発"
  },
  "譲": {
    "en": "yield; transfer",
    "ja": "譲る・譲渡"
  },
  "辱": {
    "en": "shame; insult",
    "ja": "恥辱・侮辱"
  },
  "枢": {
    "en": "pivot; center",
    "ja": "枢要・中枢"
  },
  "績": {
    "en": "results; achievement",
    "ja": "成績・業績"
  },
  "絶": {
    "en": "sever; absolute",
    "ja": "断絶・絶対"
  },
  "染": {
    "en": "dye; infect",
    "ja": "染める・感染"
  },
  "措": {
    "en": "measure; dispose",
    "ja": "措置・処置"
  },
  "礎": {
    "en": "foundation; cornerstone",
    "ja": "基礎・礎石"
  },
  "阻": {
    "en": "obstruct; hinder",
    "ja": "阻む・阻害"
  },
  "掃": {
    "en": "sweep; clean",
    "ja": "掃く・清掃"
  },
  "損": {
    "en": "loss; damage",
    "ja": "損失・損害"
  },
  "怠": {
    "en": "idle; neglect",
    "ja": "怠る・怠惰"
  },
  "滞": {
    "en": "stagnate; stay",
    "ja": "停滞・滞留"
  },
  "択": {
    "en": "select",
    "ja": "選択"
  },
  "奪": {
    "en": "seize; deprive",
    "ja": "奪う・剥奪"
  },
  "担": {
    "en": "take charge; bear",
    "ja": "担う・担当"
  },
  "胆": {
    "en": "courage; gall",
    "ja": "胆力・胆"
  },
  "置": {
    "en": "place; set up",
    "ja": "置く・設置"
  },
  "兆": {
    "en": "omen; trillion",
    "ja": "兆し・兆"
  },
  "徹": {
    "en": "thorough; penetrate",
    "ja": "徹底・貫徹"
  },
  "渡": {
    "en": "cross; hand over",
    "ja": "渡る・渡す"
  },
  "到": {
    "en": "arrive; thorough",
    "ja": "到達・周到"
  },
  "闘": {
    "en": "fight; struggle",
    "ja": "戦闘・奮闘"
  },
  "匿": {
    "en": "conceal; anonymous",
    "ja": "隠匿・匿名"
  },
  "独": {
    "en": "alone; single",
    "ja": "独り・単独"
  },
  "突": {
    "en": "sudden; collide",
    "ja": "突然・衝突"
  },
  "鈍": {
    "en": "dull; slow",
    "ja": "鈍い・遅鈍"
  },
  "熱": {
    "en": "heat; passion",
    "ja": "熱・熱情"
  },
  "納": {
    "en": "pay; store",
    "ja": "納める・収納"
  },
  "排": {
    "en": "reject; exclude",
    "ja": "排斥・排除"
  },
  "抜": {
    "en": "pull out; extract",
    "ja": "抜く・抜き出す"
  },
  "版": {
    "en": "edition; publish",
    "ja": "版・出版"
  },
  "繁": {
    "en": "flourish; frequent",
    "ja": "繁栄・頻繁"
  },
  "番": {
    "en": "order; number",
    "ja": "順番・番号"
  },
  "悲": {
    "en": "sad; grief",
    "ja": "悲しい・悲しみ"
  },
  "頻": {
    "en": "frequent",
    "ja": "頻繁・しきりに"
  },
  "敏": {
    "en": "agile; sharp, keen",
    "ja": "敏捷・鋭敏"
  },
  "布": {
    "en": "cloth; spread, distribute",
    "ja": "布・分布"
  },
  "浮": {
    "en": "float, drift",
    "ja": "浮く・漂う"
  },
  "複": {
    "en": "complex; duplicate",
    "ja": "複雑・重複"
  },
  "平": {
    "en": "flat, level; peaceful",
    "ja": "平ら・平坦"
  },
  "偏": {
    "en": "lean toward; biased",
    "ja": "偏る・偏り"
  },
  "編": {
    "en": "edit; knit, weave",
    "ja": "編集・編む"
  },
  "辺": {
    "en": "edge; vicinity",
    "ja": "辺・近辺"
  },
  "遍": {
    "en": "widespread; all over",
    "ja": "普遍・遍く"
  },
  "飽": {
    "en": "tire of; be full",
    "ja": "飽きる・満腹"
  },
  "暴": {
    "en": "violent; expose",
    "ja": "暴力・暴露"
  },
  "摩": {
    "en": "rub; massage",
    "ja": "摩擦・按摩"
  },
  "慢": {
    "en": "endure; arrogant",
    "ja": "我慢・傲慢"
  },
  "妙": {
    "en": "skillful; strange, wondrous",
    "ja": "巧妙・奇妙"
  },
  "滅": {
    "en": "perish; extinguish",
    "ja": "滅亡・消滅"
  },
  "模": {
    "en": "model; imitate",
    "ja": "模型・模倣"
  },
  "役": {
    "en": "role; duty",
    "ja": "役割・職務"
  },
  "躍": {
    "en": "leap; active",
    "ja": "跳躍・活躍"
  },
  "裕": {
    "en": "wealthy; ample",
    "ja": "富裕・裕福"
  },
  "融": {
    "en": "merge, melt; finance",
    "ja": "融合・金融"
  },
  "余": {
    "en": "remainder; surplus",
    "ja": "余り・余分"
  },
  "与": {
    "en": "give; take part",
    "ja": "与える・参与"
  },
  "誉": {
    "en": "honor; fame",
    "ja": "名誉・栄誉"
  },
  "揚": {
    "en": "raise, uplift; deep-fry",
    "ja": "高揚・揚げる"
  },
  "率": {
    "en": "rate, ratio; lead",
    "ja": "比率・率いる"
  },
  "留": {
    "en": "stay; retain",
    "ja": "留まる・保留"
  },
  "臨": {
    "en": "approach; face, confront",
    "ja": "臨む・面する"
  },
  "令": {
    "en": "command; decree",
    "ja": "命令・法令"
  },
  "烈": {
    "en": "intense, fierce",
    "ja": "激烈・猛烈"
  },
  "浪": {
    "en": "waste; wave",
    "ja": "浪費・波浪"
  },
  "論": {
    "en": "argue; theory",
    "ja": "論述・理論"
  },
  "和": {
    "en": "harmony; peace",
    "ja": "和やか・和睦"
  },
  "悪": {
    "en": "evil; bad",
    "ja": "悪い・悪"
  },
  "逸": {
    "en": "deviate; ease, leisure",
    "ja": "逸脱・安逸"
  },
  "鬱": {
    "en": "melancholy; gloom",
    "ja": "憂鬱・鬱屈"
  },
  "延": {
    "en": "extend; spread",
    "ja": "延長・蔓延"
  },
  "焉": {
    "en": "thus, therein",
    "ja": "焉・然"
  },
  "殴": {
    "en": "beat, strike",
    "ja": "殴る"
  },
  "寡": {
    "en": "few; taciturn",
    "ja": "寡少・寡黙"
  },
  "禍": {
    "en": "disaster; calamity",
    "ja": "災禍・禍い"
  },
  "劾": {
    "en": "impeach",
    "ja": "弾劾"
  },
  "該": {
    "en": "the said; corresponding",
    "ja": "該当・当該"
  },
  "喝": {
    "en": "threaten; scold",
    "ja": "恐喝・一喝"
  },
  "猾": {
    "en": "cunning, sly",
    "ja": "狡猾"
  },
  "喚": {
    "en": "call, summon",
    "ja": "喚起・召喚"
  },
  "奇": {
    "en": "strange, odd",
    "ja": "奇怪・奇異"
  },
  "軌": {
    "en": "track; trajectory",
    "ja": "軌道・軌跡"
  },
  "詭": {
    "en": "sophistry; deceptive",
    "ja": "詭弁・詭異"
  },
  "戯": {
    "en": "play; game",
    "ja": "戯れ・遊戯"
  },
  "欺": {
    "en": "deceive; fraud",
    "ja": "欺く・詐欺"
  },
  "糾": {
    "en": "rectify; dispute",
    "ja": "糾正・紛糾"
  },
  "遽": {
    "en": "sudden; hurried",
    "ja": "急遽・慌ただしい"
  },
  "凶": {
    "en": "wicked; ill-omened",
    "ja": "凶悪・不吉"
  },
  "矯": {
    "en": "correct, straighten",
    "ja": "矯正"
  },
  "郷": {
    "en": "hometown; nostalgia",
    "ja": "故郷・郷愁"
  },
  "矜": {
    "en": "pride; self-esteem",
    "ja": "矜持・自負"
  },
  "緊": {
    "en": "tense; urgent",
    "ja": "緊張・緊急"
  },
  "惧": {
    "en": "fear, dread",
    "ja": "恐惧・危惧"
  },
  "屈": {
    "en": "yield, bend; tedious",
    "ja": "屈服・退屈"
  },
  "牽": {
    "en": "pull, tow; restrain",
    "ja": "牽引・牽制"
  },
  "顕": {
    "en": "prominent; reveal",
    "ja": "顕著・顕現"
  },
  "雇": {
    "en": "employ, hire",
    "ja": "雇用"
  },
  "扈": {
    "en": "rampant",
    "ja": "跋扈"
  },
  "拘": {
    "en": "restrain; be particular",
    "ja": "拘束・拘泥"
  },
  "攻": {
    "en": "attack, assault",
    "ja": "攻撃・進攻"
  },
  "劫": {
    "en": "eon; tedious",
    "ja": "劫・億劫"
  },
  "狡": {
    "en": "cunning, sly",
    "ja": "狡猾"
  },
  "酷": {
    "en": "cruel; harsh, severe",
    "ja": "残酷・過酷"
  },
  "哭": {
    "en": "wail, weep",
    "ja": "哭く・慟哭"
  },
  "懇": {
    "en": "earnest; sincere",
    "ja": "懇切・誠懇"
  },
  "些": {
    "en": "a little; slight",
    "ja": "些か・些細"
  },
  "詐": {
    "en": "fraud; deceive",
    "ja": "詐欺・欺く"
  },
  "催": {
    "en": "hold, host; urge",
    "ja": "催す・催促"
  },
  "索": {
    "en": "search; clue, cord",
    "ja": "捜索・線索"
  },
  "錯": {
    "en": "error; intermingle",
    "ja": "錯誤・交錯"
  },
  "嗜": {
    "en": "be fond of; taste",
    "ja": "嗜好"
  },
  "摯": {
    "en": "earnest, sincere",
    "ja": "真摯・誠摯"
  },
  "峙": {
    "en": "stand opposed; tower",
    "ja": "対峙・聳える"
  },
  "執": {
    "en": "carry out; cling to",
    "ja": "執行・執着"
  },
  "嫉": {
    "en": "envy, jealousy",
    "ja": "嫉妬"
  },
  "釈": {
    "en": "explain; release",
    "ja": "解釈・釈放"
  },
  "充": {
    "en": "fill; supplement",
    "ja": "充実・補充"
  },
  "柔": {
    "en": "soft; gentle",
    "ja": "柔軟・柔和"
  },
  "蹂": {
    "en": "trample",
    "ja": "蹂躙"
  },
  "粛": {
    "en": "solemn; grave",
    "ja": "厳粛・粛々"
  },
  "殉": {
    "en": "die for; martyrdom",
    "ja": "殉じる・殉職"
  },
  "庶": {
    "en": "common folk; numerous",
    "ja": "庶民・多数"
  },
  "緒": {
    "en": "thread; beginning",
    "ja": "緒・端緒"
  },
  "如": {
    "en": "like, as; suchness",
    "ja": "如く・如し"
  },
  "衝": {
    "en": "clash; key point",
    "ja": "衝突・要衝"
  },
  "剰": {
    "en": "surplus; excess",
    "ja": "剰余・過剰"
  },
  "浄": {
    "en": "clean; purify",
    "ja": "清浄・浄化"
  },
  "醸": {
    "en": "brew; foster",
    "ja": "醸造・醸成"
  },
  "拭": {
    "en": "wipe",
    "ja": "拭く・拭う"
  },
  "殖": {
    "en": "breed; multiply",
    "ja": "繁殖・増殖"
  },
  "浸": {
    "en": "soak; permeate",
    "ja": "浸す・浸透"
  },
  "粋": {
    "en": "essence; chic, stylish",
    "ja": "精粋・粋"
  },
  "酔": {
    "en": "drunk; be enchanted",
    "ja": "酔う・陶酔"
  },
  "髄": {
    "en": "marrow; essence",
    "ja": "骨髄・精髄"
  },
  "趨": {
    "en": "trend; tend toward",
    "ja": "趨勢・趨向"
  },
  "雛": {
    "en": "template; chick",
    "ja": "雛形・雛鳥"
  },
  "積": {
    "en": "accumulate; area",
    "ja": "累積・面積"
  },
  "摂": {
    "en": "take in; regency",
    "ja": "摂取・摂政"
  },
  "折": {
    "en": "fold, break; compromise",
    "ja": "折る・折衷"
  },
  "漸": {
    "en": "gradually",
    "ja": "漸次・次第に"
  },
  "喪": {
    "en": "lose; mourning",
    "ja": "喪失・服喪"
  },
  "束": {
    "en": "bundle; bind, promise",
    "ja": "束・約束"
  },
  "妥": {
    "en": "compromise; proper",
    "ja": "妥協・妥当"
  },
  "惰": {
    "en": "lazy; idle",
    "ja": "惰性・怠惰"
  },
  "端": {
    "en": "end, tip; beginning",
    "ja": "末端・端緒"
  },
  "綻": {
    "en": "burst open; come apart",
    "ja": "綻びる・破綻"
  },
  "鍛": {
    "en": "forge; train",
    "ja": "鍛錬"
  },
  "弾": {
    "en": "shoot, flick; impeach",
    "ja": "弾く・弾劾"
  },
  "緻": {
    "en": "fine, detailed; precise",
    "ja": "細緻・精緻"
  },
  "蓄": {
    "en": "store, save; accumulate",
    "ja": "貯蓄・蓄積"
  },
  "衷": {
    "en": "compromise; heartfelt",
    "ja": "折衷・衷心"
  },
  "著": {
    "en": "prominent; write, author",
    "ja": "顕著・著作"
  },
  "凋": {
    "en": "wither, fade",
    "ja": "凋落・凋む"
  },
  "暢": {
    "en": "fluent; carefree",
    "ja": "流暢・暢やか"
  },
  "沈": {
    "en": "sink; be silent",
    "ja": "沈む・沈黙"
  },
  "墜": {
    "en": "fall, crash",
    "ja": "墜落・墜つ"
  },
  "偵": {
    "en": "scout; detective",
    "ja": "偵察・探偵"
  },
  "諦": {
    "en": "give up; resign oneself",
    "ja": "諦める・断念"
  },
  "泥": {
    "en": "mud; be particular",
    "ja": "泥・拘泥"
  },
  "哲": {
    "en": "philosophy; wise",
    "ja": "哲学・賢明"
  },
  "撤": {
    "en": "withdraw; remove",
    "ja": "撤回・撤去"
  },
  "妬": {
    "en": "envy, jealousy",
    "ja": "嫉妬・妬む"
  },
  "透": {
    "en": "transparent; permeate",
    "ja": "透明・浸透"
  },
  "陶": {
    "en": "pottery; be enchanted",
    "ja": "陶器・陶酔"
  },
  "慟": {
    "en": "wail; deep grief",
    "ja": "慟哭・悲慟"
  },
  "忍": {
    "en": "endure; cruel",
    "ja": "忍耐・残忍"
  },
  "燃": {
    "en": "burn",
    "ja": "燃える・燃焼"
  },
  "狽": {
    "en": "flustered (in 狼狽)",
    "ja": "狼狽"
  },
  "漠": {
    "en": "vague; desert",
    "ja": "漠然・砂漠"
  },
  "跋": {
    "en": "domineer; postscript",
    "ja": "跋扈"
  },
  "赴": {
    "en": "proceed to; head for",
    "ja": "赴任・赴く"
  },
  "紛": {
    "en": "confusion; dispute",
    "ja": "紛乱・紛争"
  },
  "蔽": {
    "en": "cover; conceal",
    "ja": "遮蔽・隠蔽"
  },
  "弁": {
    "en": "speak; argue",
    "ja": "弁・弁論"
  },
  "倣": {
    "en": "imitate",
    "ja": "模倣・倣う"
  },
  "胞": {
    "en": "cell; womb",
    "ja": "細胞・胞"
  },
  "剖": {
    "en": "dissect; cut open",
    "ja": "解剖・剖く"
  },
  "謀": {
    "en": "scheme; plot",
    "ja": "謀略・陰謀"
  },
  "貌": {
    "en": "appearance; face",
    "ja": "容貌・面貌"
  },
  "奔": {
    "en": "run; unrestrained",
    "ja": "奔走・奔放"
  },
  "翻": {
    "en": "flip; translate",
    "ja": "翻る・翻訳"
  },
  "凡": {
    "en": "ordinary; in general",
    "ja": "平凡・凡そ"
  },
  "魔": {
    "en": "demon; hinder",
    "ja": "魔・邪魔"
  },
  "抹": {
    "en": "erase; rub, paint",
    "ja": "抹消・抹する"
  },
  "万": {
    "en": "ten thousand; by any chance",
    "ja": "万・万一"
  },
  "漫": {
    "en": "rambling; comic",
    "ja": "散漫・漫画"
  },
  "蔓": {
    "en": "spread; vine",
    "ja": "蔓延・蔓"
  },
  "癒": {
    "en": "heal; soothe",
    "ja": "治癒・癒し"
  },
  "憂": {
    "en": "sorrow; anxiety",
    "ja": "憂愁・憂慮"
  },
  "擁": {
    "en": "support; possess, hold",
    "ja": "擁護・擁する"
  },
  "落": {
    "en": "fall, drop; decline",
    "ja": "落ちる・凋落"
  },
  "濫": {
    "en": "overflow; abuse, overuse",
    "ja": "氾濫・濫用"
  },
  "慮": {
    "en": "consider; be concerned",
    "ja": "考慮・顧慮"
  },
  "猟": {
    "en": "hunt; seek out",
    "ja": "狩猟・猟奇"
  },
  "糧": {
    "en": "provisions, food",
    "ja": "糧・食糧"
  },
  "躙": {
    "en": "trample",
    "ja": "蹂躙"
  },
  "累": {
    "en": "accumulate; implicate",
    "ja": "累積・連累"
  },
  "錬": {
    "en": "temper, train; refine",
    "ja": "鍛錬・精錬"
  },
  "弄": {
    "en": "toy with; manipulate",
    "ja": "弄ぶ・翻弄"
  },
  "狼": {
    "en": "wolf; flustered",
    "ja": "狼・狼狽"
  }
};

/** The kanji's gloss in `lang`, falling back to the zh source when unlocalized. */
export function kanjiMeaning(
  entry: KanjiOnyomiEntry,
  lang: LocaleCode,
  overlays: Record<string, LocalizedText> = kanjiMeaningI18n
): string {
  return pickLocalized(entry.meaningZh, overlays[entry.kanji], lang);
}
