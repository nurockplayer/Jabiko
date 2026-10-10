import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JabikoBuddy } from "./JabikoBuddy";

describe("JabikoBuddy", () => {
  it("is decorative: hidden from assistive tech, meaning lives in nearby text", () => {
    const { container } = render(<JabikoBuddy mood="happy" />);
    const svg = container.querySelector("svg.jabiko-buddy")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it.each(["happy", "oops", "thinking", "cheer"] as const)("draws a %s face and exposes the mood", (mood) => {
    const { container } = render(<JabikoBuddy mood={mood} />);
    const svg = container.querySelector("svg.jabiko-buddy")!;
    expect(svg).toHaveAttribute("data-mood", mood);
    expect(svg.querySelector(`.buddy-face-${mood === "cheer" ? "happy" : mood}`)).not.toBeNull();
  });

  it("only sweats when it missed", () => {
    expect(render(<JabikoBuddy mood="oops" />).container.querySelector(".buddy-sweat")).not.toBeNull();
    expect(render(<JabikoBuddy mood="happy" />).container.querySelector(".buddy-sweat")).toBeNull();
  });

  it("separates jump, spin, head and the two hat pages so each can move on its own", () => {
    const { container } = render(<JabikoBuddy mood="cheer" energy={3} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("data-energy", "3");
    for (const part of [".buddy-jump", ".buddy-spin", ".buddy-head", ".buddy-page-left", ".buddy-page-right"]) {
      expect(svg.querySelector(part), part).not.toBeNull();
    }
  });
});
