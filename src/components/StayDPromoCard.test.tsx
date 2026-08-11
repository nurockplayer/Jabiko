import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { STAY_D_AIRBNB_URL, STAY_D_VIDEO_ID } from "../domain/stayD";
import { StayDPromoCard } from "./StayDPromoCard";

describe("StayDPromoCard (#744)", () => {
  it("makes Airbnb the direct primary action at home-bottom", () => {
    render(<StayDPromoCard language="zh-Hant" />);

    const promo = screen.getByRole("region", { name: "東京學日文，也住得像東京人。" });
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
    ["zh-Hant", "東京學日文，也住得像東京人。", "推廣"],
    ["ja", "東京で学ぶなら、暮らすように泊まる。", "プロモーション"],
    ["en", "Study Japanese in Tokyo. Stay like you live here.", "Promotion"]
  ] as const)("renders complete %s Home copy", (language, title, disclosure) => {
    render(<StayDPromoCard language={language} />);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(disclosure)).toBeInTheDocument();
  });
});
