import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlogArticlePage } from "./BlogArticlePage";

describe("BlogArticlePage", () => {
  it("renders the SWEET STEP article from the canonical slug", () => {
    render(
      <BlogArticlePage
        slug="sweet-steady-sweet-step"
        language="zh-Hant"
        onBack={vi.fn()}
        onCta={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /SWEET STEADY - SWEET STEP/ })
    ).toBeInTheDocument();
    expect(screen.getByText("ありのまま")).toBeInTheDocument();
    expect(screen.getByText("（ありのまま）")).toBeInTheDocument();
    expect(screen.getByText("強がる")).toBeInTheDocument();
    expect(screen.getByText(/大輪の種はここにある/)).toBeInTheDocument();
  });

  it("keeps the old SWEET STEP slug readable as a legacy alias", () => {
    render(
      <BlogArticlePage
        slug="sweet-step-steady"
        language="zh-Hant"
        onBack={vi.fn()}
        onCta={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /SWEET STEADY - SWEET STEP/ })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Article not found|文章不存在/)).not.toBeInTheDocument();
  });
});
