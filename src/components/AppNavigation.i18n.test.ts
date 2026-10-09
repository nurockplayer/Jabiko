import { describe, expect, it } from "vitest";
import { getAppNavigationCopy } from "./AppNavigation.i18n";

const fallback = {
  today: "首頁",
  practice: "挑戰",
  learn: "學習",
  conversation: "日常會話練習室",
  resources: "資源",
  skipToContent: "Skip to main content",
  resourcesCurrentLabel: (page: string) => `資源（目前：${page}）`
};

describe("localized JT-1 navigation labels", () => {
  it.each([
    ["zh-Hant", { today: "今日", practice: "練習", learn: "學習", conversation: "會話", resources: "資料", skipToContent: "跳至主要內容" }],
    ["ja", { today: "今日", practice: "練習", learn: "学習", conversation: "会話", resources: "資料", skipToContent: "本文へスキップ" }],
    ["en", { today: "Today", practice: "Practice", learn: "Learn", conversation: "Conversation", resources: "Resources", skipToContent: "Skip to main content" }]
  ] as const)("uses the accepted shell labels in %s", (locale, expected) => {
    const { resourcesCurrentLabel, ...labels } = getAppNavigationCopy(locale, fallback);
    expect(typeof resourcesCurrentLabel).toBe("function");
    expect(labels).toEqual(expected);
  });

  it.each([
    ["zh-Hant", "資料（目前：規則表）"],
    ["ja", "資料（現在：規則表）"],
    ["en", "Resources (current: Rules)"]
  ] as const)("uses the accepted Resources name for current-page copy in %s", (locale, expected) => {
    expect(getAppNavigationCopy(locale, fallback).resourcesCurrentLabel(locale === "en" ? "Rules" : "規則表")).toBe(expected);
  });

  it("retains existing localized labels as the fallback for unlaunched locales", () => {
    expect(getAppNavigationCopy("ko", fallback)).toEqual(fallback);
  });
});
