import type { VerbGroup, VocabularyItem } from "./types";
import { jlptVocabulary } from "./vocabulary-jlpt";
import { applyVocabularyI18n } from "./vocabulary.i18n";

// applyVocabularyI18n attaches the generated en/ja gloss overlays (#427); the
// jlpt items arrive already attached, re-applying is a no-op for them.
export const vocabulary: VocabularyItem[] = applyVocabularyI18n([
  verb("kaku", "書く", "かく", "寫", "godan", "私はノートに漢字を書く。", "我在筆記本寫漢字。"),
  verb("kiku", "聞く", "きく", "聽、問", "godan", "好きな音楽を聞く。", "聽喜歡的音樂。"),
  verb("iku", "行く", "いく", "去", "godan", "明日学校へ行く。", "明天去學校。"),
  verb("nomu", "飲む", "のむ", "喝", "godan", "水を飲む。", "喝水。"),
  verb("yomu", "読む", "よむ", "讀", "godan", "本を読む。", "讀書。"),
  verb("hanasu", "話す", "はなす", "說", "godan", "日本語を話す。", "說日文。"),
  verb("matsu", "待つ", "まつ", "等", "godan", "駅で友達を待つ。", "在車站等朋友。"),
  verb("kaeru", "帰る", "かえる", "回去", "godan", "家へ帰る。", "回家。"),
  verb("kau", "買う", "かう", "買", "godan", "パンを買う。", "買麵包。"),
  verb("asobu", "遊ぶ", "あそぶ", "玩", "godan", "公園で遊ぶ。", "在公園玩。"),
  verb("shinu", "死ぬ", "しぬ", "死", "godan", "水がないと魚が死ぬ。", "沒有水的話魚會死。"),
  verb("taberu", "食べる", "たべる", "吃", "ichidan", "朝ごはんを食べる。", "吃早餐。"),
  verb("miru", "見る", "みる", "看", "ichidan", "映画を見る。", "看電影。"),
  verb("okiru", "起きる", "おきる", "起床", "ichidan", "六時に起きる。", "六點起床。"),
  verb("neru", "寝る", "ねる", "睡覺", "ichidan", "早く寝る。", "早點睡。"),
  verb("kariru", "借りる", "かりる", "借", "ichidan", "本を借りる。", "借書。"),
  verb("abiru", "浴びる", "あびる", "淋、沖", "ichidan", "シャワーを浴びる。", "沖澡。"),
  verb("oshieru", "教える", "おしえる", "教、告訴", "ichidan", "友達に日本語を教える。", "教朋友日文。"),
  verb("oboeru", "覚える", "おぼえる", "記住", "ichidan", "単語を覚える。", "記單字。"),
  verb("suru", "する", "する", "做", "irregular", "宿題をする。", "做作業。"),
  verb("kuru", "来る", "くる", "來", "irregular", "友達が来る。", "朋友會來。"),
  verb("benkyo-suru", "勉強する", "べんきょうする", "讀書", "irregular", "日本語を勉強する。", "讀日文。"),
  verb("kaimono-suru", "買い物する", "かいものする", "買東西", "irregular", "スーパーで買い物する。", "在超市買東西。"),
  iAdjective("takai", "高い", "たかい", "高、貴", "この店は高い。", "這家店很貴。"),
  iAdjective("yasui", "安い", "やすい", "便宜", "このパンは安い。", "這個麵包很便宜。"),
  iAdjective("okii", "大きい", "おおきい", "大", "大きいかばんを買う。", "買大的包包。"),
  iAdjective("chisai", "小さい", "ちいさい", "小", "小さい字を書く。", "寫小字。"),
  iAdjective("atarashii", "新しい", "あたらしい", "新", "新しい本を読む。", "讀新書。"),
  iAdjective("furui", "古い", "ふるい", "舊", "古い写真を見る。", "看舊照片。"),
  iAdjective("isogashii", "忙しい", "いそがしい", "忙", "今日は忙しい。", "今天很忙。"),
  iAdjective("omoshiroi", "おもしろい", "おもしろい", "有趣", "この映画はおもしろい。", "這部電影很有趣。"),
  iAdjective("tanoshii", "楽しい", "たのしい", "開心", "毎日学校は楽しい。", "每天上學很開心。"),
  iAdjective("samui", "寒い", "さむい", "冷", "今日はとても寒い。", "今天很冷。"),
  iAdjective("atsui", "暑い", "あつい", "熱", "夏はとても暑い。", "夏天很熱。"),
  iAdjective("muzukashii", "難しい", "むずかしい", "難", "数学は難しい。", "數學很難。"),
  iAdjective("hayai", "速い", "はやい", "快", "新幹線は速い。", "新幹線很快。"),
  iAdjective("osoi", "遅い", "おそい", "慢、晚", "彼の返事は遅い。", "他的回覆很慢。"),
  iAdjective("nagai", "長い", "ながい", "長", "この映画は長い。", "這部電影很長。"),
  iAdjective("mijikai", "短い", "みじかい", "短", "冬休みは短い。", "寒假很短。"),
  iAdjective("omoi", "重い", "おもい", "重", "このかばんは重い。", "這個包包很重。"),
  iAdjective("karui", "軽い", "かるい", "輕", "このノートは軽い。", "這本筆記本很輕。"),
  iAdjective("chikai", "近い", "ちかい", "近", "駅は家から近い。", "車站離家很近。"),
  iAdjective("itai", "痛い", "いたい", "痛", "おなかが痛い。", "肚子很痛。"),
  naAdjective("shizuka", "静か", "しずか", "安靜", "図書館は静かだ。", "圖書館很安靜。"),
  naAdjective("benri", "便利", "べんり", "方便", "駅は便利だ。", "車站很方便。"),
  naAdjective("genki", "元気", "げんき", "有精神", "友達は元気だ。", "朋友很有精神。"),
  naAdjective("yumei", "有名", "ゆうめい", "有名", "ここは有名だ。", "這裡很有名。"),
  naAdjective("shinsetsu", "親切", "しんせつ", "親切", "先生は親切だ。", "老師很親切。"),
  naAdjective("hima", "暇", "ひま", "有空", "明日は暇だ。", "明天有空。"),
  naAdjective("kantan", "簡単", "かんたん", "簡單", "この問題は簡単だ。", "這個問題很簡單。"),
  naAdjective("suki", "好き", "すき", "喜歡", "私は音楽が好きだ。", "我喜歡音樂。"),
  naAdjective("kirai", "嫌い", "きらい", "討厭", "弟は野菜が嫌いだ。", "弟弟討厭蔬菜。"),
  naAdjective("jouzu", "上手", "じょうず", "擅長", "姉は料理が上手だ。", "姊姊很會做菜。"),
  naAdjective("heta", "下手", "へた", "不擅長", "私は歌が下手だ。", "我唱歌很差。"),
  naAdjective("taihen", "大変", "たいへん", "辛苦", "今日の仕事は大変だ。", "今天的工作很辛苦。"),
  naAdjective("taisetsu", "大切", "たいせつ", "重要", "家族は大切だ。", "家人很重要。"),
  naAdjective("kirei", "きれい", "きれい", "漂亮、乾淨", "この公園はきれいだ。", "這個公園很乾淨。"),
  naAdjective("daijoubu", "大丈夫", "だいじょうぶ", "沒問題", "一人で大丈夫だ。", "一個人沒問題。"),
  noun("gakusei", "学生", "がくせい", "學生", "私は学生だ。", "我是學生。"),
  noun("sensei", "先生", "せんせい", "老師", "田中さんは先生だ。", "田中先生是老師。"),
  noun("kaishain", "会社員", "かいしゃいん", "公司職員", "兄は会社員だ。", "哥哥是公司職員。"),
  noun("isha", "医者", "いしゃ", "醫生", "父は医者だ。", "爸爸是醫生。"),
  noun("nihonjin", "日本人", "にほんじん", "日本人", "田中さんは日本人だ。", "田中先生是日本人。"),
  noun("yasumi", "休み", "やすみ", "休假", "明日は休みだ。", "明天是休假。"),
  noun("ame", "雨", "あめ", "雨", "明日は雨だ。", "明天會下雨。"),
  noun("inu", "犬", "いぬ", "狗", "これは私の犬だ。", "這是我的狗。"),
  noun("tomodachi", "友達", "ともだち", "朋友", "彼は私の友達だ。", "他是我的朋友。"),
  noun("byouin", "病院", "びょういん", "醫院", "あの建物は病院だ。", "那棟建築是醫院。"),
  noun("gakkou", "学校", "がっこう", "學校", "ここは学校だ。", "這裡是學校。"),
  ...extraVerbs(),
  ...jlptVocabulary
]);

