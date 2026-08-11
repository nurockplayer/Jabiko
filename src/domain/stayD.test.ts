import { describe, expect, it } from "vitest";
import { LAUNCHED_LANGUAGES } from "../i18n";
import {
  STAY_D_AIRBNB_ROOM_ID,
  STAY_D_AIRBNB_URL,
  STAY_D_HOME_COPY,
  STAY_D_HOME_IMAGE,
  STAY_D_REQUIRED_LOCALES,
  STAY_D_VIDEO_ID,
  STAY_D_VIDEO_START_SECONDS,
  isStayDLocale
} from "./stayD";
import { STAY_D_PAGE_COPY, STAY_D_PAGE_IMAGES } from "./stayDPage";

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(allStrings);
  }
  return [];
}

describe("Stay.D domain contract (#744)", () => {
  it("keeps the approved Airbnb and YouTube destinations exact", () => {
    expect(STAY_D_AIRBNB_ROOM_ID).toBe("1518015758376242668");
    expect(STAY_D_AIRBNB_URL).toBe(
      "https://www.airbnb.com/rooms/1518015758376242668"
    );
    expect(STAY_D_VIDEO_ID).toBe("wXx_t8JTyDE");
    expect(STAY_D_VIDEO_START_SECONDS).toBe(70);
  });

  it("has complete Stay.D copy for every launched locale without fallback", () => {
    expect(STAY_D_REQUIRED_LOCALES).toEqual(LAUNCHED_LANGUAGES);
    expect(Object.keys(STAY_D_HOME_COPY).sort()).toEqual(
      [...STAY_D_REQUIRED_LOCALES].sort()
    );
    for (const locale of STAY_D_REQUIRED_LOCALES) {
      expect(isStayDLocale(locale)).toBe(true);
      const strings = allStrings(STAY_D_HOME_COPY[locale]);
      expect(strings.length, locale).toBeGreaterThan(0);
      expect(strings.every((value) => value.trim().length > 0), locale).toBe(true);

      const pageStrings = allStrings(STAY_D_PAGE_COPY[locale]);
      expect(pageStrings.length, locale).toBeGreaterThan(0);
      expect(pageStrings.every((value) => value.trim().length > 0), locale).toBe(true);
    }
  });

  it("does not put Notion or transient impression IDs into production data", () => {
    const serialized = JSON.stringify({
      home: STAY_D_HOME_COPY,
      page: STAY_D_PAGE_COPY,
      homeImage: STAY_D_HOME_IMAGE,
      pageImages: STAY_D_PAGE_IMAGES
    });
    expect(serialized).not.toMatch(
      /notion\.(?:so|site)|amazonaws\.com|airbnbstatic\.com|airbnbusercontent\.com|muscache\.com|X-Amz-|source_impression_id/i
    );
  });

  it("uses only optimized, intrinsic-size repository assets", () => {
    expect(STAY_D_PAGE_IMAGES.map((image) => image.id)).toEqual([
      "exterior",
      "living",
      "kitchen",
      "bedroom",
      "bath",
      "layout"
    ]);
    for (const image of [STAY_D_HOME_IMAGE, ...STAY_D_PAGE_IMAGES]) {
      expect(image.src).toMatch(/^\/stay-d\/[a-z0-9-]+\.webp$/);
      expect(image.width).toBeGreaterThan(0);
      expect(image.height).toBeGreaterThan(0);
    }
    for (const candidate of STAY_D_HOME_IMAGE.srcSet.split(",")) {
      const src = candidate.trim().split(/\s+/)[0];
      expect(src).toMatch(/^\/stay-d\/[a-z0-9-]+\.webp$/);
    }
  });
});
