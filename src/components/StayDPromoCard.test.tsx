import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  STAY_D_AIRBNB_URL,
  STAY_D_HOME_TEASER,
  STAY_D_REQUIRED_LOCALES,
  STAY_D_VIDEO_ID
} from "../domain/stayD";
import { StayDPromoCard } from "./StayDPromoCard";

const analyticsMocks = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock("../lib/analytics", () => analyticsMocks);

describe("StayDPromoCard (#750 editorial footer)", () => {
  beforeEach(() => {
    analyticsMocks.trackEvent.mockClear();
  });

  it("emits exactly one home-airbnb/airbnb promo_click on the direct Airbnb CTA", () => {
    render(<StayDPromoCard language="zh-Hant" />);
    fireEvent.click(screen.getByRole("link", { name: /查看 Stay\.D/ }));

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "home-airbnb",
      locale: "zh-Hant"
    });
  });

  it("emits exactly one home-video/video promo_click when the video is opened", () => {
    render(<StayDPromoCard language="zh-Hant" />);
    fireEvent.click(screen.getByRole("button", { name: "看介紹影片" }));

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "video",
      placement: "home-video",
      locale: "zh-Hant"
    });
  });

  it("emits exactly one home-video-airbnb/airbnb promo_click from the expanded video CTA", () => {
    render(<StayDPromoCard language="zh-Hant" />);
    fireEvent.click(screen.getByRole("button", { name: "看介紹影片" }));
    analyticsMocks.trackEvent.mockClear();
    fireEvent.click(
      screen.getByRole("link", { name: "喜歡 Stay.D？到 Airbnb 查看 Stay.D" })
    );

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "home-video-airbnb",
      locale: "zh-Hant"
    });
  });

  it("makes Airbnb the direct primary action at home-bottom", () => {
    render(<StayDPromoCard language="zh-Hant" />);

    const promo = screen.getByRole("region", {
      name: "在東京，來一趟真正用上學過日文的旅行。"
    });
    expect(promo).toHaveAttribute("data-placement", "home-bottom");

    const primary = screen.getByRole("link", {
      name: /查看 Stay\.D/
    });
    expect(primary).toHaveAttribute("href", STAY_D_AIRBNB_URL);
    expect(primary).toHaveAttribute("target", "_blank");
    expect(primary).toHaveAttribute("rel", "noopener noreferrer");
    expect(primary).toHaveAttribute("data-stay-d-placement", "home-airbnb");
    expect(primary).not.toHaveAttribute("href", "/stay-d");
  });

  it("renders no Stay.D property photo in the Home block", () => {
    const { container } = render(<StayDPromoCard language="zh-Hant" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".stay-d-home-image")).toBeNull();
  });

  it("loads the approved YouTube iframe only after interaction and can collapse it", () => {
    render(<StayDPromoCard language="zh-Hant" />);

    expect(screen.queryByTitle("Stay.D 介紹影片")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "看介紹影片" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-stay-d-placement", "home-video");

    fireEvent.click(trigger);

    const iframe = screen.getByTitle("Stay.D 介紹影片");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining(`youtube-nocookie.com/embed/${STAY_D_VIDEO_ID}`)
    );
    expect(iframe).toHaveAttribute("src", expect.stringContaining("start=70"));
    expect(iframe.getAttribute("src")).not.toContain("autoplay=1");
    const assistedCta = screen.getByRole("link", {
      name: "喜歡 Stay.D？到 Airbnb 查看 Stay.D"
    });
    expect(assistedCta).toHaveAttribute("href", STAY_D_AIRBNB_URL);
    expect(assistedCta).toHaveAttribute(
      "data-stay-d-placement",
      "home-video-airbnb"
    );

    fireEvent.click(screen.getByRole("button", { name: "收合介紹影片" }));
    expect(screen.queryByTitle("Stay.D 介紹影片")).not.toBeInTheDocument();
  });

  it("opens the video from the keyboard", async () => {
    const user = userEvent.setup();
    render(<StayDPromoCard language="en" />);

    const trigger = screen.getByRole("button", {
      name: "Watch introduction video"
    });
    await user.tab();
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByTitle("Stay.D introduction video")).toBeInTheDocument();
  });

  it.each([
    [
      "zh-Hant",
      "在東京，來一趟真正用上學過日文的旅行。",
      "JABIKO 推薦 · 東京住宿",
      "查看 Stay.D"
    ],
    [
      "ja",
      "東京で、学んだ日本語を使う旅へ。",
      "JABIKOおすすめ · 東京ステイ",
      "Stay.Dを見る"
    ],
    [
      "en",
      "Put your Japanese to use in Tokyo.",
      "JABIKO PICK · TOKYO STAY",
      "View Stay.D"
    ]
  ] as const)(
    "renders complete frozen #750 %s Home teaser copy",
    (language, headline, kicker, cta) => {
      render(<StayDPromoCard language={language} />);
      expect(screen.getByRole("heading", { name: headline })).toBeInTheDocument();
      expect(screen.getByText(kicker)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: cta })).toBeInTheDocument();
    }
  );

  it.each(STAY_D_REQUIRED_LOCALES)(
    "renders the frozen #750 %s teaser body and video CTA",
    (language) => {
      render(<StayDPromoCard language={language} />);
      expect(screen.getByText(STAY_D_HOME_TEASER[language].body)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: STAY_D_HOME_TEASER[language].video.watch })
      ).toBeInTheDocument();
    }
  );

  it.each(STAY_D_REQUIRED_LOCALES)(
    "keeps the stable analytics placement markers in %s",
    (language) => {
      const { container } = render(<StayDPromoCard language={language} />);
      for (const placement of ["home-airbnb", "home-video"]) {
        expect(
          container.querySelector(`[data-stay-d-placement="${placement}"]`),
          placement
        ).not.toBeNull();
      }
    }
  );

  it("marks the Home primary action as a lightweight text link, not a filled conversion button", () => {
    render(<StayDPromoCard language="zh-Hant" />);

    const primary = screen.getByRole("link", { name: /查看 Stay\.D/ });
    expect(primary).toHaveClass("stay-d-home-airbnb");
    // #750: the Home CTA must no longer carry the heavy filled /stay-d button
    // treatment (which stays for the /stay-d page).
    expect(primary).not.toHaveClass("stay-d-airbnb-primary");
  });
});
