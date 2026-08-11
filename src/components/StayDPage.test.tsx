import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STAY_D_AIRBNB_URL } from "../domain/stayD";
import { StayDPage } from "./StayDPage";

describe("StayDPage (#744)", () => {
  it("renders the conversion landing page with direct, safely opened Airbnb CTAs", () => {
    const { container } = render(<StayDPage language="zh-Hant" />);

    expect(
      screen.getByRole("heading", { name: "在東京，不只住宿，也住進日常。", level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/1F/)).toBeInTheDocument();
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

  it("does not fabricate or hotlink property imagery before owner approval", () => {
    render(<StayDPage language="ja" />);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
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
