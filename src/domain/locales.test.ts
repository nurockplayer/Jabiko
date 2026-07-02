import { describe, expect, it } from "vitest";
import { CONTENT_LOCALES, LOCALE_CODES, SOURCE_LOCALE } from "./types";
// @ts-expect-error -- plain .mjs tooling module, no types
import { LOCALE_CODES as SCRIPT_LOCALE_CODES, LOCALE_NAME, NON_HAN_LOCALES, SOURCE_LOCALE as SCRIPT_SOURCE_LOCALE, TARGET_LOCALES } from "../../scripts/_locales.mjs";

// The .mjs scripts can't import the TS union, so they regex-read LOCALE_CODES
// back out of types.ts. This is the guard that the two never drift (a reformat
// of the const, or a code added to one side only, fails here — not silently).
describe("locale registry (TS <-> scripts)", () => {
  it("the script-side parse matches the TS source of truth exactly", () => {
    expect(SCRIPT_LOCALE_CODES).toEqual([...LOCALE_CODES]);
    expect(SCRIPT_SOURCE_LOCALE).toBe(SOURCE_LOCALE);
  });

  it("every locale has a human-readable name for translation prompts", () => {
    for (const code of LOCALE_CODES) {
      expect(LOCALE_NAME[code], code).toBeTruthy();
    }
  });

  it("TARGET_LOCALES is every code except the source", () => {
    expect(TARGET_LOCALES).toEqual(LOCALE_CODES.filter((c) => c !== SOURCE_LOCALE));
  });

  it("NON_HAN_LOCALES covers ko and my (the historical omission) but not ja", () => {
    expect(NON_HAN_LOCALES.has("ko")).toBe(true);
    expect(NON_HAN_LOCALES.has("my")).toBe(true);
    expect(NON_HAN_LOCALES.has("ja")).toBe(false);
    expect(NON_HAN_LOCALES.has(SOURCE_LOCALE)).toBe(false);
  });

  it("CONTENT_LOCALES is a subset of LOCALE_CODES and excludes the source", () => {
    for (const code of CONTENT_LOCALES) {
      expect(LOCALE_CODES).toContain(code);
      expect(code).not.toBe(SOURCE_LOCALE);
    }
  });
});
