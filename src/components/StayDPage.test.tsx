import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STAY_D_AIRBNB_URL, STAY_D_HOME_IMAGE } from "../domain/stayD";
import { STAY_D_PAGE_IMAGES } from "../domain/stayDPage";
import { StayDPage } from "./StayDPage";

describe("StayDPage (#744)", () => {
  it("renders the conversion landing page with direct, safely opened Airbnb CTAs", () => {
    const { container } = render(<StayDPage language="zh-Hant" />);

    expect(
      screen.getByRole("heading", { name: "在東京，不只住宿，也住進日常。", level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText("1F")).toBeInTheDocument();
    expect(screen.getByText(/10 Gbps/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "看看 Stay.D 住宿影片" }));

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

  it("click-loads the video and never exposes a Notion conversion path", () => {
    const { container } = render(<StayDPage language="en" />);

    expect(container.querySelector("iframe")).toBeNull();
    expect(container.innerHTML).not.toMatch(/notion/i);
    fireEvent.click(screen.getByRole("button", { name: "Watch the Stay.D home tour" }));
    expect(screen.getByTitle("Stay.D home tour video")).toBeInTheDocument();
  });

  it("prioritizes the local hero and lazy-loads the representative gallery", () => {
    const { container } = render(<StayDPage language="zh-Hant" />);

    const hero = screen.getByRole("img", {
      name: "Stay.D 明亮的二樓客廳與用餐空間"
    });
    expect(hero).toHaveAttribute("src", STAY_D_HOME_IMAGE.src);
    expect(hero).toHaveAttribute("loading", "eager");
    expect(hero).toHaveAttribute("fetchpriority", "high");
    expect(hero).toHaveAttribute("width", String(STAY_D_HOME_IMAGE.width));
    expect(hero).toHaveAttribute("height", String(STAY_D_HOME_IMAGE.height));

    const gallery = container.querySelector(".stay-d-gallery");
    expect(gallery).not.toBeNull();
    const galleryImages = gallery?.querySelectorAll("img") ?? [];
    expect(galleryImages).toHaveLength(STAY_D_PAGE_IMAGES.length);
    for (const image of galleryImages) {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image.getAttribute("src")).toMatch(/^\/stay-d\//);
      expect(image).toHaveAttribute("width");
      expect(image).toHaveAttribute("height");
    }
  });

  it.each([
    ["zh-Hant", "Stay.D 外觀", "Stay.D 三樓臥室的兩張雙人床"],
    ["ja", "Stay.Dの外観", "Stay.Dの3階寝室にあるダブルベッド2台"],
    ["en", "Stay.D exterior", "Two double beds in Stay.D's third-floor bedroom"]
  ] as const)("localizes meaningful image alternatives in %s", (language, exterior, bedroom) => {
    render(<StayDPage language={language} />);
    expect(screen.getByRole("img", { name: exterior })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: bedroom })).toBeInTheDocument();
  });

  it("never renders transient or remote owner-asset URLs", () => {
    const { container } = render(<StayDPage language="ja" />);
    expect(container.innerHTML).not.toMatch(
      /notion\.(?:so|site)|amazonaws\.com|airbnbstatic\.com|airbnbusercontent\.com|muscache\.com|X-Amz-|source_impression_id/i
    );
  });

  it.each([
    ["zh-Hant", "在東京，不只住宿，也住進日常。"],
    ["ja", "東京に泊まるだけでなく、暮らすように過ごす。"],
    ["en", "Don’t just stay in Tokyo. Live a little of it."]
  ] as const)("renders complete %s landing copy", (language, heading) => {
    render(<StayDPage language={language} />);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });
});
