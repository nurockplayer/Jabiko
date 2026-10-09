import type { Language } from "../i18n";

type GamePreviewCopy = {
  entry: string;
  entryHint: string;
  skip: string;
  identity: string;
  preview: string;
  heading: string;
  unavailable: string;
  smallTalk: string;
  returnTraining: string;
};

const localizedGamePreviewCopy: Record<"zh-Hant" | "ja" | "en", GamePreviewCopy> = {
  "zh-Hant": {
    entry: "日常",
    entryHint: "預覽",
    skip: "跳到主要內容",
    identity: "Jabiko · 日常",
    preview: "預覽",
    heading: "日常",
    unavailable: "完整的日常世界尚未開放。你現在可以到日常會話練習日語接話。",
    smallTalk: "前往日常會話",
    returnTraining: "回到練習"
  },
  ja: {
    entry: "日常",
    entryHint: "プレビュー",
    skip: "メインコンテンツへ",
    identity: "Jabiko · 日常",
    preview: "プレビュー",
    heading: "日常",
    unavailable: "日常の世界はまだ公開されていません。日常会話で日本語のやりとりを練習できます。",
    smallTalk: "日常会話へ",
    returnTraining: "練習に戻る"
  },
  en: {
    entry: "Everyday",
    entryHint: "Preview",
    skip: "Skip to main content",
    identity: "Jabiko · Everyday",
    preview: "Preview",
    heading: "Everyday",
    unavailable: "The Everyday world is not available yet. You can practise Japanese conversation in Small Talk.",
    smallTalk: "Go to Small Talk",
    returnTraining: "Return to Training"
  }
};

// Game preview copy currently ships in the three launched UI locales. Keep
// the existing Japanese fallback for every locale that is not launched here.
export function gamePreviewCopyFor(language: Language): GamePreviewCopy {
  return localizedGamePreviewCopy[language as keyof typeof localizedGamePreviewCopy] ?? localizedGamePreviewCopy.ja;
}
