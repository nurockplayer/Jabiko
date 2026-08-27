import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StayDHomeRecommendation } from "./StayDHomeRecommendation";

const analyticsMocks = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock("../lib/analytics", () => analyticsMocks);

describe("StayDHomeRecommendation", () => {
  beforeEach(() => {
    analyticsMocks.trackEvent.mockClear();
  });

  it("tracks one home-airbnb click from the direct Airbnb recommendation", () => {
    render(<StayDHomeRecommendation language="zh-Hant" />);

    fireEvent.click(screen.getByRole("link", { name: "在 Airbnb 查看" }));

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "home-airbnb",
      locale: "zh-Hant"
    });
  });

  it.each([
    [
      "zh-Hant",
      "JABIKO 推薦 · 合作夥伴",
      "東京住宿 Stay.D｜把學過的日文帶進旅程。",
      "在 Airbnb 查看"
    ],
    [
      "ja",
      "JABIKOおすすめ · 提携パートナー",
      "東京ステイ Stay.D｜学んだ日本語を旅で使おう。",
      "Airbnbで見る"
    ],
    [
      "en",
      "JABIKO PICK · PARTNER",
      "Tokyo stay Stay.D — put your Japanese to use.",
      "View on Airbnb"
    ]
  ] as const)(
    "keeps the %s partnership recommendation compact and leaves listing details on Airbnb",
    (language, label, headline, cta) => {
      render(<StayDHomeRecommendation language={language} />);

      const recommendation = screen.getByRole("complementary", { name: label });
      const link = within(recommendation).getByRole("link", { name: cta });
      expect(within(recommendation).getByRole("heading", { name: headline })).toBeInTheDocument();
      expect(recommendation.textContent).toBe(`${label}${headline}${cta}`);
      expect(link).toHaveAttribute(
        "href",
        "https://www.airbnb.com/rooms/1518015758376242668"
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute("data-stay-d-placement", "home-airbnb");
      expect(recommendation.querySelector("img")).toBeNull();
      expect(recommendation).not.toHaveTextContent(
        /2025|52\s*m|10\s*Gbps|三層|3階|three-floor|廚房|キッチン|kitchen/i
      );
    }
  );
});
