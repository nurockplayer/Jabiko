import { describe, expect, it } from "vitest";
import { PARTNER_REGISTRY, partnersForLocale } from "./partners";
import { STAY_D_AIRBNB_URL, STAY_D_EDITORIAL_COPY, STAY_D_REQUIRED_LOCALES } from "./stayD";

describe("partner registry", () => {
  it("has duplicate-free ids", () => {
    const ids = PARTNER_REGISTRY.map((partner) => partner.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carries non-empty copy for every locale a partner claims", () => {
    for (const partner of PARTNER_REGISTRY) {
      expect(partner.locales.length, partner.id).toBeGreaterThan(0);
      for (const locale of partner.locales) {
        const copy = partner.copy[locale];
        expect(copy, `${partner.id}/${locale}`).toBeDefined();
        for (const value of [copy!.kicker, copy!.name, copy!.body, copy!.cta]) {
          expect(value.trim().length, `${partner.id}/${locale}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("offers a partner only in the locales it has copy for", () => {
    for (const locale of STAY_D_REQUIRED_LOCALES) {
      expect(partnersForLocale(locale).map((partner) => partner.id), locale).toEqual(["stay-d"]);
    }
    for (const locale of ["ko", "vi", "th", "id", "my"] as const) {
      expect(partnersForLocale(locale), locale).toEqual([]);
    }
  });

  it("keeps the Stay.D entry on the listing URL and its established placements", () => {
    const stayD = PARTNER_REGISTRY.find((partner) => partner.id === "stay-d");
    expect(stayD).toBeDefined();
    expect(stayD!.url).toBe(STAY_D_AIRBNB_URL);
    expect(stayD!.linkPlacement).toBe("stay-d-hero-airbnb");
    expect(stayD!.video?.triggerPlacement).toBe("stay-d-video");
    expect(stayD!.video?.linkPlacement).toBe("stay-d-video-airbnb");
    expect(stayD!.copy["zh-Hant"]!.name).toBe(STAY_D_EDITORIAL_COPY["zh-Hant"].title);
  });
});
