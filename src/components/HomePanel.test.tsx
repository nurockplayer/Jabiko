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
