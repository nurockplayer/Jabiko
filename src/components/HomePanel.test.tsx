import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePanel } from "./HomePanel";
import type { Attempt } from "../domain/types";

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
