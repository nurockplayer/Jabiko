import type { JlptLevel, VocabularyItem } from "./types";

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
  noun("kaishain", "会社員", "かいしゃいん", "公司職員", "兄は会社員だ。", "哥哥是公司職員。"),
  ...n2Vocabulary(),
  ...n1Vocabulary()
];

function n2Vocabulary(): VocabularyItem[] {
  return [
    jlptNoun("n2-eikyou", "影響", "えいきょう", "影響", "N2"),
    jlptNoun("n2-keiken", "経験", "けいけん", "經驗", "N2"),
    jlptNoun("n2-kankyou", "環境", "かんきょう", "環境", "N2"),
    jlptNoun("n2-seihin", "製品", "せいひん", "產品", "N2"),
    jlptNoun("n2-bunka", "文化", "ぶんか", "文化", "N2"),
    jlptNoun("n2-kokusai", "国際", "こくさい", "國際", "N2"),
    jlptNoun("n2-seiji", "政治", "せいじ", "政治", "N2"),
    jlptNoun("n2-keizai", "経済", "けいざい", "經濟", "N2"),
    jlptNoun("n2-shakai", "社会", "しゃかい", "社會", "N2"),
    jlptNoun("n2-senmon", "専門", "せんもん", "專業、專門", "N2"),
    jlptNoun("n2-kaiketsu", "解決", "かいけつ", "解決", "N2"),
    jlptNoun("n2-zouka", "増加", "ぞうか", "增加", "N2"),
    jlptNoun("n2-genshou", "減少", "げんしょう", "減少", "N2"),
    jlptNaAdjective("n2-juuyou", "重要", "じゅうよう", "重要", "N2"),
    jlptNaAdjective("n2-hitsuyou", "必要", "ひつよう", "必要", "N2"),
    jlptNaAdjective("n2-kanou", "可能", "かのう", "可能", "N2"),
    jlptNaAdjective("n2-fuan", "不安", "ふあん", "不安、焦慮", "N2"),
    jlptNoun("n2-kakunin", "確認", "かくにん", "確認", "N2"),
    jlptNoun("n2-keikaku", "計画", "けいかく", "計畫", "N2"),
    jlptNoun("n2-doryoku", "努力", "どりょく", "努力", "N2"),
    jlptNoun("n2-kankei", "関係", "かんけい", "關係", "N2"),
    jlptNoun("n2-heiwa", "平和", "へいわ", "和平", "N2"),
    jlptNoun("n2-jiyuu", "自由", "じゆう", "自由", "N2"),
    jlptNoun("n2-shurui", "種類", "しゅるい", "種類", "N2"),
    jlptNoun("n2-joutai", "状態", "じょうたい", "狀態", "N2"),
    jlptNoun("n2-hyougen", "表現", "ひょうげん", "表現、表達", "N2"),
    jlptNoun("n2-teikyou", "提供", "ていきょう", "提供", "N2"),
    jlptNoun("n2-houmon", "訪問", "ほうもん", "拜訪", "N2"),
    jlptNoun("n2-shoutai", "招待", "しょうたい", "邀請", "N2"),
    jlptNoun("n2-shoukai", "紹介", "しょうかい", "介紹", "N2"),
    jlptNoun("n2-kansha", "感謝", "かんしゃ", "感謝", "N2"),
    jlptNoun("n2-kitai", "期待", "きたい", "期待", "N2"),
    jlptNoun("n2-inshou", "印象", "いんしょう", "印象", "N2"),
    jlptNoun("n2-souzou", "想像", "そうぞう", "想像", "N2"),
    jlptNoun("n2-hyoumen", "表面", "ひょうめん", "表面", "N2"),
    jlptNoun("n2-naiyou", "内容", "ないよう", "內容", "N2"),
    jlptNoun("n2-hani", "範囲", "はんい", "範圍", "N2"),
    jlptNoun("n2-genkai", "限界", "げんかい", "界限、極限", "N2"),
    jlptNaAdjective("n2-kakujitsu", "確実", "かくじつ", "確實", "N2"),
    jlptNaAdjective("n2-konnan", "困難", "こんなん", "困難", "N2"),
    jlptNaAdjective("n2-fukuzatsu", "複雑", "ふくざつ", "複雜", "N2"),
    jlptNaAdjective("n2-futsuu", "普通", "ふつう", "普通", "N2"),
    jlptNaAdjective("n2-anzen", "安全", "あんぜん", "安全", "N2"),
    jlptNaAdjective("n2-kiken", "危険", "きけん", "危險", "N2"),
    jlptNoun("n2-kenkou", "健康", "けんこう", "健康", "N2"),
    jlptNoun("n2-byouki", "病気", "びょうき", "生病", "N2"),
    jlptNoun("n2-chiryou", "治療", "ちりょう", "治療", "N2"),
    jlptNoun("n2-kensa", "検査", "けんさ", "檢查", "N2"),
    jlptNoun("n2-hantai", "反対", "はんたい", "反對、相反", "N2"),
    jlptNoun("n2-sansei", "賛成", "さんせい", "贊成", "N2")
  ];
}

