import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePanel } from "./HomePanel";
import type { Attempt } from "../domain/types";
import { CONTENT_STATS } from "../domain/contentStats";

const noop = () => {};

const sampleAttempt: Attempt = {
  vocabularyId: "seed",
  targetForm: "reading",
  prompt: "seed",
  expectedAnswers: ["seed"],
  submittedAnswer: "seed",
  isCorrect: true,
  timestamp: 1,
  responseTimeMs: 100
};

function renderHome(overrides: Partial<Parameters<typeof HomePanel>[0]> = {}) {
  const props = {
    language: "zh-Hant" as const,
    progressAttempts: [] as Attempt[],
    reviewCount: 0,
    onNavigate: noop,
    onStartReview: noop,
    onStartVocab: noop,
    onStartDaily: noop,
    targetLevel: null,
    onChooseLevel: vi.fn(),
    ...overrides
  };
  render(<HomePanel {...props} />);
  return props;
}

describe("HomePanel level onboarding (#199)", () => {
  it("shows the choose-your-level card for a brand-new learner (no pref, no attempts)", () => {
    renderHome();
    expect(screen.getByText("選擇你的程度")).toBeInTheDocument();
  });

  it("choosing 初級 calls onChooseLevel with the n4n5 band", () => {
    const props = renderHome();
    fireEvent.click(screen.getByRole("button", { name: /初級/ }));
    expect(props.onChooseLevel).toHaveBeenCalledWith("n4n5");
  });

  it("maps 中級 -> n2n3 and 高級 -> n1n2", () => {
    const props = renderHome();
    fireEvent.click(screen.getByRole("button", { name: /中級/ }));
    fireEvent.click(screen.getByRole("button", { name: /高級/ }));
    expect(props.onChooseLevel).toHaveBeenNthCalledWith(1, "n2n3");
    expect(props.onChooseLevel).toHaveBeenNthCalledWith(2, "n1n2");
  });

  it("hides the card once a preference exists", () => {
    renderHome({ targetLevel: "n2n3" });
    expect(screen.queryByText("選擇你的程度")).not.toBeInTheDocument();
  });

  it("hides the card for a returning learner with attempts (even without a preference)", () => {
    renderHome({ progressAttempts: [sampleAttempt] });
    expect(screen.queryByText("選擇你的程度")).not.toBeInTheDocument();
  });
});

describe("HomePanel guide link", () => {
  it("renders a 使用說明書 link to the blog that opens safely in a new tab", () => {
    renderHome();
    const link = screen.getByRole("link", { name: /使用說明書/ });
    expect(link).toHaveAttribute("href", "https://hanayukii.dev/blog/jabiko-jlpt-app");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel") ?? "").toContain("noopener");
  });

  it("shows the guide link for returning learners too", () => {
    renderHome({ targetLevel: "n2n3", progressAttempts: [sampleAttempt] });
    expect(screen.getByRole("link", { name: /使用說明書/ })).toBeInTheDocument();
  });
});

describe("HomePanel feedback entry", () => {
  it("opens the anonymous feedback form from a footer button", () => {
    renderHome();
    expect(screen.queryByText("意見回饋")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /許願功能/ }));
    expect(screen.getByText("意見回饋")).toBeInTheDocument();
  });
});

describe("HomePanel newcomer first-screen (onboarding)", () => {
  it("hides the 繼續學 continue banner for a brand-new visitor (no attempts)", () => {
    renderHome();
    expect(screen.queryByText("上次還沒完成的章節。")).not.toBeInTheDocument();
  });

  it("still shows the continue banner for a returning learner with an incomplete chapter", () => {
    renderHome({ progressAttempts: [sampleAttempt], reviewCount: 0 });
    expect(screen.getByText("上次還沒完成的章節。")).toBeInTheDocument();
  });

  it("shows a first-time 'how it works' strip only for brand-new visitors", () => {
    renderHome();
    expect(screen.getByText(/第一次來/)).toBeInTheDocument();
  });

  it("hides the 'how it works' strip for returning learners", () => {
    renderHome({ progressAttempts: [sampleAttempt] });
    expect(screen.queryByText(/第一次來/)).not.toBeInTheDocument();
  });

  it("lets a newcomer dismiss the 'how it works' strip", () => {
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /知道了/ }));
    expect(screen.queryByText(/第一次來/)).not.toBeInTheDocument();
  });

  it("renders the free / no-signup kicker above the hero", () => {
    renderHome();
    expect(screen.getByText(/免註冊/)).toBeInTheDocument();
  });

  it("places the primary 開始今日練習 CTA before the hero heading in DOM order", () => {
    renderHome();
    const cta = screen.getByRole("button", { name: /開始今日練習/ });
    const heroHeading = screen.getByText("今天想練什麼？");
    expect(cta.compareDocumentPosition(heroHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("HomePanel grid label", () => {
  it("labels the entry-card grid with a section heading", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: "自己挑一區練習" })).toBeInTheDocument();
  });

  it("shows the grid label for returning learners too", () => {
    renderHome({ progressAttempts: [sampleAttempt] });
    expect(screen.getByRole("heading", { name: "自己挑一區練習" })).toBeInTheDocument();
  });
});

describe("HomePanel content total", () => {
  it("renders the grand total of exam + vocab + kanji-readings + patterns", () => {
    renderHome();
    const total =
      CONTENT_STATS.examItems +
      CONTENT_STATS.vocab +
      CONTENT_STATS.kanjiReadings +
      CONTENT_STATS.patternChecks;
    expect(screen.getByText(new RegExp(total.toLocaleString()))).toBeInTheDocument();
  });
});
