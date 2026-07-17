import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
