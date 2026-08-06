import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LAUNCHED_LANGUAGES } from "../i18n";
import { LegalPanel } from "./LegalPanel";

describe("LegalPanel", () => {
  it("renders the privacy policy and marks its footer link current", () => {
    render(<LegalPanel language="zh-Hant" page="privacy" />);

    expect(screen.getByRole("heading", { name: "隱私政策" })).toBeInTheDocument();
    expect(screen.getByText(/Google OAuth 與 Supabase Auth/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "隱私政策" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "使用條款" })).toHaveAttribute(
      "href",
      "/terms"
    );
  });

  it("renders launched English and Japanese legal copy", () => {
    const view = render(<LegalPanel language="en" page="terms" />);
    expect(screen.getByRole("heading", { name: "Terms of Use" })).toBeInTheDocument();
    expect(screen.getByText(/does not grant permission/)).toBeInTheDocument();

    view.rerender(<LegalPanel language="ja" page="privacy" />);
    expect(screen.getByRole("heading", { name: "プライバシーポリシー" })).toBeInTheDocument();
    expect(screen.getByText(/Google OAuth と Supabase Auth/)).toBeInTheDocument();
  });

  it("renders the self-service history-deletion section in every launched privacy locale", () => {
    const expected: Record<
      "zh-Hant" | "ja" | "en",
      { heading: string; marker: RegExp }
    > = {
      "zh-Hant": {
        heading: "7. 刪除已同步的練習紀錄",
        marker: /由帳號區自助刪除該帳號已同步的練習作答紀錄/
      },
      ja: {
        heading: "7. 同期した練習履歴の削除",
        marker: /アカウント領域からこのアカウントに同期した練習の回答記録を自分で削除/
      },
      en: {
        heading: "7. Deleting your synced practice history",
        marker: /delete the practice answers synced to this account on their own from the account area/
      }
    };

    const view = render(<LegalPanel language="zh-Hant" page="privacy" />);

    // The covered locales must match the launched set exactly.
    expect(Object.keys(expected)).toEqual([...LAUNCHED_LANGUAGES]);

    for (const language of Object.keys(expected) as (keyof typeof expected)[]) {
      const { heading, marker } = expected[language];
      view.rerender(<LegalPanel language={language} page="privacy" />);
      expect(screen.getByRole("heading", { name: heading }), language).toBeInTheDocument();
      expect(screen.getByText(marker), language).toBeInTheDocument();
      // No raw key or zh fallback leaking through.
      expect(screen.queryByText(/^\{/), language).not.toBeInTheDocument();
      expect(screen.queryByText(/^sections\./), language).not.toBeInTheDocument();
      // The section order holds: self-service deletion sits before the
      // policy-change section in every locale.
      const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      const deletionIndex = headings.indexOf(heading);
      const changeIndex = headings.findIndex((h) => h?.startsWith("8. "));
      expect(deletionIndex, language).toBeGreaterThanOrEqual(0);
      expect(changeIndex, language).toBeGreaterThan(deletionIndex);
    }
  });
});