function extraVerbs(): VocabularyItem[] {
  const godan: Array<[string, string, string]> = [
    ["急ぐ", "いそぐ", "急忙、趕緊"],
    ["泳ぐ", "およぐ", "游泳"],
    ["脱ぐ", "ぬぐ", "脫"],
    ["騒ぐ", "さわぐ", "吵鬧"],
    ["押す", "おす", "推、按"],
    ["出す", "だす", "拿出、提交"],
    ["探す", "さがす", "找"],
    ["直す", "なおす", "修理、修正"],
    ["貸す", "かす", "借出"],
    ["持つ", "もつ", "拿、擁有"],
    ["立つ", "たつ", "站"],
    ["勝つ", "かつ", "贏"],
    ["取る", "とる", "拿、取"],
    ["作る", "つくる", "做、製造"],
    ["売る", "うる", "賣"],
    ["走る", "はしる", "跑"],
    ["切る", "きる", "切、剪"],
    ["入る", "はいる", "進入"],
    ["知る", "しる", "知道"],
    ["要る", "いる", "需要"],
    ["思う", "おもう", "想、覺得"],
    ["歌う", "うたう", "唱"],
    ["笑う", "わらう", "笑"],
    ["使う", "つかう", "使用"],
    ["払う", "はらう", "付錢"],
    ["洗う", "あらう", "洗"],
    ["手伝う", "てつだう", "幫忙"],
    ["会う", "あう", "見面"],
    ["違う", "ちがう", "不同"],
    ["学ぶ", "まなぶ", "學習"],
    ["呼ぶ", "よぶ", "呼喚、邀請"],
    ["選ぶ", "えらぶ", "選擇"],
    ["並ぶ", "ならぶ", "排隊"],
    ["喜ぶ", "よろこぶ", "高興"],
    ["飛ぶ", "とぶ", "飛"],
    ["運ぶ", "はこぶ", "搬運"],
    ["住む", "すむ", "居住"],
    ["休む", "やすむ", "休息"],
    ["進む", "すすむ", "前進"],
    ["包む", "つつむ", "包"],
    ["楽しむ", "たのしむ", "享受"],
    ["頼む", "たのむ", "拜託"]
  ];
  const ichidan: Array<[string, string, string]> = [
    ["開ける", "あける", "打開"],
    ["閉める", "しめる", "關閉"],
    ["始める", "はじめる", "開始"],
    ["続ける", "つづける", "繼續"],
    ["止める", "とめる", "停止"],
    ["集める", "あつめる", "收集"],
    ["答える", "こたえる", "回答"],
    ["考える", "かんがえる", "思考"],
    ["出かける", "でかける", "出門"],
    ["忘れる", "わすれる", "忘記"],
    ["助ける", "たすける", "幫助"],
    ["受ける", "うける", "接受"],
    ["比べる", "くらべる", "比較"],
    ["調べる", "しらべる", "調查"],
    ["育てる", "そだてる", "養育"],
    ["別れる", "わかれる", "分別"],
    ["疲れる", "つかれる", "疲憊"],
    ["倒れる", "たおれる", "倒下"],
    ["流れる", "ながれる", "流動"],
    ["生まれる", "うまれる", "出生"],
    ["投げる", "なげる", "投擲"],
    ["上げる", "あげる", "舉起、給"],
    ["下げる", "さげる", "降低"],
    ["過ぎる", "すぎる", "通過、超過"],
    ["着る", "きる", "穿"],
    ["出る", "でる", "出去"]
  ];
  const irregular: Array<[string, string, string]> = [
    ["結婚する", "けっこんする", "結婚"],
    ["卒業する", "そつぎょうする", "畢業"],
    ["利用する", "りようする", "利用"],
    ["練習する", "れんしゅうする", "練習"],
    ["連絡する", "れんらくする", "聯絡"],
    ["説明する", "せつめいする", "說明"],
    ["紹介する", "しょうかいする", "介紹"],
    ["案内する", "あんないする", "嚮導"],
    ["出席する", "しゅっせきする", "出席"],
    ["散歩する", "さんぽする", "散步"],
    ["旅行する", "りょこうする", "旅行"],
    ["心配する", "しんぱいする", "擔心"]
  ];

  return [
    ...godan.map(([surface, reading, meaningZh]) => extraVerb("godan", surface, reading, meaningZh)),
    ...ichidan.map(([surface, reading, meaningZh]) => extraVerb("ichidan", surface, reading, meaningZh)),
    ...irregular.map(([surface, reading, meaningZh]) => extraVerb("irregular", surface, reading, meaningZh))
  ];
}

