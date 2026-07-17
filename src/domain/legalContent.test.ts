import { describe, expect, it } from "vitest";
import { LAUNCHED_LANGUAGES } from "../i18n";
import { legalCopyFor, legalDocumentFor } from "./legalContent";

describe("legal content", () => {
  it("provides privacy and terms copy for every launched language", () => {
    for (const language of LAUNCHED_LANGUAGES) {
      const copy = legalCopyFor(language);
      expect(copy.privacy.title, `${language}:privacy`).toBeTruthy();
      expect(copy.privacy.sections.length, `${language}:privacy sections`).toBeGreaterThan(0);
      expect(copy.terms.title, `${language}:terms`).toBeTruthy();
      expect(copy.terms.sections.length, `${language}:terms sections`).toBeGreaterThan(0);
    }
  });

  it("states the actual sync and analytics boundaries", () => {
    const privacy = legalDocumentFor("zh-Hant", "privacy");
    const text = privacy.sections
      .flatMap((section) => [...(section.paragraphs ?? []), ...(section.items ?? [])])
      .join("\n");

    expect(text).toContain("你送出的答案");
    expect(text).toContain("題目全文");
    expect(text).toContain("不會出售個人資料");
  });

  it("keeps sync and question-report disclosures aligned across languages", () => {
    const disclosureText = (language: "zh-Hant" | "ja" | "en") =>
      legalDocumentFor(language, "privacy").sections
        .flatMap((section) => [...(section.paragraphs ?? []), ...(section.items ?? [])])
        .join("\n");

    const zh = disclosureText("zh-Hant");
    expect(zh).toContain("單字識別碼");
    expect(zh).toContain("作答目標形式");
    expect(zh).toContain("題型標籤");
    expect(zh).toContain("單字表記與讀音");

    const ja = disclosureText("ja");
    expect(ja).toContain("語彙 ID");
    expect(ja).toContain("解答対象の形式");
    expect(ja).toContain("問題形式のラベル");
    expect(ja).toContain("表記と読み");

    const en = disclosureText("en");
    expect(en).toContain("vocabulary IDs");
    expect(en).toContain("target forms");
    expect(en).toContain("question-type label");
    expect(en).toContain("surface form and reading");
  });

  it("does not claim that public source code is open source", () => {
    const terms = legalDocumentFor("zh-Hant", "terms");
    const text = terms.sections
      .flatMap((section) => [...(section.paragraphs ?? []), ...(section.items ?? [])])
      .join("\n");

    expect(text).toContain("不代表已授權");
    expect(text).not.toContain("開源");
  });
});
