import type { ArticleBlock } from '../articles';

// A compact reference article: answer first, compare in tables, then teach the
// readings and word-building patterns that are useful beyond this one topic.
export const countryNamesBody: ReadonlyArray<ArticleBlock> = [
  {
    kind: 'lead',
    text:
      '日文國名不全是照英文音譯。カナダ、ブラジル、フランス、イタリア大致能從發音猜出來，ドイツ、イギリス、オランダ和アルゼンチン卻和英文差很多。原因不是日文故意念歪，而是這些名稱從不同語言、不同時代傳入日本。'
  },
  { kind: 'heading', text: '為什麼有些國名不像英文？' },
  {
    kind: 'paragraph',
    text:
      '英語普及以前，日本已經透過葡萄牙、荷蘭等地接觸歐洲。部分國名很早就固定下來，因此今天仍看得到葡萄牙語、荷蘭語和法語留下的痕跡。'
  },
  {
    kind: 'table',
    caption: '來源不同的日文國名',
    columns: [
      { label: '日文', lang: 'ja', rowHeader: true },
      { label: '中文' },
      { label: '名稱的來歷' }
    ],
    rows: [
      [
        'ドイツ',
        '德國',
        '荷蘭語 Duitsch（現代拼法 Duits），不是英語 Germany。'
      ],
      [
        'イギリス',
        '英國',
        '葡萄牙語 Inglês；日文後來用它指整個英國。'
      ],
      [
        'オランダ',
        '荷蘭',
        '葡萄牙語 Olanda，往上可追到 Holland。'
      ],
      [
        'ギリシャ',
        '希臘',
        '葡萄牙語 Grécia；也會寫成ギリシア。'
      ],
      [
        'スイス',
        '瑞士',
        '法語 Suisse 一系。'
      ],
      [
        'アルゼンチン',
        '阿根廷',
        '英語 Argentine（Argentine Republic）；另有舊表記アルジェンティン。'
      ]
    ]
  },
  {
    kind: 'callout',
    text:
      '其中最容易誤判的是アルゼンチン。西班牙語 Argentina 接近日文的アルヘンティーナ，日本現在卻固定稱アルゼンチン。《日本国語大辞典》把詞源連到英語 Argentine，並收錄舊表記アルジェンティン；資料只能確認到這條來源，不宜再把ゼンチン拆成一套音變規則。'
  },
  { kind: 'heading', text: '新聞裡的米、英、独、仏是什麼？' },
  {
    kind: 'paragraph',
    text:
      '日本過去曾用漢字音譯外國名稱。今天完整國名大多寫片假名，單字縮寫仍常出現在新聞標題和外交用語裡。'
  },
  {
    kind: 'table',
    caption: '新聞常見的一字國名',
    columns: [
      { label: '縮寫與讀法', lang: 'ja', rowHeader: true },
      { label: '國家' },
      { label: '來源' },
      { label: '常見組合', lang: 'ja' }
    ],
    rows: [
      ['米（べい）', '美國', '亜米利加', '米国（べいこく）・日米（にちべい）・訪米（ほうべい）'],
      ['英（えい）', '英國', '英吉利', '英国（えいこく）・日英（にちえい）・訪英（ほうえい）'],
      ['独（どく）', '德國', '独逸', '日独（にちどく）・独仏（どくふつ）'],
      ['仏（ふつ）', '法國', '仏蘭西', '日仏（にちふつ）・訪仏（ほうふつ）'],
      ['中（ちゅう）', '中國', '中国', '日中（にっちゅう）'],
      ['韓（かん）', '韓國', '韓国', '日韓（にっかん）']
    ]
  },
  {
    kind: 'paragraph',
    text:
      '這裡的米念べい，不念こめ。米、英、独、仏等字多半取自舊譯名；中、韓則直接取自中国、韓国。日常會話通常還是說アメリカ、イギリス、ドイツ；米国較正式，独、仏則多見於新聞標題或日独、訪仏這類固定組合。'
  },
  { kind: 'heading', text: '「国」為什麼有時是こく，有時是ごく？' },
  {
    kind: 'paragraph',
    text:
      '国有訓讀くに，也有音讀こく、ごく。單獨說「國家」時常念くに；放進由漢字組成的詞裡，多半讀こく，例如韓国（かんこく）、米国（べいこく）、英国（えいこく）和外国（がいこく）。中国（ちゅうごく）則固定讀ごく。'
  },
  {
    kind: 'table',
    caption: '「国」的常見讀法',
    columns: [
      { label: '寫法', lang: 'ja', rowHeader: true },
      { label: '讀音', lang: 'ja' },
      { label: '重點' }
    ],
    rows: [
      ['国・国々', 'くに・くにぐに', '單獨時讀くに；重複後第二個音變成ぐに。'],
      ['韓国・米国・英国', 'かんこく・べいこく・えいこく', '國名中的国多半讀こく。'],
      ['中国', 'ちゅうごく', '固定讀ごく。'],
      ['全国・建国', 'ぜんこく・けんこく', '前面有ん，仍然可能讀こく。'],
      ['戦国・本国', 'せんごく・ほんごく', '前面同樣有ん，這兩個詞卻讀ごく。']
    ]
  },
  {
    kind: 'callout',
    text:
      '撥音ん後面確實比較容易出現濁音，但不能背成「前面有ん，国就一定念ごく」。韓国、全国、建国都讀こく，戦国、本国則讀ごく；各詞的固定讀法不同，不能只靠前一個音推算。'
  },
  {
    kind: 'paragraph',
    text:
      '補充來說，国々的ぐに是和語的連濁；中国的ごく則是漢字詞中固定下來的讀法，不能當成同一條規則。實際記法很簡單：國名＋国先讀こく，中国另外記。'
  },
  { kind: 'heading', text: '國名後面最常接的四種說法' },
  {
    kind: 'paragraph',
    text:
      '〜人（じん）表示國籍：アメリカ人（美國人）。這裡讀じん，不是にん。〜語（ご）表示語言：フランス語（法語）。〜製（せい）強調製造地：ドイツ製（德國製）。〜産（さん）強調產地：台湾産（台灣產）。'
  },
  {
    kind: 'callout',
    text:
      '食品常見〜産，工業產品則常見〜製。英語是常見例外：一般說英語（えいご），不說イギリス語或アメリカ語。英国、日英裡的英，以及日常說的イギリス，都指向英國，只是使用場合不同。'
  },
  {
    kind: 'links',
    label: '參考資料',
    items: [
      {
        label: '精選版 日本国語大辞典：ドイツ（独逸）的語源',
        url: 'https://kotobank.jp/word/%E7%8B%AC%E9%80%B8-337657'
      },
      {
        label: '精選版 日本国語大辞典：イギリス（英吉利）的語源',
        url: 'https://kotobank.jp/word/%E8%8B%B1%E5%90%89%E5%88%A9-431366'
      },
      {
        label: '精選版 日本国語大辞典：アルゼンチン（亜爾然丁）的語源',
        url: 'https://kotobank.jp/word/%E4%BA%9C%E7%88%BE%E7%84%B6%E4%B8%81-199865'
      },
      {
        label: '精選版 日本国語大辞典：オランダ（阿蘭陀）的語源',
        url: 'https://kotobank.jp/word/%E9%98%BF%E8%98%AD%E9%99%80-2018487'
      },
      {
        label: '精選版 日本国語大辞典：ギリシャ（希臘）的語源',
        url: 'https://kotobank.jp/word/%E5%B8%8C%E8%87%98-247001'
      },
      {
        label: '精選版 日本国語大辞典：スイス（瑞西）的語源',
        url: 'https://kotobank.jp/word/%E3%81%99%E3%81%84%E3%81%99-3155948'
      },
      {
        label: '文化庁國語課題小委員會（2019 工作草案）：一字國名縮寫實例',
        url: 'https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/kokugo_kadai/iinkai_29/pdf/r1419861_06.pdf'
      },
      {
        label: '国立国語研究所：「匹」的讀音解說（文中列有〜国在撥音後的清濁例）',
        url: 'https://kotoba.ninjal.ac.jp/qa/yokuaru/qa-225/'
      },
      {
        label: '《日本語の研究》：《連濁の総合的研究》書評（含〜国的清濁討論）',
        url: 'https://www.jstage.jst.go.jp/article/nihongonokenkyu/21/1/21_62/_pdf/-char/ja'
      }
    ]
  },
  {
    kind: 'cta',
    cta: { kind: 'challenge', mode: 'vocab', label: '把讀音記熟：去單字挑戰刷一輪 →' }
  }
];
