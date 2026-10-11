import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JabikoMark } from "./JabikoMark";

describe("JabikoMark", () => {
  it("renders an accessible Jabiko brand mark", () => {
    render(<JabikoMark />);
    expect(screen.getByRole("img", { name: "Jabiko" })).toBeInTheDocument();
  });

  // #861: the figure is one group so CSS can let ジャビ子 react to a verdict
  // inside its own app-mark tile (D-10) while the cream badge stays put.
  it("groups the figure apart from the badge so it can react in place", () => {
    const { container } = render(<JabikoMark />);
    const figure = container.querySelector("svg > g.jabiko-mark-figure");
    expect(figure).not.toBeNull();
    expect(container.querySelector("svg > rect")).not.toBeNull();
  });

  it("passes through a custom className", () => {
    const { container } = render(<JabikoMark className="x-mark" />);
    expect(container.querySelector("svg.x-mark")).not.toBeNull();
  });
});
