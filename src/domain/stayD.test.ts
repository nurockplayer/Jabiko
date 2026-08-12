import { describe, expect, it } from "vitest";
import { LAUNCHED_LANGUAGES } from "../i18n";
import {
  STAY_D_AIRBNB_ROOM_ID,
  STAY_D_AIRBNB_URL,
  STAY_D_EDITORIAL_COPY,
  STAY_D_HOME_TEASER,
  STAY_D_REQUIRED_LOCALES,
  STAY_D_VIDEO_ID,
  STAY_D_VIDEO_START_SECONDS,
  isStayDLocale
} from "./stayD";

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(allStrings);
  }
  return [];
}

describe("Stay.D editorial domain contract (#748)", () => {
  it("keeps the approved Airbnb and YouTube destinations exact", () => {
    expect(STAY_D_AIRBNB_ROOM_ID).toBe("1518015758376242668");
    expect(STAY_D_AIRBNB_URL).toBe(
      "https://www.airbnb.com/rooms/1518015758376242668"
    );
    expect(STAY_D_VIDEO_ID).toBe("wXx_t8JTyDE");
    expect(STAY_D_VIDEO_START_SECONDS).toBe(70);
  });

  it("has complete editorial copy for every launched locale without fallback", () => {
    expect(STAY_D_REQUIRED_LOCALES).toEqual(LAUNCHED_LANGUAGES);
    expect(Object.keys(STAY_D_EDITORIAL_COPY).sort()).toEqual(
      [...STAY_D_REQUIRED_LOCALES].sort()
    );
    for (const locale of STAY_D_REQUIRED_LOCALES) {
      expect(isStayDLocale(locale)).toBe(true);
      const strings = allStrings(STAY_D_EDITORIAL_COPY[locale]);
      expect(strings.length, locale).toBeGreaterThan(0);
      expect(strings.every((value) => value.trim().length > 0), locale).toBe(true);
    }
  });

  it("uses the frozen #748 editorial primary CTA in all three locales", () => {
    expect(STAY_D_EDITORIAL_COPY["zh-Hant"].airbnbCta).toBe("在 Airbnb 查看 Stay.D");
    expect(STAY_D_EDITORIAL_COPY.ja.airbnbCta).toBe("Stay.DをAirbnbで見る");
    expect(STAY_D_EDITORIAL_COPY.en.airbnbCta).toBe("View Stay.D on Airbnb");
  });

  it("uses the frozen #748 editorial headline/kicker/body in all three locales", () => {
    expect(STAY_D_EDITORIAL_COPY["zh-Hant"].kicker).toBe("JABIKO 推薦｜東京住宿");
    expect(STAY_D_EDITORIAL_COPY.ja.kicker).toBe("JABIKOおすすめ｜東京ステイ");
    expect(STAY_D_EDITORIAL_COPY.en.kicker).toBe("JABIKO PICK | TOKYO STAY");

    expect(STAY_D_EDITORIAL_COPY["zh-Hant"].title).toBe(
      "下一次來東京，不只是觀光。用學過的日文，和家人朋友一起更深入地享受東京的日常。"
    );
    expect(STAY_D_EDITORIAL_COPY.ja.title).toBe(
      "次の東京は、観光するだけじゃない。学んだ日本語を使いながら、家族や友人と東京の日常をもっと深く楽しもう。"
    );
    expect(STAY_D_EDITORIAL_COPY.en.title).toBe(
      "Next time in Tokyo, don’t just sightsee. Use the Japanese you’ve learned and enjoy more of everyday Tokyo with family or friends."
    );
  });

  it("never enumerates listing-style property specs in required copy", () => {
    const serialized = JSON.stringify(STAY_D_EDITORIAL_COPY);
    // Removed #748: completion year, floor area, floors, 10 Gbps, kitchen,
    // bed count, station walking minutes, price/availability conversion copy.
    for (const forbidden of [
      "2025",
      "52m",
      "52 m",
      "3階",
      "三層",
      "three-floor",
      "10 Gbps",
      "10Gbps",
      "ダブルベッド",
      "雙人床",
      "double beds",
      "キッチン",
      "廚房",
      "kitchen",
      "徒歩",
      "步行",
      "5-minute walk",
      "料金",
      "空室",
      "price & availability",
      "最新價格"
    ]) {
      expect(serialized, forbidden).not.toContain(forbidden);
    }
  });

  it("does not put Notion or transient impression IDs into production data", () => {
    const serialized = JSON.stringify(STAY_D_EDITORIAL_COPY);
    expect(serialized).not.toMatch(
      /notion\.(?:so|site)|amazonaws\.com|airbnbstatic\.com|airbnbusercontent\.com|muscache\.com|X-Amz-|source_impression_id/i
    );
  });
});

