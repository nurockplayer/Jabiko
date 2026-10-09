import type { LocaleCode } from "../domain/types";

export interface AppNavigationCopy {
  today: string;
  practice: string;
  learn: string;
  conversation: string;
  resources: string;
  skipToContent: string;
  resourcesCurrentLabel: (page: string) => string;
}

const JT1_SHELL_COPY: Partial<Record<LocaleCode, AppNavigationCopy>> = {
  "zh-Hant": {
    today: "今日",
    practice: "練習",
    learn: "學習",
    conversation: "會話",
    resources: "資料",
    skipToContent: "跳至主要內容",
    resourcesCurrentLabel: (page) => `資料（目前：${page}）`
  },
  ja: {
    today: "今日",
    practice: "練習",
    learn: "学習",
    conversation: "会話",
    resources: "資料",
    skipToContent: "本文へスキップ",
    resourcesCurrentLabel: (page) => `資料（現在：${page}）`
  },
  en: {
    today: "Today",
    practice: "Practice",
    learn: "Learn",
    conversation: "Conversation",
    resources: "Resources",
    skipToContent: "Skip to main content",
    resourcesCurrentLabel: (page) => `Resources (current: ${page})`
  }
};

/** Accepted shell labels for launched locales; unfinished locales keep their existing copy. */
export function getAppNavigationCopy(locale: LocaleCode, fallback: AppNavigationCopy): AppNavigationCopy {
  return JT1_SHELL_COPY[locale] ?? fallback;
}
