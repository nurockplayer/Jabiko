import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  STAY_D_AIRBNB_URL,
  STAY_D_REQUIRED_LOCALES,
  STAY_D_VIDEO_ID
} from "../domain/stayD";
import { StayDPromoCard } from "./StayDPromoCard";

describe("StayDPromoCard (#748 editorial)", () => {
  it("makes Airbnb the direct primary action at home-bottom", () => {
    render(<StayDPromoCard language="zh-Hant" />);

    const promo = screen.getByRole("region", {
      name: "下一次來東京，不只是觀光。用學過的日文，和家人朋友一起更深入地享受東京的日常。"
    });
    expect(promo).toHaveAttribute("data-placement", "home-bottom");

    const primary = screen.getByRole("link", {
      name: "在 Airbnb 查看 Stay.D"
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
    expect(container.querySelector(".stay-d-promo-image")).toBeNull();
  });

  it("loads the approved YouTube iframe only after interaction and can collapse it", () => {
    render(<StayDPromoCard language="zh-Hant" />);

    expect(screen.queryByTitle("Stay.D 介紹影片")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "▶ 看 Stay.D 介紹影片" });
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
      name: "▶ Watch the Stay.D introduction video"
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
  ] as const)("renders complete %s Home editorial copy", (language, title, kicker, cta) => {
    render(<StayDPromoCard language={language} />);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(kicker)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: cta })).toBeInTheDocument();
  });

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
});
