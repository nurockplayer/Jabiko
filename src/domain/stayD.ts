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

/** Editorial extension copy for the /stay-d page (not listing content). */
export interface StayDPageExtras {
  videoTitle: string;
  videoIntro: string;
  finalTitle: string;
  finalBody: string;
}

export interface StayDEditorialCopy {
  backHome: string;
  kicker: string;
  title: string;
  body: string;
  airbnbCta: string;
  video: StayDVideoCopy;
  page: StayDPageExtras;
}

export const STAY_D_EDITORIAL_COPY = {
  "zh-Hant": {
    backHome: "回 Jabiko 自習室",
    kicker: "JABIKO 推薦｜東京住宿",
    title: "下一次來東京，不只是觀光。用學過的日文，和家人朋友一起更深入地享受東京的日常。",
    body: "不只是「來東京旅行」，也試著「像生活一樣感受東京」。Stay.D 適合想和家人朋友一起體驗東京日常的人。",
    airbnbCta: "在 Airbnb 查看 Stay.D",
    video: {
      watch: "▶ 看 Stay.D 介紹影片",
      collapse: "收合介紹影片",
      iframeTitle: "Stay.D 介紹影片",
      airbnbCta: "喜歡 Stay.D？到 Airbnb 查看 Stay.D"
    },
    page: {
      videoTitle: "先感受一下 Stay.D 的日常",
      videoIntro: "介紹影片不會自動播放；想多了解時，再按一下載入。",
      finalTitle: "把東京，過成一段日常",
      finalBody: "想知道更多房況細節，或直接查看 Stay.D，請到 Airbnb 房源頁。"
    }
  },
  ja: {
    backHome: "Jabiko自習室に戻る",
    kicker: "JABIKOおすすめ｜東京ステイ",
    title: "次の東京は、観光するだけじゃない。学んだ日本語を使いながら、家族や友人と東京の日常をもっと深く楽しもう。",
    body: "東京を「旅行する」だけでなく、「暮らすように楽しむ」滞在へ。Stay.Dは、家族や友人と一緒に東京の日常を楽しみたい人におすすめのステイです。",
    airbnbCta: "Stay.DをAirbnbで見る",
    video: {
      watch: "▶ Stay.Dの紹介動画を見る",
      collapse: "紹介動画を閉じる",
      iframeTitle: "Stay.Dの紹介動画",
      airbnbCta: "Stay.Dが気になったら、Airbnbで見る"
    },
    page: {
      videoTitle: "動画で雰囲気を確認",
      videoIntro: "紹介動画は自動再生されません。見たいときに読み込めます。",
      finalTitle: "東京の日常を、もっと深く",
      finalBody: "Stay.Dの詳細はAirbnbの物件ページをご覧ください。"
    }
  },
  en: {
    backHome: "Back to the Jabiko study room",
    kicker: "JABIKO PICK | TOKYO STAY",
    title:
      "Next time in Tokyo, don’t just sightsee. Use the Japanese you’ve learned and enjoy more of everyday Tokyo with family or friends.",
    body: "Go beyond visiting Tokyo and spend your stay a little more like you live here. Stay.D is a recommended option for travelers who want to share everyday Tokyo with family or friends.",
    airbnbCta: "View Stay.D on Airbnb",
    video: {
      watch: "▶ Watch the Stay.D introduction video",
      collapse: "Collapse the introduction video",
      iframeTitle: "Stay.D introduction video",
      airbnbCta: "Like Stay.D? View it on Airbnb"
    },
    page: {
      videoTitle: "Get a feel for Stay.D",
      videoIntro: "The introduction video never autoplays. Load it when you want to see more.",
      finalTitle: "Make everyday Tokyo yours",
      finalBody: "Find property details and view Stay.D on the Airbnb listing."
    }
  }
} satisfies Record<StayDLocale, StayDEditorialCopy>;

export function isStayDLocale(language: Language): language is StayDLocale {
  return (STAY_D_REQUIRED_LOCALES as readonly string[]).includes(language);
}
