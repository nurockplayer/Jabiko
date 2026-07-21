import type { ArticleBlock } from "../articles";

// A compact reference: four groups, with only the usage notes that affect
// how learners read or use the Japanese forms.
export const countryNamesBody: ReadonlyArray<ArticleBlock> = [
  {
    kind: "lead",
    text: "日文國名的來源不一定是英語。以下整理常見國名、新聞縮寫與相關讀法。"
  },
  {
    kind: "table",
    caption: "英文以外來源的國名",
    columns: [
      { label: "日文", lang: "ja", rowHeader: true },
      { label: "中文" },
      { label: "來源" }
    ],
    rows: [
      ["ドイツ", "德國", "荷蘭語 Duitsch（現代拼法 Duits）"],
      ["イギリス", "英國", "葡萄牙語 Inglês"],
      ["オランダ", "荷蘭", "葡萄牙語 Olanda"],
      ["ギリシャ／ギリシア", "希臘", "葡萄牙語 Grécia"],
      ["スイス", "瑞士", "法語 Suisse 系的名稱"],
      ["アルゼンチン", "阿根廷", "英語 Argentine；舊表記アルジェンティン"]
    ]
  },
  {
    kind: "table",
    caption: "新聞常見的一字縮寫",
    columns: [
      { label: "縮寫與讀法", lang: "ja", rowHeader: true },
      { label: "國家" },
      { label: "舊譯名" },
      { label: "常見組合", lang: "ja" }
    ],
    rows: [
      ["米（べい）", "美國", "亜米利加", "米国（べいこく）・日米（にちべい）・訪米（ほうべい）"],
      ["英（えい）", "英國", "英吉利", "英国（えいこく）・日英（にちえい）・訪英（ほうえい）"],
      ["独（どく）", "德國", "独逸", "日独（にちどく）・独仏（どくふつ）"],
      ["仏（ふつ）", "法國", "仏蘭西", "日仏（にちふつ）・訪仏（ほうふつ）"],
      ["中（ちゅう）", "中國", "中国", "日中（にっちゅう）"],
      ["韓（かん）", "韓國", "韓国", "日韓（にっかん）"]
    ]
  },
  {
    kind: "callout",
    text:
      "米讀べい，不讀こめ。日常會話通常說アメリカ、イギリス、ドイツ；米・英・独・仏主要用在新聞與日米、日英、日独等固定詞。"
  },
  {
    kind: "table",
    caption: "「国」的讀法",
    columns: [
      { label: "寫法", lang: "ja", rowHeader: true },
      { label: "讀音", lang: "ja" },
      { label: "分類" }
    ],
    rows: [
      ["国", "くに", "單獨使用"],
      ["韓国・米国・英国", "かんこく・べいこく・えいこく", "讀こく"],
      ["中国", "ちゅうごく", "讀ごく"],
      ["全国・建国", "ぜんこく・けんこく", "讀こく"],
      ["戦国・本国", "せんごく・ほんごく", "讀ごく"]
    ]
  },
  {
    kind: "callout",
    text:
      "前面有ん也不代表一定讀ごく。韓国・全国・建国讀こく，戦国・本国讀ごく；各詞分開記。"
  },
  {
    kind: "table",
    caption: "國名後面的常用說法",
    columns: [
      { label: "接法與讀法", lang: "ja", rowHeader: true },
      { label: "意思" },
      { label: "例", lang: "ja" }
    ],
    rows: [
      ["〜人（じん）", "國籍、出身；讀じん，不是にん", "アメリカ人"],
      ["〜語（ご）", "語言；英語固定說英語（えいご）", "フランス語・英語"],
      ["〜製（せい）", "製造地", "ドイツ製"],
      ["〜産（さん）", "產地", "台湾産"]
    ]
  },
  {
    kind: "links",
    label: "參考資料",
    items: [
      {
        label: "日本国語大辞典：ドイツ",
        url: "https://kotobank.jp/word/%E7%8B%AC%E9%80%B8-337657"
      },
      {
        label: "日本国語大辞典：イギリス",
        url: "https://kotobank.jp/word/%E8%8B%B1%E5%90%89%E5%88%A9-431366"
      },
      {
        label: "日本国語大辞典：アルゼンチン",
        url: "https://kotobank.jp/word/%E4%BA%9C%E7%88%BE%E7%84%B6%E4%B8%81-199865"
      },
      {
        label: "日本国語大辞典：オランダ",
        url: "https://kotobank.jp/word/%E9%98%BF%E8%98%AD%E9%99%80-2018487"
      },
      {
        label: "日本国語大辞典：ギリシャ",
        url: "https://kotobank.jp/word/%E5%B8%8C%E8%87%98-247001"
      },
      {
        label: "日本国語大辞典：スイス",
        url: "https://kotobank.jp/word/%E3%81%99%E3%81%84%E3%81%99-3155948"
      },
      {
        label: "文化庁：一字國名縮寫",
        url: "https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/kokugo_kadai/iinkai_29/pdf/r1419861_06.pdf"
      }
    ]
  },
  { kind: "cta", cta: { kind: "challenge", mode: "vocab", label: "去單字挑戰練習 →" } }
];
