import { describe, expect, it } from "vitest";
import { pickLocalized, pickLocalizedOptional } from "./localizedContent";

describe("pickLocalized", () => {
  const zh = "這題在問動詞的て形。";

  it("falls back to the zh-Hant source when there is no overlay", () => {
    expect(pickLocalized(zh, undefined, "en")).toBe(zh);
  });

  it("falls back to the source when the overlay has no entry for the language", () => {
    expect(pickLocalized(zh, { ja: "これはて形の問題です。" }, "en")).toBe(zh);
  });

  it("returns the localized variant when present for the language", () => {
    expect(pickLocalized(zh, { en: "This asks about the te-form." }, "en")).toBe(
      "This asks about the te-form."
    );
  });

  it("treats an empty/whitespace overlay value as missing and falls back", () => {
    expect(pickLocalized(zh, { en: "" }, "en")).toBe(zh);
    expect(pickLocalized(zh, { en: "   " }, "en")).toBe(zh);
  });

  it("uses the source for the source locale itself", () => {
    expect(pickLocalized(zh, { en: "x" }, "zh-Hant")).toBe(zh);
  });
});

describe("pickLocalizedOptional", () => {
  it("returns undefined when the source field is absent (nullish)", () => {
    expect(pickLocalizedOptional(undefined, { en: "hint" }, "en")).toBeUndefined();
  });

  it("localizes a present source, falling back to the zh source", () => {
    expect(pickLocalizedOptional("提示", { en: "hint" }, "en")).toBe("hint");
    expect(pickLocalizedOptional("提示", undefined, "en")).toBe("提示");
  });

  it("keeps an empty-string source as present (nullish check, NOT truthy)", () => {
    // "" is a real (empty) authored value, not an absent field, so it must
    // NOT collapse to undefined -- otherwise an empty hint would wrongly fall
    // through to the answer-leaky promptContextZh fallback.
    expect(pickLocalizedOptional("", undefined, "en")).toBe("");
  });
});
