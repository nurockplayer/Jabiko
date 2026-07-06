import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { articleBySlug } from "../domain/articles";
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
    expect(screen.getAllByText(/THE FIRST TAKE/).length).toBeGreaterThan(0);
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
    expect(screen.queryByText(/Article not found/)).not.toBeInTheDocument();
  });

  it("renders the CHO SAIKYO article with its awards hook", () => {
    render(
      <BlogArticlePage
        slug="cho-saikyo-tokimeki"
        language="zh-Hant"
        onBack={vi.fn()}
        onCta={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: /超最強/ })).toBeInTheDocument();
    expect(screen.getAllByText(/TikTokトレンド大賞2025/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/インパクト・ソング部門賞/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/推し活/).length).toBeGreaterThan(0);
  });

  it("renders the 日文教學 divider that opens the teaching half", () => {
    render(
      <BlogArticlePage
        slug="cho-saikyo-tokimeki"
        language="zh-Hant"
        onBack={vi.fn()}
        onCta={vi.fn()}
      />
    );

    const divider = screen.getByRole("separator", { name: "日文教學" });
    expect(divider).toBeInTheDocument();
    // The divider sits BEFORE every vocab table in document order (essay top,
    // teaching bottom).
    const body = divider.closest(".blog-article-body")!;
    const firstVocab = body.querySelector(".blog-vocab");
    expect(firstVocab).not.toBeNull();
    expect(
      divider.compareDocumentPosition(firstVocab!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("passes the article CTA payload to the app-level handler", async () => {
    const user = userEvent.setup();
    const onCta = vi.fn();
    const { container } = render(
      <BlogArticlePage
        slug="sweet-steady-sweet-step"
        language="zh-Hant"
        onBack={vi.fn()}
        onCta={onCta}
      />
    );

    const ctaButton = container.querySelector<HTMLButtonElement>(".blog-cta");
    expect(ctaButton).not.toBeNull();
    await user.click(ctaButton!);

    const article = articleBySlug("sweet-steady-sweet-step");
    const ctaBlock = article?.body.find((block) => block.kind === "cta");
    expect(ctaBlock?.kind).toBe("cta");
    if (ctaBlock?.kind !== "cta") {
      throw new Error("Expected SWEET STEP article to include a CTA block");
    }
    expect(onCta).toHaveBeenCalledWith(ctaBlock.cta);
  });
});
