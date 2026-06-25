import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JabikoMark } from "./JabikoMark";

describe("JabikoMark", () => {
  it("renders an accessible Jabiko brand mark", () => {
    render(<JabikoMark />);
    expect(screen.getByRole("img", { name: "Jabiko" })).toBeInTheDocument();
  });

  it("passes through a custom className", () => {
    const { container } = render(<JabikoMark className="x-mark" />);
    expect(container.querySelector("svg.x-mark")).not.toBeNull();
  });
});
