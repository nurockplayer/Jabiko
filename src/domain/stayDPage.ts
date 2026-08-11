import type { StayDLocale, StayDVideoCopy } from "./stayD";

interface StayDFeature {
  title: string;
  body: string;
}

interface StayDFloor {
  label: string;
  title: string;
  body: string;
}

export interface StayDPageCopy {
  backHome: string;
  kicker: string;
  headline: string;
  body: string;
  airbnbCta: string;
  quickFactsLabel: string;
  quickFacts: readonly StayDFeature[];
  whyTitle: string;
  whyIntro: string;
  whyItems: readonly StayDFeature[];
  layoutTitle: string;
  floors: readonly StayDFloor[];
  amenitiesTitle: string;
  amenitiesIntro: string;
  amenities: readonly StayDFeature[];
  neighborhoodTitle: string;
  neighborhoodBody: string;
  videoTitle: string;
  videoIntro: string;
  video: StayDVideoCopy;
  finalTitle: string;
  finalBody: string;
}

type CompleteStayDPageCopy = Record<StayDLocale, StayDPageCopy>;

export const STAY_D_PAGE_COPY = {
  "zh-Hant": {
    backHome: "回 Jabiko 自習室",
    kicker: "Stay.D｜東京・千川",
    headline: "在東京，不只住宿，也住進日常。",
    body: "距千川站步行約 5 分鐘。2025 年 8 月完工的 52m² 三層獨棟住宅，配備 10Gbps 光纖、完整廚房與兩張雙人床。",
    airbnbCta: "查看 Airbnb 最新價格與可訂日期",
    quickFactsLabel: "Stay.D 快速資訊",
    quickFacts: [
      { title: "約 5 分鐘", body: "從東京 Metro 千川站步行前往" },
      { title: "52m²", body: "三層樓的私人獨棟住宅" },
      { title: "2025 年 8 月", body: "住宅完工時間" },
      { title: "10 Gbps 光纖", body: "房源已安裝的網路方案；實際速度不保證" }
    ],
    whyTitle: "把住宿變成一段東京日常",
    whyIntro: "Stay.D 把起居、料理、休息與工作的空間分布在三個樓層，適合想在東京保有生活節奏的旅程。",
    whyItems: [
      { title: "一棟完整的私人住宅", body: "獨棟空間，三個樓層各自承接不同生活機能。" },
      { title: "能煮、能洗，也能坐下工作", body: "廚房、洗衣機與光纖方案都已配置在房源內。" },
      { title: "日常採買就在附近", body: "千川站周邊有超市與便利商店。" }
    ],
    layoutTitle: "三層樓，各自有清楚的用途",
    floors: [
      { label: "1F", title: "衛浴與行李", body: "浴室與廁所分開，設有可再加熱浴缸、免治馬桶與行李收納空間。" },
      { label: "2F", title: "料理與起居", body: "開放式廚房，以及明亮的客廳與用餐空間。" },
      { label: "3F", title: "睡眠空間", body: "高挑空間內配置兩張 140 × 200 cm 雙人床；閣樓不開放住客使用。" }
    ],
    amenitiesTitle: "工作與生活所需的設備",
    amenitiesIntro: "房源提供日常起居與長時間使用所需的主要設備。",
    amenities: [
      { title: "網路與影音", body: "10Gbps 光纖方案與 55 吋數位電視。網路實際速度會因裝置與環境而異。" },
      { title: "完整廚房", body: "冰箱、IH 爐、三菱電機電子鍋、對流烤箱與熱水壺。" },
      { title: "日常家電", body: "洗衣機、熱水器與空調。" }
    ],
    neighborhoodTitle: "住在千川，日常移動與採買都簡單",
    neighborhoodBody: "Stay.D 距東京 Metro 千川站步行約 5 分鐘，附近有超市與便利商店，抵達後也能容易補齊日常用品。",
    videoTitle: "先看看 Stay.D 的空間",
    videoIntro: "想在前往 Airbnb 前多了解房子，可以主動載入住宿影片。影片不會在頁面開啟時自動播放。",
    video: {
      watch: "看看 Stay.D 住宿影片",
      collapse: "收合住宿影片",
      iframeTitle: "Stay.D 住宿影片",
      airbnbCta: "喜歡 Stay.D？到 Airbnb 查看最新價格與可訂日期"
    },
    finalTitle: "準備查看住宿日期了嗎？",
    finalBody: "最新價格與可訂日期以 Airbnb 房源頁為準。"
  },
  ja: {
    backHome: "Jabiko自習室に戻る",
    kicker: "Stay.D｜東京・千川",
    headline: "東京に泊まるだけでなく、暮らすように過ごす。",
    body: "千川駅から徒歩約5分。2025年8月完成・52m²の3階建て一棟住宅で、10Gbps光回線、キッチン、ダブルベッド2台を備えています。",
    airbnbCta: "Airbnbで料金・空室を確認",
    quickFactsLabel: "Stay.D 基本情報",
    quickFacts: [
      { title: "徒歩約5分", body: "東京メトロ千川駅から" },
      { title: "52m²", body: "3階建ての一棟住宅" },
      { title: "2025年8月", body: "建物の完成時期" },
      { title: "10 Gbps光回線", body: "物件に導入された回線プラン。実効速度を保証するものではありません" }
    ],
    whyTitle: "東京の日常を感じられる滞在",
    whyIntro: "Stay.Dは、くつろぐ・料理する・休む・仕事をする空間を3つの階に分け、東京でも普段の生活リズムを保ちやすい住まいです。",
    whyItems: [
      { title: "一棟まるごとのプライベート空間", body: "3つの階に、それぞれ異なる生活機能があります。" },
      { title: "料理・洗濯・仕事に対応", body: "キッチン、洗濯機、光回線プランを備えています。" },
      { title: "日々の買い物も近くで", body: "千川駅の周辺にはスーパーとコンビニがあります。" }
    ],
    layoutTitle: "用途がわかりやすい3フロア",
    floors: [
      { label: "1F", title: "浴室・トイレ・荷物置き場", body: "バス・トイレ別。追い焚き機能付き浴槽、温水洗浄便座、荷物収納スペースがあります。" },
      { label: "2F", title: "キッチンとリビング", body: "オープンキッチンと、明るいリビング・ダイニングがあります。" },
      { label: "3F", title: "ベッドルーム", body: "天井の高い空間に140 × 200 cmのダブルベッドを2台設置。屋根裏はゲスト利用不可です。" }
    ],
    amenitiesTitle: "仕事と暮らしを支える設備",
    amenitiesIntro: "日々の滞在や長時間の利用に必要な主な設備を備えています。",
    amenities: [
      { title: "通信・映像", body: "10Gbps光回線プランと55インチのデジタルテレビ。実効速度は端末や利用環境により異なります。" },
      { title: "キッチン", body: "冷蔵庫、IHコンロ、三菱電機の炊飯器、コンベクションオーブン、ケトル。" },
      { title: "生活家電", body: "洗濯機、給湯器、エアコン。" }
    ],
    neighborhoodTitle: "千川で、移動も日々の買い物もスムーズに",
    neighborhoodBody: "Stay.Dは東京メトロ千川駅から徒歩約5分。近隣にスーパーとコンビニがあり、到着後の日用品の買い足しにも便利です。",
    videoTitle: "Stay.Dの空間を動画で見る",
    videoIntro: "Airbnbへ進む前に室内を詳しく見たい方は、紹介動画を読み込めます。ページを開いただけでは動画は再生されません。",
    video: {
      watch: "Stay.Dの紹介動画を見る",
      collapse: "紹介動画を閉じる",
      iframeTitle: "Stay.Dの紹介動画",
      airbnbCta: "Stay.Dが気になったら、Airbnbで料金・空室を確認"
    },
    finalTitle: "宿泊日を確認しますか？",
    finalBody: "最新の料金と空室状況はAirbnbの物件ページでご確認ください。"
  },
  en: {
    backHome: "Back to the Jabiko study room",
    kicker: "Stay.D | Senkawa, Tokyo",
    headline: "Don’t just stay in Tokyo. Live a little of it.",
    body: "About a 5-minute walk from Senkawa Station, Stay.D is a 52 m² three-floor private home completed in August 2025, with 10 Gbps fiber, a full kitchen, and two double beds.",
    airbnbCta: "Check price & availability on Airbnb",
    quickFactsLabel: "Stay.D at a glance",
    quickFacts: [
      { title: "About 5 minutes", body: "On foot from Tokyo Metro Senkawa Station" },
      { title: "52 m²", body: "A three-floor private standalone home" },
      { title: "August 2025", body: "The home’s completion date" },
      { title: "10 Gbps fiber", body: "The plan installed at the property; actual speeds are not guaranteed" }
    ],
    whyTitle: "Make your stay feel more like daily Tokyo life",
    whyIntro: "Stay.D spreads cooking, living, sleeping, and work-friendly space across three floors for travelers who want to keep a comfortable daily rhythm in Tokyo.",
    whyItems: [
      { title: "A complete private home", body: "A standalone residence with a distinct purpose on each of its three floors." },
      { title: "Cook, wash, and sit down to work", body: "A kitchen, washing machine, and fiber plan are installed at the property." },
      { title: "Daily shopping nearby", body: "Supermarkets and convenience stores are available around Senkawa Station." }
    ],
    layoutTitle: "Three floors with a clear purpose",
    floors: [
      { label: "1F", title: "Bath, toilet, and luggage", body: "Separate bath and toilet area, a reheatable bathtub, washlet toilet, and luggage storage." },
      { label: "2F", title: "Kitchen and living", body: "An open kitchen with a bright living and dining area." },
      { label: "3F", title: "Sleeping area", body: "Two 140 × 200 cm double beds beneath a high ceiling. The attic is not accessible to guests." }
    ],
    amenitiesTitle: "Equipped for work and everyday living",
    amenitiesIntro: "The home includes the main equipment needed for daily routines and longer stretches indoors.",
    amenities: [
      { title: "Connectivity and viewing", body: "A 10 Gbps fiber plan and 55-inch digital TV. Actual network speed varies by device and conditions." },
      { title: "Full kitchen", body: "Refrigerator, IH cooktop, Mitsubishi Electric rice cooker, convection oven, and kettle." },
      { title: "Everyday appliances", body: "Washing machine, water heater, and air conditioner." }
    ],
    neighborhoodTitle: "Simple connections and everyday shopping in Senkawa",
    neighborhoodBody: "Stay.D is about a 5-minute walk from Tokyo Metro Senkawa Station, with nearby supermarkets and convenience stores for everyday essentials after arrival.",
    videoTitle: "Take a closer look at Stay.D",
    videoIntro: "If you want to see more of the home before opening Airbnb, load the home tour when you are ready. It never plays just because the page opened.",
    video: {
      watch: "Watch the Stay.D home tour",
      collapse: "Collapse the home tour",
      iframeTitle: "Stay.D home tour video",
      airbnbCta: "Like what you see? Check current price & availability on Airbnb"
    },
    finalTitle: "Ready to check your dates?",
    finalBody: "Current pricing and availability are shown on the Airbnb listing."
  }
} satisfies CompleteStayDPageCopy;
