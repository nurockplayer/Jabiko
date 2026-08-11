import { describe, expect, it } from "vitest";
import { LAUNCHED_LANGUAGES } from "../i18n";
import {
  STAY_D_AIRBNB_ROOM_ID,
  STAY_D_AIRBNB_URL,
  STAY_D_HOME_COPY,
  STAY_D_REQUIRED_LOCALES,
  STAY_D_VIDEO_ID,
  STAY_D_VIDEO_START_SECONDS,
  isStayDLocale
} from "./stayD";
import { STAY_D_PAGE_COPY } from "./stayDPage";

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
      page: STAY_D_PAGE_COPY
    });
    expect(serialized).not.toMatch(/notion/i);
    expect(serialized).not.toContain("source_impression_id");
  });
});
