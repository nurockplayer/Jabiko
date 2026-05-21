import type { VocabularyItem } from "./types";

export const vocabulary: VocabularyItem[] = [
  verb("kaku", "書く", "かく", "寫", "godan", "私はノートに漢字を書く。", "我在筆記本寫漢字。"),
  verb("kiku", "聞く", "きく", "聽、問", "godan", "先生に質問を聞く。", "向老師問問題。"),
  verb("iku", "行く", "いく", "去", "godan", "明日学校へ行く。", "明天去學校。"),
  verb("nomu", "飲む", "のむ", "喝", "godan", "水を飲む。", "喝水。"),
  verb("yomu", "読む", "よむ", "讀", "godan", "本を読む。", "讀書。"),
  verb("hanasu", "話す", "はなす", "說", "godan", "日本語を話す。", "說日文。"),
  verb("matsu", "待つ", "まつ", "等", "godan", "駅で友達を待つ。", "在車站等朋友。"),
  verb("kaeru", "帰る", "かえる", "回去", "godan", "家へ帰る。", "回家。"),
  verb("kau", "買う", "かう", "買", "godan", "パンを買う。", "買麵包。"),
  verb("asobu", "遊ぶ", "あそぶ", "玩", "godan", "公園で遊ぶ。", "在公園玩。"),
  verb("shinu", "死ぬ", "しぬ", "死", "godan", "花が死ぬ。", "花枯死。"),
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
  naAdjective("shizuka", "静か", "しずか", "安靜", "図書館は静かだ。", "圖書館很安靜。"),
  naAdjective("benri", "便利", "べんり", "方便", "駅は便利だ。", "車站很方便。"),
  naAdjective("genki", "元気", "げんき", "有精神", "友達は元気だ。", "朋友很有精神。"),
  naAdjective("yumei", "有名", "ゆうめい", "有名", "ここは有名だ。", "這裡很有名。"),
  naAdjective("shinsetsu", "親切", "しんせつ", "親切", "先生は親切だ。", "老師很親切。"),
  naAdjective("hima", "暇", "ひま", "有空", "明日は暇だ。", "明天有空。"),
  naAdjective("kantan", "簡単", "かんたん", "簡單", "この問題は簡単だ。", "這個問題很簡單。"),
  noun("gakusei", "学生", "がくせい", "學生", "私は学生だ。", "我是學生。"),
  noun("sensei", "先生", "せんせい", "老師", "田中さんは先生だ。", "田中先生是老師。"),
  noun("kaishain", "会社員", "かいしゃいん", "公司職員", "兄は会社員だ。", "哥哥是公司職員。")
];

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
    examples: [{ japanese, meaningZh: exampleZh }]
  };
}
