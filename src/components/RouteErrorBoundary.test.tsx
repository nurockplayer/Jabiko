import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

function Thrower() {
  throw new Error("route failed");
  return null;
}

function Ok() {
  return <p>Route loaded</p>;
}

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a reload fallback instead of leaving the route blank", () => {
    render(
      <RouteErrorBoundary
        resetKey="route-a"
        title="Page failed"
        body="Reload the app."
        reloadLabel="Reload"
      >
        <Thrower />
      </RouteErrorBoundary>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Page failed");
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });

  it("resets after the route key changes", () => {
    const { rerender } = render(
      <RouteErrorBoundary
        resetKey="route-a"
        title="Page failed"
        body="Reload the app."
        reloadLabel="Reload"
      >
        <Thrower />
      </RouteErrorBoundary>
    );

    rerender(
      <RouteErrorBoundary
        resetKey="route-b"
        title="Page failed"
        body="Reload the app."
        reloadLabel="Reload"
      >
        <Ok />
      </RouteErrorBoundary>
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Route loaded")).toBeInTheDocument();
  });
});
