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

  it("renders collapsed vocab tables as <details> with the heading + word count as summary", () => {
    const { container } = render(
      <BlogArticlePage
        slug="japanese-restaurant-ordering-phrases"
        language="zh-Hant"
        onBack={vi.fn()}
        onCta={vi.fn()}
      />
    );

    const details = container.querySelectorAll("details.blog-vocab-details");
    expect(details.length).toBeGreaterThan(0);
    // Every vocab table in this tool article is collapsed (lives inside a details).
    expect(container.querySelectorAll(".blog-vocab").length).toBe(details.length);

    const first = details[0]!;
    const summary = first.querySelector("summary.blog-vocab-summary");
    expect(summary).not.toBeNull();
    // Summary carries the section heading text plus the word count.
    expect(summary!.textContent).toMatch(/個詞/);
    expect(summary!.textContent!.length).toBeGreaterThan(3);
    // The heading is consumed into the summary -- not duplicated as an <h2>.
    expect(first.querySelector("h2")).toBeNull();
    // Collapsed content still exists in the DOM (prerender/SEO + find-in-page).
    expect(first.querySelector(".blog-vocab")).not.toBeNull();
    expect(first.querySelectorAll(".blog-vocab-item").length).toBeGreaterThan(0);
  });

  it("falls back to a generic 單字表 summary when the table is separated from its heading", () => {
    const { container } = render(
      <BlogArticlePage
        slug="japanese-taste-texture-expressions"
        language="zh-Hant"
        onBack={vi.fn()}
        onCta={vi.fn()}
      />
    );

    const details = container.querySelectorAll("details.blog-vocab-details");
    // All six tables collapse; the last one follows prose, not a heading.
    expect(details.length).toBe(6);
    expect(container.querySelectorAll(".blog-vocab").length).toBe(6);
    const titles = [...container.querySelectorAll(".blog-vocab-summary-title")].map(
      (el) => el.textContent
    );
    expect(titles).toContain("單字表");
    // Its section heading survives as a real <h2> above the prose.
    expect(
      [...container.querySelectorAll("h2")].some((el) => el.textContent?.includes("吃完"))
    ).toBe(true);
  });

  it("keeps non-collapsed vocab tables as plain blocks", () => {
    const { container } = render(
      <BlogArticlePage
        slug="sweet-steady-sweet-step"
        language="zh-Hant"
        onBack={vi.fn()}
        onCta={vi.fn()}
      />
    );

    expect(container.querySelectorAll("details.blog-vocab-details").length).toBe(0);
    expect(container.querySelectorAll(".blog-vocab").length).toBeGreaterThan(0);
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