describe("Stay.D Home teaser domain contract (#750)", () => {
  it("has the frozen #750 Home teaser copy for every launched locale", () => {
    expect(STAY_D_HOME_TEASER).toBeDefined();
    expect(Object.keys(STAY_D_HOME_TEASER).sort()).toEqual(
      [...STAY_D_REQUIRED_LOCALES].sort()
    );
    for (const locale of STAY_D_REQUIRED_LOCALES) {
      const strings = allStrings(STAY_D_HOME_TEASER[locale]);
      expect(strings.length, locale).toBeGreaterThan(0);
      expect(strings.every((value) => value.trim().length > 0), locale).toBe(true);
    }
  });

  it("keeps the frozen #750 Home teaser kicker/headline/body in all three locales", () => {
    expect(STAY_D_HOME_TEASER["zh-Hant"].kicker).toBe("JABIKO 推薦 · 東京住宿");
    expect(STAY_D_HOME_TEASER["zh-Hant"].headline).toBe(
      "在東京，來一趟真正用上學過日文的旅行。"
    );
    expect(STAY_D_HOME_TEASER["zh-Hant"].body).toBe(
      "想和家人朋友一起感受觀光景點之外的東京日常嗎？JABIKO 推薦 Stay.D，作為另一種更貼近生活的東京停留方式。"
    );

    expect(STAY_D_HOME_TEASER.ja.kicker).toBe("JABIKOおすすめ · 東京ステイ");
    expect(STAY_D_HOME_TEASER.ja.headline).toBe(
      "東京で、学んだ日本語を使う旅へ。"
    );
    expect(STAY_D_HOME_TEASER.ja.body).toBe(
      "家族や友人と、観光だけでは見えない東京の日常を楽しみたい人へ。JABIKOから Stay.D を紹介します。"
    );

    expect(STAY_D_HOME_TEASER.en.kicker).toBe("JABIKO PICK · TOKYO STAY");
    expect(STAY_D_HOME_TEASER.en.headline).toBe(
      "Put your Japanese to use in Tokyo."
    );
    expect(STAY_D_HOME_TEASER.en.body).toBe(
      "For travelers who want to enjoy everyday Tokyo beyond sightseeing with family or friends, Jabiko recommends Stay.D as one way to stay closer to local life."
    );
  });

  it("keeps the frozen #750 Home CTAs distinct from the /stay-d primary CTA", () => {
    // Home primary CTA is the direct Airbnb path, intentionally shortened.
    expect(STAY_D_HOME_TEASER["zh-Hant"].primaryCta).toBe("查看 Stay.D");
    expect(STAY_D_HOME_TEASER.ja.primaryCta).toBe("Stay.Dを見る");
    expect(STAY_D_HOME_TEASER.en.primaryCta).toBe("View Stay.D");

    // Secondary video action stays lightweight on Home (#750).
    expect(STAY_D_HOME_TEASER["zh-Hant"].video.watch).toBe("看介紹影片");
    expect(STAY_D_HOME_TEASER.ja.video.watch).toBe("紹介動画を見る");
    expect(STAY_D_HOME_TEASER.en.video.watch).toBe("Watch introduction video");

    // #750: Home copy is split from /stay-d copy -- shortening the Home teaser
    // must never rewrite the /stay-d editorial copy.
    expect(STAY_D_HOME_TEASER["zh-Hant"].primaryCta).not.toBe(
      STAY_D_EDITORIAL_COPY["zh-Hant"].airbnbCta
    );
    expect(STAY_D_HOME_TEASER["zh-Hant"].headline).not.toBe(
      STAY_D_EDITORIAL_COPY["zh-Hant"].title
    );
    expect(STAY_D_EDITORIAL_COPY["zh-Hant"].title).toBe(
      "下一次來東京，不只是觀光。用學過的日文，和家人朋友一起更深入地享受東京的日常。"
    );
  });

  it("never enumerates listing-style property specs in the Home teaser", () => {
    const serialized = JSON.stringify(STAY_D_HOME_TEASER);
    for (const forbidden of [
      "2025",
      "52m",
      "52 m",
      "3階",
      "三層",
      "three-floor",
      "10 Gbps",
      "10Gbps",
      "ダブルベッド",
      "雙人床",
      "double beds",
      "キッチン",
      "廚房",
      "kitchen",
      "徒歩",
      "步行",
      "5-minute walk",
      "料金",
      "空室",
      "price & availability",
      "最新價格"
    ]) {
      expect(serialized, forbidden).not.toContain(forbidden);
    }
  });
});