function extraVerb(group: VerbGroup, surface: string, reading: string, meaningZh: string): VocabularyItem {
  return {
    id: `verb-${surface}`,
    surface,
    reading,
    meaningZh,
    partOfSpeech: "verb",
    group,
    lesson: null,
    tags: [],
    examples: [],
    level: "N5"
  };
}

function verb(
  id: string,
  surface: string,
  reading: string,
  meaningZh: string,
  group: VocabularyItem["group"],
  japanese: string,
  exampleZh: string
): VocabularyItem {
  return item(id, surface, reading, meaningZh, "verb", group, japanese, exampleZh);
}

function iAdjective(
  id: string,
  surface: string,
  reading: string,
  meaningZh: string,
  japanese: string,
  exampleZh: string
): VocabularyItem {
  return item(id, surface, reading, meaningZh, "i_adjective", null, japanese, exampleZh);
}

function naAdjective(
  id: string,
  surface: string,
  reading: string,
  meaningZh: string,
  japanese: string,
  exampleZh: string
): VocabularyItem {
  return item(id, surface, reading, meaningZh, "na_adjective", null, japanese, exampleZh);
}

function noun(
  id: string,
  surface: string,
  reading: string,
  meaningZh: string,
  japanese: string,
  exampleZh: string
): VocabularyItem {
  return item(id, surface, reading, meaningZh, "noun", null, japanese, exampleZh);
}

function item(
  id: string,
  surface: string,
  reading: string,
  meaningZh: string,
  partOfSpeech: VocabularyItem["partOfSpeech"],
  group: VocabularyItem["group"],
  japanese: string,
  exampleZh: string
): VocabularyItem {
  return {
    id,
    surface,
    reading,
    meaningZh,
    partOfSpeech,
    group,
    lesson: null,
    tags: [],
    examples: [{ japanese, meaningZh: exampleZh }],
    level: "N5"
  };
}
