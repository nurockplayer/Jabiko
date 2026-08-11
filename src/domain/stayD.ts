import type { Language } from "../i18n";

export const STAY_D_AIRBNB_ROOM_ID = "1518015758376242668";
export const STAY_D_AIRBNB_URL =
  "https://www.airbnb.com/rooms/1518015758376242668";
export const STAY_D_VIDEO_ID = "wXx_t8JTyDE";
export const STAY_D_VIDEO_START_SECONDS = 70;

export const STAY_D_REQUIRED_LOCALES = ["zh-Hant", "ja", "en"] as const;
export type StayDLocale = (typeof STAY_D_REQUIRED_LOCALES)[number];

export interface StayDVideoCopy {
  watch: string;
  collapse: string;
  iframeTitle: string;
  airbnbCta: string;
}

export interface StayDHomeCopy {
  disclosure: string;
  title: string;
  body: string;
  imageAlt: string;
  airbnbCta: string;
  video: StayDVideoCopy;
}

export interface StayDImage {
  src: string;
  width: number;
  height: number;
  srcSet?: string;
}

export const STAY_D_HOME_IMAGE = {
  src: "/stay-d/living-hero-1600.webp",
  srcSet:
    "/stay-d/living-hero-800.webp 800w, /stay-d/living-hero-1600.webp 1600w",
  width: 1600,
  height: 900
} satisfies StayDImage;

type CompleteStayDHomeCopy = Record<StayDLocale, StayDHomeCopy>;

export const STAY_D_HOME_COPY = {
  "zh-Hant": {
    disclosure: "Jabiko 推薦｜東京住宿",
    title: "下一次來東京，不只是觀光。帶著你學會的日文，和家人朋友一起深度探索東京的日常。",
    body: "Stay.D 位於東京千川，距千川站步行約 5 分鐘。2025 年 8 月完工的 52m² 三層獨棟住宅，配備 10Gbps 光纖、完整廚房與兩張雙人床，適合想用更貼近日常的方式停留東京的旅客。",
    imageAlt: "Stay.D 明亮的二樓客廳與用餐空間",
    airbnbCta: "查看 Airbnb 最新價格與可訂日期",
    video: {
      watch: "▶ 看看 Stay.D 住宿影片",
      collapse: "收合住宿影片",
      iframeTitle: "Stay.D 住宿影片",
      airbnbCta: "喜歡 Stay.D？到 Airbnb 查看最新價格與可訂日期"
    }
  },
  ja: {
    disclosure: "Jabikoおすすめ｜東京ステイ",
    title: "次の東京は、観光するだけじゃない。学んだ日本語を使いながら、家族や友人と東京の日常をもっと深く楽しもう。",
    body: "Stay.Dは東京・千川にある、千川駅から徒歩約5分の一棟住宅です。2025年8月完成、52m²・3階建てで、10Gbps光回線、キッチン、ダブルベッド2台を備えています。東京で暮らすように滞在したい方におすすめです。",
    imageAlt: "Stay.Dの明るい2階リビング・ダイニング",
    airbnbCta: "Airbnbで料金・空室を確認",
    video: {
      watch: "▶ Stay.Dの紹介動画を見る",
      collapse: "紹介動画を閉じる",
      iframeTitle: "Stay.Dの紹介動画",
      airbnbCta: "Stay.Dが気になったら、Airbnbで料金・空室を確認"
    }
  },
  en: {
    disclosure: "Jabiko Pick | Tokyo Stay",
    title: "Next time in Tokyo, go beyond sightseeing. Use the Japanese you’ve learned and explore everyday Tokyo more deeply with family and friends.",
    body: "Stay.D is a private three-floor home in Senkawa, about a 5-minute walk from the station. Completed in August 2025, the 52 m² home includes 10 Gbps fiber, a full kitchen, and two double beds for travelers who want a more lived-in Tokyo experience.",
    imageAlt: "Stay.D's bright second-floor living and dining space",
    airbnbCta: "Check price & availability on Airbnb",
    video: {
      watch: "▶ Watch the Stay.D home tour",
      collapse: "Collapse the home tour",
      iframeTitle: "Stay.D home tour video",
      airbnbCta: "Like what you see? Check current price & availability on Airbnb"
    }
  }
} satisfies CompleteStayDHomeCopy;

export function isStayDLocale(language: Language): language is StayDLocale {
  return (STAY_D_REQUIRED_LOCALES as readonly string[]).includes(language);
}
