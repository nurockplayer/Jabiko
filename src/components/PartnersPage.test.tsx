import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTHOR_EMAIL } from "../domain/author";
import { partnersForLocale } from "../domain/partners";
import { STAY_D_AIRBNB_URL } from "../domain/stayD";
import { copy, LAUNCHED_LANGUAGES } from "../i18n";
import { PartnersPage } from "./PartnersPage";

const analyticsMocks = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock("../lib/analytics", () => analyticsMocks);

describe("PartnersPage layout", () => {
  beforeEach(() => {
    analyticsMocks.trackEvent.mockClear();
  });

  it("titles the page after the partnership section, not after one partner", () => {
    render(<PartnersPage language="zh-Hant" />);

    expect(
      screen.getByRole("heading", { level: 1, name: copy["zh-Hant"].partnersTitle })
    ).toBeInTheDocument();
    expect(screen.getByText(copy["zh-Hant"].partnersIntro)).toBeInTheDocument();
  });

  it("renders one card per partner offered in the locale", () => {
    const { container } = render(<PartnersPage language="zh-Hant" />);

    const cards = container.querySelectorAll(".partner-card");
    expect(cards).toHaveLength(partnersForLocale("zh-Hant").length);
    expect(cards).toHaveLength(1);
  });

  it("keeps one outbound link per partner instead of repeating the CTA down the page", () => {
    const { container } = render(<PartnersPage language="zh-Hant" />);

    const listingLinks = container.querySelectorAll(`a[href="${STAY_D_AIRBNB_URL}"]`);
    expect(listingLinks).toHaveLength(1);
    expect(container.querySelector('[data-stay-d-placement="stay-d-final-airbnb"]')).toBeNull();
  });

  it("still renders the page for a locale with no partners", () => {
    const { container } = render(<PartnersPage language="ko" />);

    expect(container.querySelectorAll(".partner-card")).toHaveLength(0);
    expect(
      screen.getByRole("heading", { level: 1, name: copy.ko.partnersTitle })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: AUTHOR_EMAIL })).toBeInTheDocument();
  });
});

describe("PartnersPage contact block", () => {
  beforeEach(() => {
    analyticsMocks.trackEvent.mockClear();
  });

  it("offers the author's own address in every launched locale", () => {
    for (const language of LAUNCHED_LANGUAGES) {
      const { unmount } = render(<PartnersPage language={language} />);
      const mail = screen.getByRole("link", { name: AUTHOR_EMAIL });
      expect(mail, language).toHaveAttribute("href", `mailto:${AUTHOR_EMAIL}`);
      expect(screen.getByText(copy[language].partnersContactBody), language).toBeInTheDocument();
      unmount();
    }
  });

  it("keeps the address outside every partner card so it cannot read as the partner's", () => {
    const { container } = render(<PartnersPage language="zh-Hant" />);

    const mail = screen.getByRole("link", { name: AUTHOR_EMAIL });
    for (const card of container.querySelectorAll(".partner-card")) {
      expect(card.contains(mail)).toBe(false);
    }
    expect(container.querySelector(".partners-contact")?.contains(mail)).toBe(true);
  });
});

describe("PartnersPage analytics", () => {
  beforeEach(() => {
    analyticsMocks.trackEvent.mockClear();
  });

  it("emits stay-d-hero-airbnb/airbnb promo_click on the Stay.D card link", () => {
    render(<PartnersPage language="zh-Hant" />);
    fireEvent.click(screen.getByRole("link", { name: "在 Airbnb 查看 Stay.D" }));

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "stay-d-hero-airbnb",
      locale: "zh-Hant"
    });
  });

  it("emits stay-d-video/video promo_click when the video is opened, once", () => {
    render(<PartnersPage language="zh-Hant" />);
    fireEvent.click(screen.getByRole("button", { name: "▶ 看 Stay.D 介紹影片" }));
    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "video",
      placement: "stay-d-video",
      locale: "zh-Hant"
    });

    fireEvent.click(screen.getByRole("button", { name: "收合介紹影片" }));
    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
  });

  it("emits stay-d-video-airbnb/airbnb promo_click from the video CTA", () => {
    render(<PartnersPage language="zh-Hant" />);
    fireEvent.click(screen.getByRole("button", { name: "▶ 看 Stay.D 介紹影片" }));
    analyticsMocks.trackEvent.mockClear();
    fireEvent.click(screen.getByRole("link", { name: "喜歡 Stay.D？到 Airbnb 查看 Stay.D" }));

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "stay-d-video-airbnb",
      locale: "zh-Hant"
    });
  });

  it("renders no partner imagery", () => {
    const { container } = render(<PartnersPage language="zh-Hant" />);
    expect(container.querySelector("img")).toBeNull();
  });
});
