import type { Language } from "../i18n";

type GamePreviewCopy = {
  entry: string;
  entryHint: string;
  skip: string;
  identity: string;
  preview: string;
  heading: string;
  smallTalk: string;
  returnTraining: string;
};

const localizedGamePreviewCopy: Record<"zh-Hant" | "ja" | "en", GamePreviewCopy> = {
  "zh-Hant": {
    entry: "日常",
    entryHint: "故事",
    skip: "跳到主要內容",
    identity: "Jabiko · 日常",
    preview: "故事",
    heading: "日常",
    smallTalk: "前往日常會話",
    returnTraining: "回到練習"
  },
  ja: {
    entry: "日常",
    entryHint: "物語",
    skip: "メインコンテンツへ",
    identity: "Jabiko · 日常",
    preview: "物語",
    heading: "日常",
    smallTalk: "日常会話へ",
    returnTraining: "練習に戻る"
  },
  en: {
    entry: "Everyday",
    entryHint: "Story",
    skip: "Skip to main content",
    identity: "Jabiko · Everyday",
    preview: "Story",
    heading: "Everyday",
    smallTalk: "Go to Small Talk",
    returnTraining: "Return to Training"
  }
};

// Game shell copy currently ships in the three launched UI locales. Keep
// the existing Japanese fallback for every locale that is not launched here.
export function gamePreviewCopyFor(language: Language): GamePreviewCopy {
  return localizedGamePreviewCopy[language as keyof typeof localizedGamePreviewCopy] ?? localizedGamePreviewCopy.ja;
}
