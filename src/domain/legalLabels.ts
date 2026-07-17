import type { LocaleCode } from "./types";

export interface LegalPageLabels {
  navigationLabel: string;
  privacyLabel: string;
  termsLabel: string;
}

const LEGAL_LABELS = {
  "zh-Hant": {
    navigationLabel: "法律與隱私",
    privacyLabel: "隱私政策",
    termsLabel: "使用條款"
  },
  ja: {
    navigationLabel: "法的情報・プライバシー",
    privacyLabel: "プライバシーポリシー",
    termsLabel: "利用規約"
  },
  en: {
    navigationLabel: "Legal and privacy",
    privacyLabel: "Privacy Policy",
    termsLabel: "Terms of Use"
  }
} as const satisfies Record<"zh-Hant" | "ja" | "en", LegalPageLabels>;

export function legalLabelsFor(language: LocaleCode): LegalPageLabels {
  if (language === "zh-Hant" || language === "ja" || language === "en") {
    return LEGAL_LABELS[language];
  }
  return LEGAL_LABELS.en;
}
