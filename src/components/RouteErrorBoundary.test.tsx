import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

function Thrower() {
  throw new Error("route failed");
  return null;
}

// A poisoned-cache chunk failure, as Chrome reports it (2026-07-06 outage).
function ChunkThrower() {
  throw new TypeError(
    "Failed to fetch dynamically imported module: https://jabiko.app/assets/ChallengePanel-D0s6xzVg.js"
  );
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

  it("auto-recovers a chunk-load failure once: repair caches, then reload", async () => {
    sessionStorage.clear();
    const recover = vi.fn().mockResolvedValue(true);
    const reload = vi.fn();

    render(
      <RouteErrorBoundary
        resetKey="route-a"
        title="Page failed"
        body="Reload the app."
        reloadLabel="Reload"
        recover={recover}
        reload={reload}
      >
        <ChunkThrower />
      </RouteErrorBoundary>
    );

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(recover).toHaveBeenCalledTimes(1);
    // The auto path repairs silently -- no error screen flash into view.
    expect(screen.queryByRole("button", { name: "Reload" })).not.toBeInTheDocument();
  });

  it("stops auto-reloading after the attempt budget and shows the fallback instead", async () => {
    sessionStorage.clear();
    const recover = vi.fn().mockResolvedValue(true);
    const reload = vi.fn();

    const ui = (
      <RouteErrorBoundary
        resetKey="route-a"
        title="Page failed"
        body="Reload the app."
        reloadLabel="Reload"
        recover={recover}
        reload={reload}
      >
        <ChunkThrower />
      </RouteErrorBoundary>
    );

    const first = render(ui);
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    first.unmount();

    // Same session, second mount = the post-reload page failing again.
    render(ui);
    expect(await screen.findByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(reload).toHaveBeenCalledTimes(1); // no reload loop
  });

  it("does not auto-reload for ordinary render errors", async () => {
    sessionStorage.clear();
    const recover = vi.fn().mockResolvedValue(true);
    const reload = vi.fn();

    render(
      <RouteErrorBoundary
        resetKey="route-a"
        title="Page failed"
        body="Reload the app."
        reloadLabel="Reload"
        recover={recover}
        reload={reload}
      >
        <Thrower />
      </RouteErrorBoundary>
    );

    expect(await screen.findByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it("the reload button repairs caches before reloading (never a bare reload)", async () => {
    sessionStorage.clear();
    const user = userEvent.setup();
    const recover = vi.fn().mockResolvedValue(true);
    const reload = vi.fn();

    render(
      <RouteErrorBoundary
        resetKey="route-a"
        title="Page failed"
        body="Reload the app."
        reloadLabel="Reload"
        recover={recover}
        reload={reload}
      >
        <Thrower />
      </RouteErrorBoundary>
    );

    await user.click(screen.getByRole("button", { name: "Reload" }));

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(recover).toHaveBeenCalledTimes(1);
    // recover must complete before reload fires
    expect(recover.mock.invocationCallOrder[0]).toBeLessThan(reload.mock.invocationCallOrder[0]);
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
