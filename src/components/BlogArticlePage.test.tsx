import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { articleBySlug } from "../domain/articles";
import { BlogArticlePage } from "./BlogArticlePage";

const analyticsMocks = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock("../lib/analytics", () => analyticsMocks);
vi.mock("../domain/articles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../domain/articles")>();
  return { ...actual, articleBySlug: vi.fn(actual.articleBySlug) };
});

describe("BlogArticlePage", () => {
  beforeEach(() => {
    analyticsMocks.trackEvent.mockClear();
    vi.mocked(articleBySlug).mockClear();
  });

  it("fires article_viewed once after a published article is displayed", () => {
    render(
      <BlogArticlePage
        slug="sweet-steady-sweet-step"
        language="zh-Hant"
        onBack={vi.fn()}
        onCta={vi.fn()}
      />
    );

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith("article_viewed", {
      slug: "sweet-steady-sweet-step"
    });
  });

  it("dedupes rerenders and StrictMode while tracking a new published slug", () => {
    const props = {
      language: "zh-Hant" as const,
      onBack: vi.fn(),
      onCta: vi.fn()
    };
    const { rerender } = render(
      <StrictMode>
        <BlogArticlePage slug="sweet-steady-sweet-step" {...props} />
      </StrictMode>
    );

    rerender(
      <StrictMode>
        <BlogArticlePage slug="sweet-steady-sweet-step" {...props} />
      </StrictMode>
    );
    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);

    rerender(
      <StrictMode>
        <BlogArticlePage slug="cho-saikyo-tokimeki" {...props} />
      </StrictMode>
    );
    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(2);
    expect(analyticsMocks.trackEvent).toHaveBeenLastCalledWith("article_viewed", {
      slug: "cho-saikyo-tokimeki"
    });
  });

  it("does not track a draft or an unknown article", () => {
    const published = articleBySlug("sweet-steady-sweet-step");
    if (!published) throw new Error("Expected published article fixture");
    vi.mocked(articleBySlug).mockReturnValueOnce({ ...published, draft: true });

    const { rerender } = render(
      <BlogArticlePage slug="draft-article" language="zh-Hant" onBack={vi.fn()} onCta={vi.fn()} />
    );
    rerender(
      <BlogArticlePage slug="unknown-article" language="zh-Hant" onBack={vi.fn()} onCta={vi.fn()} />
    );

    expect(analyticsMocks.trackEvent).not.toHaveBeenCalled();
  });

  it("tracks the same article again after leaving its route", () => {
    const props = {
      language: "zh-Hant" as const,
      onBack: vi.fn(),
      onCta: vi.fn()
    };
    const { rerender } = render(<BlogArticlePage slug="sweet-steady-sweet-step" {...props} />);
    rerender(<BlogArticlePage slug="unknown-article" {...props} />);
    rerender(<BlogArticlePage slug="sweet-steady-sweet-step" {...props} />);

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(2);
  });

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
