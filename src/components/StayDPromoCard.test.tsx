import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  STAY_D_AIRBNB_URL,
  STAY_D_HOME_IMAGE,
  STAY_D_VIDEO_ID
} from "../domain/stayD";
import { StayDPromoCard } from "./StayDPromoCard";

describe("StayDPromoCard (#744)", () => {
  it("makes Airbnb the direct primary action at home-bottom", () => {
    render(<StayDPromoCard language="zh-Hant" />);

    const promo = screen.getByRole("region", {
      name: "下一次來東京，不只是觀光。帶著你學會的日文，和家人朋友一起深度探索東京的日常。"
    });
    expect(promo).toHaveAttribute("data-placement", "home-bottom");

    const primary = screen.getByRole("link", {
      name: "查看 Airbnb 最新價格與可訂日期"
    });
    expect(primary).toHaveAttribute("href", STAY_D_AIRBNB_URL);
    expect(primary).toHaveAttribute("target", "_blank");
    expect(primary).toHaveAttribute("rel", "noopener noreferrer");
    expect(primary).toHaveAttribute("data-stay-d-placement", "home-airbnb");
    expect(primary).not.toHaveAttribute("href", "/stay-d");
  });

  it("loads the approved YouTube iframe only after interaction and can collapse it", () => {
    render(<StayDPromoCard language="zh-Hant" />);

    expect(screen.queryByTitle("Stay.D 住宿影片")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "▶ 看看 Stay.D 住宿影片" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-stay-d-placement", "home-video");

    fireEvent.click(trigger);

    const iframe = screen.getByTitle("Stay.D 住宿影片");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining(`youtube-nocookie.com/embed/${STAY_D_VIDEO_ID}`)
    );
    expect(iframe).toHaveAttribute("src", expect.stringContaining("start=70"));
    expect(iframe.getAttribute("src")).not.toContain("autoplay=1");
    const assistedCta = screen.getByRole("link", {
      name: "喜歡 Stay.D？到 Airbnb 查看最新價格與可訂日期"
    });
    expect(assistedCta).toHaveAttribute("href", STAY_D_AIRBNB_URL);
    expect(assistedCta).toHaveAttribute(
      "data-stay-d-placement",
      "home-video-airbnb"
    );

    fireEvent.click(screen.getByRole("button", { name: "收合住宿影片" }));
    expect(screen.queryByTitle("Stay.D 住宿影片")).not.toBeInTheDocument();
  });

  it.each([
    ["zh-Hant", "Stay.D 明亮的二樓客廳與用餐空間"],
    ["ja", "Stay.Dの明るい2階リビング・ダイニング"],
    ["en", "Stay.D's bright second-floor living and dining space"]
  ] as const)("shows the local, responsive Home image with %s alt text", (language, alt) => {
    render(<StayDPromoCard language={language} />);

    const image = screen.getByRole("img", { name: alt });
    expect(image).toHaveAttribute("src", STAY_D_HOME_IMAGE.src);
    expect(image).toHaveAttribute("srcset", STAY_D_HOME_IMAGE.srcSet);
    expect(image).toHaveAttribute("width", String(STAY_D_HOME_IMAGE.width));
    expect(image).toHaveAttribute("height", String(STAY_D_HOME_IMAGE.height));
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image.getAttribute("src")).toMatch(/^\/stay-d\//);
  });

  it("opens the video from the keyboard", async () => {
    const user = userEvent.setup();
    render(<StayDPromoCard language="en" />);

    const trigger = screen.getByRole("button", { name: "▶ Watch the Stay.D home tour" });
    await user.tab();
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByTitle("Stay.D home tour video")).toBeInTheDocument();
  });

  it.each([
    [
      "zh-Hant",
      "下一次來東京，不只是觀光。帶著你學會的日文，和家人朋友一起深度探索東京的日常。",
      "Jabiko 推薦｜東京住宿"
    ],
    [
      "ja",
      "次の東京は、観光するだけじゃない。学んだ日本語を使いながら、家族や友人と東京の日常をもっと深く楽しもう。",
      "Jabikoおすすめ｜東京ステイ"
    ],
    [
      "en",
      "Next time in Tokyo, go beyond sightseeing. Use the Japanese you’ve learned and explore everyday Tokyo more deeply with family and friends.",
      "Jabiko Pick | Tokyo Stay"
    ]
  ] as const)("renders complete %s Home copy", (language, title, disclosure) => {
    render(<StayDPromoCard language={language} />);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(disclosure)).toBeInTheDocument();
  });
});