function n1Vocabulary(): VocabularyItem[] {
  return [
    jlptNoun("n1-haaku", "把握", "はあく", "掌握、理解", "N1"),
    jlptNoun("n1-shoutotsu", "衝突", "しょうとつ", "衝突、相撞", "N1"),
    jlptNoun("n1-kattou", "葛藤", "かっとう", "糾葛、糾結", "N1"),
    jlptNaAdjective("n1-chimitsu", "緻密", "ちみつ", "精細、縝密", "N1"),
    jlptNoun("n1-shintou", "浸透", "しんとう", "滲透", "N1"),
    jlptNoun("n1-manen", "蔓延", "まんえん", "蔓延", "N1"),
    jlptNoun("n1-tekkai", "撤回", "てっかい", "撤回", "N1"),
    jlptNoun("n1-honrou", "翻弄", "ほんろう", "玩弄、擺布", "N1"),
    jlptNoun("n1-kousoku", "拘束", "こうそく", "拘束、束縛", "N1"),
    jlptNoun("n1-masshou", "抹消", "まっしょう", "抹消、刪除", "N1"),
    jlptNoun("n1-funkyuu", "紛糾", "ふんきゅう", "糾紛、混亂", "N1"),
    jlptNoun("n1-ruiseki", "累積", "るいせき", "累積", "N1"),
    jlptNoun("n1-shousai", "詳細", "しょうさい", "詳細", "N1"),
    jlptNoun("n1-teikan", "諦観", "ていかん", "看破、達觀", "N1"),
    jlptNoun("n1-kunou", "苦悩", "くのう", "苦惱", "N1"),
    jlptNoun("n1-chikuseki", "蓄積", "ちくせき", "累積、儲存", "N1"),
    jlptNoun("n1-soushitsu", "喪失", "そうしつ", "喪失", "N1"),
    jlptNoun("n1-jousei", "醸成", "じょうせい", "醞釀、釀成", "N1"),
    jlptNoun("n1-kensei", "牽制", "けんせい", "牽制", "N1"),
    jlptNaAdjective("n1-bakuzen", "漠然", "ばくぜん", "茫然、模糊", "N1"),
    jlptNaAdjective("n1-kencho", "顕著", "けんちょ", "顯著", "N1"),
    jlptNoun("n1-mosaku", "模索", "もさく", "摸索", "N1"),
    jlptNoun("n1-secchuu", "折衷", "せっちゅう", "折衷", "N1"),
    jlptNoun("n1-mohan", "模範", "もはん", "模範", "N1"),
    jlptNoun("n1-zenji", "漸次", "ぜんじ", "逐漸、漸次", "N1"),
    jlptNoun("n1-zenshin", "漸進", "ぜんしん", "逐步前進", "N1"),
    jlptNoun("n1-zengen", "漸減", "ぜんげん", "逐漸減少", "N1"),
    jlptNoun("n1-tansho", "端緒", "たんしょ", "開端、線索", "N1"),
    jlptNaAdjective("n1-tanteki", "端的", "たんてき", "明顯、坦率", "N1"),
    jlptNoun("n1-ishizue", "礎", "いしずえ", "基石、根基", "N1"),
    jlptNoun("n1-shinzui", "神髄", "しんずい", "精髓", "N1"),
    jlptNoun("n1-shushi", "趣旨", "しゅし", "主旨、宗旨", "N1"),
    jlptNoun("n1-gaiyou", "概要", "がいよう", "概要", "N1"),
    jlptNoun("n1-gainen", "概念", "がいねん", "概念", "N1"),
    jlptNoun("n1-gairyaku", "概略", "がいりゃく", "概略", "N1"),
    jlptNoun("n1-gaikan", "概観", "がいかん", "概觀", "N1"),
    jlptNoun("n1-kyouji", "矜持", "きょうじ", "自尊、矜持", "N1"),
    jlptNoun("n1-kiben", "詭弁", "きべん", "詭辯", "N1"),
    jlptNaAdjective("n1-kenmei", "賢明", "けんめい", "賢明", "N1"),
    jlptNoun("n1-tainou", "滞納", "たいのう", "滯納、拖欠", "N1"),
    jlptNoun("n1-kenin", "牽引", "けんいん", "牽引、拖動", "N1"),
    jlptNoun("n1-jifu", "自負", "じふ", "自負、自豪", "N1"),
    jlptNoun("n1-junrin", "蹂躙", "じゅうりん", "蹂躪、踐踏", "N1"),
    jlptNoun("n1-bakko", "跋扈", "ばっこ", "橫行、跋扈", "N1"),
    jlptNoun("n1-chouraku", "凋落", "ちょうらく", "衰落、凋零", "N1"),
    jlptNoun("n1-hinagata", "雛形", "ひながた", "雛形、模型", "N1"),
    jlptNoun("n1-fusshoku", "払拭", "ふっしょく", "拂拭、消除", "N1"),
    jlptNoun("n1-roubai", "狼狽", "ろうばい", "狼狽、慌張", "N1"),
    jlptNaAdjective("n1-koukatsu", "狡猾", "こうかつ", "狡猾", "N1"),
    jlptNoun("n1-doukoku", "慟哭", "どうこく", "慟哭、痛哭", "N1"),
    jlptNoun("n1-yuuryo", "憂慮", "ゆうりょ", "憂慮", "N1")
  ];
}

function jlptNoun(id: string, surface: string, reading: string, meaningZh: string, level: JlptLevel): VocabularyItem {
  return jlptItem(id, surface, reading, meaningZh, "noun", level);
}

function jlptNaAdjective(
  id: string,
  surface: string,
  reading: string,
  meaningZh: string,
  level: JlptLevel
): VocabularyItem {
  return jlptItem(id, surface, reading, meaningZh, "na_adjective", level);
}

function jlptItem(
  id: string,
  surface: string,
  reading: string,
  meaningZh: string,
  partOfSpeech: VocabularyItem["partOfSpeech"],
  level: JlptLevel
): VocabularyItem {
  return {
    id,
    surface,
    reading,
    meaningZh,
    partOfSpeech,
    group: null,
    lesson: null,
    tags: [],
    examples: [],
    level
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
    examples: [{ japanese, meaningZh: exampleZh }]
  };
}
