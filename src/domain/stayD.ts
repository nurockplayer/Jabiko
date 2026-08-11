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
    disclosure: "推廣",
    title: "東京學日文，也住得像東京人。",
    body: "Stay.D｜東京・千川。千川站步行約 5 分鐘，52m² 三層獨棟，2025 年 8 月完工，配備 10Gbps 光纖、完整廚房與兩張雙人床。",
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
    disclosure: "プロモーション",
    title: "東京で学ぶなら、暮らすように泊まる。",
    body: "Stay.D｜東京・千川。千川駅から徒歩約5分、52m²の3階建て一棟住宅。2025年8月完成、10Gbps光回線、キッチン、ダブルベッド2台を備えています。",
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
    disclosure: "Promotion",
    title: "Study Japanese in Tokyo. Stay like you live here.",
    body: "Stay.D | Senkawa, Tokyo. About 5 minutes from the station, a 52 m² three-floor private home completed in August 2025, with 10 Gbps fiber, a full kitchen, and two double beds.",
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
