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

    fireEvent.click(screen.getByRole("link", { name: "在 Airbnb 查看 Stay.D" }));

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "home-airbnb",
      locale: "zh-Hant"
    });
  });

  it.each([
    ["zh-Hant", "JABIKO 推薦 · 東京住宿", "在 Airbnb 查看 Stay.D"],
    ["ja", "JABIKOおすすめ · 東京ステイ", "Stay.DをAirbnbで見る"],
    ["en", "JABIKO PICK · TOKYO STAY", "View Stay.D on Airbnb"]
  ] as const)("leaves %s property media and listing details on Airbnb", (language, label, cta) => {
    render(<StayDHomeRecommendation language={language} />);

    const recommendation = screen.getByRole("complementary", { name: label });
    const link = within(recommendation).getByRole("link", { name: cta });
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
  });
});
