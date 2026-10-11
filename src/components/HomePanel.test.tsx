import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePanel } from "./HomePanel";
import type { Attempt } from "../domain/types";
import { CONTENT_STATS } from "../domain/contentStats";
import { isLearningBlockComplete, learningBlocks } from "../domain/learningBlocks";
import { learningBlockI18n } from "../domain/learningBlocks.i18n";
import { localizeLearningBlock } from "../domain/learningBlockText";
import { copy } from "../i18n";

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
    onNavigate: vi.fn(),
    onOpenGame: vi.fn(),
    onStartReview: noop,
    onStartVocab: noop,
    onStartBookmarks: vi.fn(),
    onStartDaily: vi.fn(),
    onStartConjugation: vi.fn(),
    onStartExamPreset: vi.fn(),
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
    fireEvent.click(screen.getByRole("button", { name: /^初級N4・N5$/ }));
    expect(props.onChooseLevel).toHaveBeenCalledWith("n4n5");
  });

  it("maps 中初級 -> n3n4, 中級 -> n2n3, and 高級 -> n1n2", () => {
    const props = renderHome();
    fireEvent.click(screen.getByRole("button", { name: /中初級/ }));
    fireEvent.click(screen.getByRole("button", { name: /中級/ }));
    fireEvent.click(screen.getByRole("button", { name: /高級/ }));
    expect(props.onChooseLevel).toHaveBeenNthCalledWith(1, "n3n4");
    expect(props.onChooseLevel).toHaveBeenNthCalledWith(2, "n2n3");
    expect(props.onChooseLevel).toHaveBeenNthCalledWith(3, "n1n2");
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

describe("HomePanel level-aware entry cards (funnel design)", () => {
  it("the vocab card reads 基礎詞彙 for starter/n4n5 learners (their floor), 単字讀音 for the rest", () => {
    renderHome({ targetLevel: "starter", progressAttempts: [sampleAttempt] });
    expect(screen.getByRole("button", { name: /基礎詞彙/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /単字讀音/ })).not.toBeInTheDocument();
  });

  it("n4n5 also gets the 基礎詞彙 card (jlptVocabulary has no N4/N5 -- the old card was a dead end)", () => {
    renderHome({ targetLevel: "n4n5", progressAttempts: [sampleAttempt] });
    expect(screen.getByRole("button", { name: /基礎詞彙/ })).toBeInTheDocument();
  });

  it("mid/high bands keep the original 単字讀音 card unchanged", () => {
    renderHome({ targetLevel: "n2n3", progressAttempts: [sampleAttempt] });
    expect(screen.getByRole("button", { name: /単字讀音/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /基礎詞彙/ })).not.toBeInTheDocument();
  });

  it("the 単字讀音 card copy spans the full N1–N5 reading pool (#668)", () => {
    renderHome({ targetLevel: "n2n3", progressAttempts: [sampleAttempt] });
    const card = screen.getByRole("button", { name: /単字讀音/ });
    expect(card).toHaveTextContent("N1〜N5");
    expect(card).not.toHaveTextContent("N1〜N3");
  });
});

describe("HomePanel 你的下一步 banner (funnel design)", () => {
  it("a fresh learner with a band but no history sees a next-step banner for their band", () => {
    const props = renderHome({ targetLevel: "n4n5", progressAttempts: [] });
    const banner = screen.getByRole("button", { name: /開始 N4＋N5 備考/ });
    fireEvent.click(banner);
    expect(props.onStartExamPreset).toHaveBeenCalledWith("n4n5");
  });

  it("a starter learner's next step points at the 入門 chapters instead", () => {
    const props = renderHome({ targetLevel: "starter", progressAttempts: [] });
    fireEvent.click(screen.getByRole("button", { name: /開始入門課程/ }));
    expect(props.onNavigate).toHaveBeenCalledWith("learn");
  });

  it("the review banner still wins when there are mistakes to clear", () => {
    renderHome({ targetLevel: "n4n5", progressAttempts: [], reviewCount: 3 });
    expect(screen.getByRole("button", { name: /等待複習/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /開始 N4＋N5 備考/ })).not.toBeInTheDocument();
  });

  it("the continue banner still wins for a learner mid-chapter", () => {
    renderHome({ targetLevel: "n4n5", progressAttempts: [sampleAttempt] });
    expect(screen.getByText("上次還沒完成的章節。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /開始 N4＋N5 備考/ })).not.toBeInTheDocument();
  });

  it("no next-step banner without a chosen level (the onboarding card owns that state)", () => {
    renderHome({ targetLevel: null, progressAttempts: [] });
    // Target the banner element, not a text regex -- the 挑戰 card's copy
    // legitimately mentions 備考 since the 2026-07 grid refresh.
    expect(document.querySelector(".home-banner-continue")).toBeNull();
    expect(screen.queryByRole("button", { name: /開始入門課程/ })).not.toBeInTheDocument();
  });
});

describe("HomePanel 完全新手 band (#532)", () => {
  it("the onboarding card offers 完全新手 first, mapping to the starter range", () => {
    const props = renderHome();
    const options = screen.getAllByRole("button", { name: /完全新手|初級|中初級|中級|高級/ });
    expect(options[0]).toHaveTextContent("完全新手");
    expect(options.map((option) => option.textContent)).toEqual([
      expect.stringContaining("完全新手"),
      expect.stringContaining("初級"),
      expect.stringContaining("中初級"),
      expect.stringContaining("中級"),
      expect.stringContaining("高級")
    ]);
    fireEvent.click(screen.getByRole("button", { name: /完全新手/ }));
    expect(props.onChooseLevel).toHaveBeenCalledWith("starter");
  });

  it("the #526 chip displays 完全新手 when the starter band is active", () => {
    renderHome({ targetLevel: "starter", progressAttempts: [sampleAttempt] });
    const chip = screen.getByRole("button", { name: /變更/ });
    expect(chip).toHaveTextContent("完全新手");
  });
});

describe("HomePanel daily CTA level gate (#532)", () => {
  it("with a level set, the CTA starts daily immediately (unchanged)", () => {
    const props = renderHome({ targetLevel: "n4n5", progressAttempts: [sampleAttempt] });
    fireEvent.click(screen.getByRole("button", { name: /開始今日練習/ }));
    expect(props.onStartDaily).toHaveBeenCalledTimes(1);
  });

  // #866: a brand-new visitor is never shown a CTA that refuses to start.
  // The level choices ARE the start: one tap sets the band and begins the
  // first round (the #532 "ask for a level first" rule, without the dead end).
  it("a brand-new visitor gets no level-less CTA -- the level choices start the round", () => {
    renderHome({ targetLevel: null });
    expect(screen.queryByRole("button", { name: /開始今日練習/ })).not.toBeInTheDocument();
    expect(screen.getByText(copy["zh-Hant"].today.firstVisitLead)).toBeInTheDocument();
  });

  it("a brand-new visitor's level choice sets the band and starts today's practice", () => {
    const props = renderHome({ targetLevel: null });
    fireEvent.click(screen.getByRole("button", { name: /^初級N4・N5$/ }));
    expect(props.onChooseLevel).toHaveBeenCalledWith("n4n5");
    expect(props.onStartDaily).toHaveBeenCalledTimes(1);
  });

  it("a brand-new 完全新手 is not dropped into a quiz -- the app lands them on lesson 1 instead", () => {
    const props = renderHome({ targetLevel: null });
    fireEvent.click(screen.getByRole("button", { name: /完全新手/ }));
    expect(props.onChooseLevel).toHaveBeenCalledWith("starter");
    expect(props.onStartDaily).not.toHaveBeenCalled();
  });

  it("a returning learner without a preference gets the chip picker expanded by the gate", () => {
    const props = renderHome({ targetLevel: null, progressAttempts: [sampleAttempt] });
    fireEvent.click(screen.getByRole("button", { name: /開始今日練習/ }));
    expect(props.onStartDaily).not.toHaveBeenCalled();
    // The chip's band picker is now open; picking a band auto-continues.
    fireEvent.click(screen.getByRole("button", { name: /中級/ }));
    expect(props.onChooseLevel).toHaveBeenCalledWith("n2n3");
    expect(props.onStartDaily).toHaveBeenCalledTimes(1);
  });

  it("changing the level from the 變更 picker WITHOUT the gated ask does not auto-start daily", () => {
    const props = renderHome({ targetLevel: "n4n5", progressAttempts: [sampleAttempt] });
    fireEvent.click(screen.getByRole("button", { name: /變更/ }));
    fireEvent.click(screen.getByRole("button", { name: /高級/ }));
    expect(props.onChooseLevel).toHaveBeenCalledWith("n1n2");
    expect(props.onStartDaily).not.toHaveBeenCalled();
  });
});

describe("HomePanel persistent level control (#526 change level anytime)", () => {
  it("shows the current target level with a change affordance once a preference exists", () => {
    renderHome({ targetLevel: "n2n3", progressAttempts: [sampleAttempt] });
    expect(screen.getByText("目標級別")).toBeInTheDocument();
    // reflects the chosen band (中級 = n2n3) and offers a change action
    const chip = screen.getByRole("button", { name: /變更/ });
    expect(chip).toHaveTextContent("中級");
  });

  it("shows N4–N3 as the current target after it is saved", () => {
    renderHome({ targetLevel: "n3n4", progressAttempts: [sampleAttempt] });
    const chip = screen.getByRole("button", { name: /變更/ });
    expect(chip).toHaveTextContent("中初級");
    expect(chip).toHaveTextContent("N3・N4");
  });

  it("is collapsed by default -- the band picker is not shown until 變更 is clicked", () => {
    renderHome({ targetLevel: "n2n3", progressAttempts: [sampleAttempt] });
    // 高級 belongs only to the (still-collapsed) picker, so it must be absent
    expect(screen.queryByRole("button", { name: /高級/ })).not.toBeInTheDocument();
  });

  it("expands to the band picker and changes the level", () => {
    const props = renderHome({ targetLevel: "n2n3", progressAttempts: [sampleAttempt] });
    fireEvent.click(screen.getByRole("button", { name: /變更/ }));
    fireEvent.click(screen.getByRole("button", { name: /高級/ }));
    expect(props.onChooseLevel).toHaveBeenCalledWith("n1n2");
  });

  it("lets a returning learner with no saved preference set a target level", () => {
    const props = renderHome({ targetLevel: null, progressAttempts: [sampleAttempt] });
    expect(screen.getByText("尚未設定")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /變更/ }));
    fireEvent.click(screen.getByRole("button", { name: /中級/ }));
    expect(props.onChooseLevel).toHaveBeenCalledWith("n2n3");
  });

  it("does NOT show the persistent control for a brand-new learner (big onboarding card instead)", () => {
    renderHome({ targetLevel: null, progressAttempts: [] });
    expect(screen.queryByText("目標級別")).not.toBeInTheDocument();
    expect(screen.getByText("選擇你的程度")).toBeInTheDocument();
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

// 2026-07 home-grid refresh: the picker block grew a 收藏 card (6th) and a
// lightweight reference quick-links row, and the 挑戰 card copy now matches
// the three-group mode picker instead of the retired "四種模式" list.
describe("HomePanel section grid refresh", () => {
  it("offers one compact first-class verb-conjugation launcher", () => {
    const props = renderHome();

    fireEvent.click(screen.getByRole("button", { name: /動詞變化/ }));

    expect(props.onStartConjugation).toHaveBeenCalledTimes(1);
  });

  it("offers a bookmarks card that starts the starred-questions pass", () => {
    localStorage.setItem("jabiko:bookmarks", JSON.stringify(["q-1", "q-2"]));
    const props = renderHome();

    const card = screen.getByRole("button", { name: /我的收藏/ });
    expect(card.textContent).toContain("2");
    fireEvent.click(card);
    expect(props.onStartBookmarks).toHaveBeenCalledTimes(1);

    localStorage.removeItem("jabiko:bookmarks");
  });

  it("shows the empty-state hint on the bookmarks card when nothing is starred", () => {
    localStorage.removeItem("jabiko:bookmarks");
    renderHome();
    const card = screen.getByRole("button", { name: /我的收藏/ });
    expect(card.textContent).toContain("收藏");
  });

  it("describes the challenge card with the current three mode groups", () => {
    renderHome();
    const card = screen.getByRole("button", { name: /挑戰/ });
    expect(card.textContent).not.toContain("四種模式");
    expect(card.textContent).toContain("備考");
  });

  it("renders the reference quick links and navigates to each view", () => {
    const props = renderHome();
    const nav = screen.getByRole("navigation", { name: "查資料" });

    const targets: Array<[string, string]> = [
      ["文型資料庫", "grammar"],
      ["漢字音讀", "kanji"],
      ["規則速查表", "rules"],
      ["五十音表", "kana"]
    ];
    for (const [label, view] of targets) {
      fireEvent.click(within(nav).getByRole("button", { name: label }));
      expect(props.onNavigate).toHaveBeenCalledWith(view);
    }
  });
});

describe("HomePanel legal links", () => {
  it("links to the privacy policy and terms from the footer", () => {
    renderHome();

    expect(screen.getByRole("link", { name: "隱私政策" })).toHaveAttribute(
      "href",
      "/privacy"
    );
    expect(screen.getByRole("link", { name: "使用條款" })).toHaveAttribute(
      "href",
      "/terms"
    );
  });
});

describe("HomePanel donate link", () => {
  const ecpayUrl =
    "https://payment.ecpay.com.tw/Broadcaster/Donate/57DD8DC811013DF1C576D7ED22ACF911";

  it("renders a donate link to ECPay that opens safely in a new tab", () => {
    renderHome();
    const link = screen.getByRole("link", { name: /小額贊助 Jabiko/ });
    expect(link).toHaveAttribute("href", ecpayUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel") ?? "").toContain("noopener noreferrer");
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

  // The old dismissible "how it works" strip is folded into the first-visit
  // hero lead (#866): same message, no extra banner to dismiss.
  it("explains the loop to a brand-new visitor inside the hero, not in a separate strip", () => {
    renderHome();
    const hero = screen.getByRole("region", { name: "今天想練什麼？" });
    expect(within(hero).getByText(copy["zh-Hant"].today.firstVisitLead)).toBeInTheDocument();
    expect(screen.queryByText(/第一次來/)).not.toBeInTheDocument();
  });

  it("renders the free / no-signup kicker in the about section", () => {
    renderHome();
    const about = screen.getByRole("region", { name: "關於 Jabiko" });
    expect(within(about).getByText(/免註冊/)).toBeInTheDocument();
  });

  it("leads with the Today hero, then the primary action, then the about section", () => {
    renderHome({ targetLevel: "n4n5", progressAttempts: [sampleAttempt] });
    const heroHeading = screen.getByRole("heading", { name: "今天想練什麼？" });
    const cta = screen.getByRole("button", { name: /開始今日練習/ });
    const aboutHeading = screen.getByRole("heading", { name: "關於 Jabiko" });
    expect(heroHeading.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cta.compareDocumentPosition(aboutHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("HomePanel Today hero (#866)", () => {
  const DAY = 86_400_000;
  const at = (daysAgo: number) => ({ ...sampleAttempt, timestamp: Date.now() - daysAgo * DAY });

  it("ジャビ子 introduces herself to a brand-new visitor", () => {
    renderHome();
    const hero = screen.getByRole("region", { name: "今天想練什麼？" });
    expect(within(hero).getByText("はじめまして！")).toHaveAttribute("lang", "ja");
    expect(within(hero).getByText(copy["zh-Hant"].today.gloss.welcome)).toBeInTheDocument();
  });

  it("shows the real streak and today's answered count for a returning learner", () => {
    renderHome({ targetLevel: "n3n4", progressAttempts: [at(2), at(1), at(0), at(0)] });
    const hero = screen.getByRole("region", { name: "今天想練什麼？" });
    expect(within(hero).getByText("連續 3 天")).toBeInTheDocument();
    expect(within(hero).getByText("今天 2 題")).toBeInTheDocument();
    expect(within(hero).getByText("その調子！")).toBeInTheDocument();
  });

  // #872 review thread: a Today left open (tab or installed PWA) across local
  // midnight kept yesterday's count until the page was reloaded.
  it("moves to the new local day when Today becomes visible again", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date(2026, 9, 10, 23, 50));
      renderHome({ targetLevel: "n3n4", progressAttempts: [{ ...sampleAttempt, timestamp: Date.now() }] });
      const hero = screen.getByRole("region", { name: "今天想練什麼？" });
      expect(within(hero).getByText("今天 1 題")).toBeInTheDocument();
      vi.setSystemTime(new Date(2026, 9, 11, 7, 30));
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      expect(within(hero).queryByText("今天 1 題")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not show a streak readout when there is no live streak", () => {
    renderHome({ targetLevel: "n3n4", progressAttempts: [at(9)] });
    const hero = screen.getByRole("region", { name: "今天想練什麼？" });
    expect(within(hero).queryByText(/連續/)).not.toBeInTheDocument();
  });

  it("offers the review queue as the hero's second action, never as an alert", () => {
    const onStartReview = vi.fn();
    renderHome({ targetLevel: "n3n4", progressAttempts: [sampleAttempt], reviewCount: 4, onStartReview });
    const hero = screen.getByRole("region", { name: "今天想練什麼？" });
    const review = within(hero).getByRole("button", { name: /你有 4 題等待複習/ });
    expect(review.closest("[role='alert']")).toBeNull();
    fireEvent.click(review);
    expect(onStartReview).toHaveBeenCalledTimes(1);
  });
});

describe("HomePanel practice section", () => {
  it("labels the practice rows with a section heading", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: "練習" })).toBeInTheDocument();
  });

  it("shows the practice section for returning learners too", () => {
    renderHome({ progressAttempts: [sampleAttempt] });
    expect(screen.getByRole("heading", { name: "練習" })).toBeInTheDocument();
  });
});

describe("HomePanel mock card coverage (#703)", () => {
  it("the 題型練習 card copy spans N1–N5 now that the N4/N5 picker is wired", () => {
    renderHome();
    const card = screen.getByRole("button", { name: /題型練習/ });
    expect(card).toHaveTextContent("N1〜N5");
    expect(card).not.toHaveTextContent("N1〜N3");
  });

  it("launched locales carry no stale N1–N3 mock coverage string", () => {
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      expect(copy[locale].homeCardMockSub).toContain("N1〜N5");
      expect(copy[locale].homeCardMockSub).not.toContain("N1〜N3");
    }
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

describe("HomePanel continue banner i18n (#427)", () => {
  it("localizes the next-chapter title once the overlay chunk loads (en)", async () => {
    renderHome({ language: "en", progressAttempts: [sampleAttempt] });

    // Mirror HomePanel's own next-chapter pick, then expect its en title.
    const trackable = learningBlocks.filter(
      (block) => block.group === "basic" && block.completionMode !== "reference"
    );
    const next = trackable.find((block) => !isLearningBlockComplete([sampleAttempt], block))!;
    const enTitle = localizeLearningBlock(next, "en", learningBlockI18n).title;

    expect(await screen.findByText(copy.en.homeBannerContinueMain(enTitle))).toBeInTheDocument();
  });
});

describe("HomePanel promotion placement", () => {
  it("places the Stay.D recommendation after the primary learning controls and before the about section", () => {
    renderHome({ language: "zh-Hant", targetLevel: "n4n5" });

    const dailyPractice = screen.getByRole("button", { name: /開始今日練習/ });
    const levelControl = screen.getByRole("group", { name: "目標級別" });
    const recommendation = screen.getByRole("complementary", {
      name: "JABIKO 推薦 · 合作夥伴"
    });
    const aboutHeading = screen.getByRole("heading", { name: "關於 Jabiko" });

    expect(dailyPractice.compareDocumentPosition(levelControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(levelControl.compareDocumentPosition(recommendation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(recommendation.compareDocumentPosition(aboutHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("HomePanel points cell (points economy foundation)", () => {
  it("shows total earned points -- one per correct attempt -- in the stats strip", () => {
    renderHome({
      progressAttempts: [
        sampleAttempt,
        { ...sampleAttempt, isCorrect: false, timestamp: 2 },
        { ...sampleAttempt, isCorrect: true, timestamp: 3 }
      ]
    });
    const cell = screen.getByText("累積點數").closest(".home-stats-cell");
    expect(cell).not.toBeNull();
    expect(within(cell as HTMLElement).getByText("2")).toBeInTheDocument();
  });

  it("marks the points tile with the accent class (the strip's focal number)", () => {
    renderHome({ progressAttempts: [sampleAttempt] });
    const cell = screen.getByText("累積點數").closest(".home-stats-cell");
    expect(cell).toHaveClass("home-stats-cell-points");
  });

  it("wrong answers earn nothing (points cell stays at zero)", () => {
    renderHome({ progressAttempts: [{ ...sampleAttempt, isCorrect: false }] });
    const cell = screen.getByText("累積點數").closest(".home-stats-cell");
    expect(cell).not.toBeNull();
    expect(within(cell as HTMLElement).getByText("0")).toBeInTheDocument();
  });
});

// #814: the Small Talk Lab is a separate short-conversation practice path --
// not a JLPT challenge card, and not a global recommendation.
describe("HomePanel small talk entry (#814)", () => {
  it("offers a curated small-talk card that opens the conversation route", () => {
    const props = renderHome();
    const card = screen.getByRole("button", { name: /日常會話/ });

    expect(card).toHaveTextContent(copy["zh-Hant"].homeCardConversationSub);
    expect(card).toHaveTextContent(copy["zh-Hant"].homeCardConversationMeta);
    fireEvent.click(card);
    expect(props.onNavigate).toHaveBeenCalledWith("conversation");
  });
});
