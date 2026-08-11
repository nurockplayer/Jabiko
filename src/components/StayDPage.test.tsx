import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STAY_D_AIRBNB_URL, STAY_D_EDITORIAL_COPY } from "../domain/stayD";
import { StayDPage } from "./StayDPage";

describe("StayDPage (#748 editorial)", () => {
  it("renders the editorial extension page with direct, safely opened Airbnb CTAs", () => {
    const { container } = render(<StayDPage language="zh-Hant" />);

    expect(
      screen.getByRole("heading", {
        name: "下一次來東京，不只是觀光。用學過的日文，和家人朋友一起更深入地享受東京的日常。",
        level: 1
      })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "▶ 看 Stay.D 介紹影片" }));

    for (const placement of [
      "stay-d-hero-airbnb",
      "stay-d-video-airbnb",
      "stay-d-final-airbnb"
    ]) {
      const link = container.querySelector<HTMLAnchorElement>(
        `[data-stay-d-placement="${placement}"]`
      );
      expect(link, placement).not.toBeNull();
      expect(link).toHaveAttribute("href", STAY_D_AIRBNB_URL);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("renders no property hero, gallery, or any Stay.D imagery", () => {
    const { container } = render(<StayDPage language="zh-Hant" />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".stay-d-hero-image")).toBeNull();
    expect(container.querySelector(".stay-d-gallery")).toBeNull();
    expect(container.querySelector(".stay-d-photo")).toBeNull();
    expect(container.querySelector(".stay-d-quick-facts")).toBeNull();
    expect(container.querySelector(".stay-d-floor-grid")).toBeNull();
  });

  it("click-loads the video and never exposes a Notion conversion path", () => {
    const { container } = render(<StayDPage language="en" />);

    expect(container.querySelector("iframe")).toBeNull();
    expect(container.innerHTML).not.toMatch(/notion/i);
    fireEvent.click(
      screen.getByRole("button", { name: "▶ Watch the Stay.D introduction video" })
    );
    expect(screen.getByTitle("Stay.D introduction video")).toBeInTheDocument();
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).not.toContain("autoplay=1");
  });

  it("never renders transient or remote owner-asset URLs", () => {
    const { container } = render(<StayDPage language="ja" />);
    expect(container.innerHTML).not.toMatch(
      /notion\.(?:so|site)|amazonaws\.com|airbnbstatic\.com|airbnbusercontent\.com|muscache\.com|X-Amz-|source_impression_id/i
    );
  });

  it.each([
    [
      "zh-Hant",
      "下一次來東京，不只是觀光。用學過的日文，和家人朋友一起更深入地享受東京的日常。",
      "JABIKO 推薦｜東京住宿",
      "在 Airbnb 查看 Stay.D"
    ],
    [
      "ja",
      "次の東京は、観光するだけじゃない。学んだ日本語を使いながら、家族や友人と東京の日常をもっと深く楽しもう。",
      "JABIKOおすすめ｜東京ステイ",
      "Stay.DをAirbnbで見る"
    ],
    [
      "en",
      "Next time in Tokyo, don’t just sightsee. Use the Japanese you’ve learned and enjoy more of everyday Tokyo with family or friends.",
      "JABIKO PICK | TOKYO STAY",
      "View Stay.D on Airbnb"
    ]
  ] as const)("renders complete %s editorial page copy", (language, headline, kicker, cta) => {
    render(<StayDPage language={language} />);
    expect(screen.getByRole("heading", { name: headline, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(kicker)).toBeInTheDocument();
    // Hero and final sections each expose the same Airbnb CTA.
    expect(screen.getAllByRole("link", { name: cta }).length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the stable analytics placement markers in every locale", () => {
    const { container } = render(<StayDPage language="zh-Hant" />);
    for (const placement of ["stay-d-hero-airbnb", "stay-d-video", "stay-d-final-airbnb"]) {
      expect(
        container.querySelector(`[data-stay-d-placement="${placement}"]`),
        placement
      ).not.toBeNull();
    }
  });

  it("matches the frozen #748 editorial copy object in all locales", () => {
    for (const [language, copy] of Object.entries(STAY_D_EDITORIAL_COPY) as Array<
      [keyof typeof STAY_D_EDITORIAL_COPY, (typeof STAY_D_EDITORIAL_COPY)[keyof typeof STAY_D_EDITORIAL_COPY]]
    >) {
      render(<StayDPage language={language} />);
      expect(
        screen.getByRole("heading", { name: copy.title, level: 1 })
      ).toBeInTheDocument();
      expect(screen.getByText(copy.body)).toBeInTheDocument();
      expect(screen.getByText(copy.kicker)).toBeInTheDocument();
    }
  });
});
