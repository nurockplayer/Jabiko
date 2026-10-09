import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameWorldPanel } from "./GameWorldPanel";
import { gameWorldProgressKey } from "../domain/gameWorldProgress";
import { localizeGameWorldText } from "../domain/gameWorld";
import { rainyMondayContent } from "../domain/gameWorldContent/rainyMonday";

function renderGame() {
  return render(
    <GameWorldPanel
      language="en"
      headerMenu={(onSelect) => <button type="button" onClick={() => onSelect("about")}>Settings &amp; tools</button>}
      onHeaderNavigate={() => undefined}
      furiganaLabel="Show furigana"
      furiganaEnabled={false}
      onToggleFurigana={() => undefined}
      onNavigate={() => undefined}
    />
  );
}

describe("Rainy Monday world surface", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("starts with the localized authored location and only its entry moment available", () => {
    renderGame();
    expect(screen.getByRole("heading", { level: 1, name: "Aoba Station" })).toBeInTheDocument();
    expect(screen.getByText("A neighborhood station entrance and a starting point for the commute.")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText(/Completed story checkpoints stay in this device's browser/)).toBeInTheDocument();
    expect(screen.queryByText(/not available yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText("The main story is complete.")).not.toBeInTheDocument();
  });

  it("leads with the current authored place, person, relationship, and objective", () => {
    renderGame();
    expect(screen.getByRole("heading", { level: 1, name: "Aoba Station" })).toBeInTheDocument();
    expect(screen.getByText(/A coworker you often chat with/)).toBeInTheDocument();
    expect(screen.getByText("Acknowledge the rainy commute and add a little of your own experience to keep the coworker conversation going.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start conversation/i })).toBeInTheDocument();
  });

  it("saves a completed response before unlocking the next authored moment", async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole("button", { name: /start conversation/i }));
    expect(screen.queryByText(/pick a length/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /start this scene/i }));
    expect(await screen.findByText("さっきより雨が強くなりましたね。駅までの道に水たまりができていました。")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /本当ですね/ }));
    await user.click(await screen.findByRole("button", { name: /continue/i }));

    await waitFor(() => {
      const raw = localStorage.getItem(gameWorldProgressKey(rainyMondayContent.world.id));
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!).state.completedMomentIds).toEqual(["rain-entry"]);
    });
    expect(screen.getByText("Main story: 1 of 5 scenes complete")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Office" })).toHaveFocus();
    expect(screen.getByText(localizeGameWorldText(rainyMondayContent.world.moments[1].objective, "en"))).toBeInTheDocument();
    const persisted = JSON.parse(localStorage.getItem(gameWorldProgressKey(rainyMondayContent.world.id))!);
    expect(Object.keys(persisted).sort()).toEqual(["contentRevision", "profile", "state", "worldId"]);
    expect(persisted).not.toHaveProperty("reply");

    cleanup();
    renderGame();
    expect(screen.getByRole("heading", { level: 1, name: "Office" })).toBeInTheDocument();
    expect(screen.getByText("A coworker you often talk with; you have already chatted about a rainy commute.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /optional scene/i })).not.toBeInTheDocument();
  });

  it("protects an invalid local save instead of clearing it or silently starting over", () => {
    const key = gameWorldProgressKey(rainyMondayContent.world.id);
    localStorage.setItem(key, "not-json");
    renderGame();
    expect(screen.getByRole("heading", { name: "This device's story progress could not be read" })).toBeInTheDocument();
    expect(screen.getByText(/The existing save was left unchanged/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: localizeGameWorldText(rainyMondayContent.world.moments[0].objective, "en") })).not.toBeInTheDocument();
    expect(localStorage.getItem(key)).toBe("not-json");
  });

  it("keeps replies in memory only and restarts an unfinished moment after remount", async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole("button", { name: /start conversation/i }));
    await user.click(screen.getByRole("button", { name: /start this scene/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("さっきより雨が強くなりましたね。駅までの道に水たまりができていました。")).toBeInTheDocument();
    expect(localStorage.getItem(gameWorldProgressKey(rainyMondayContent.world.id))).toBeNull();

    cleanup();
    renderGame();
    expect(screen.getByRole("heading", { level: 1, name: "Aoba Station" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start conversation/i })).toBeInTheDocument();
    expect(screen.queryByText("さっきより雨が強くなりましたね。駅までの道に水たまりができていました。")).not.toBeInTheDocument();
  });

  it("shows the short-to-rich retry and unlocks the optional route only after the richer completion is saved", async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole("button", { name: /start conversation/i }));
    await user.click(screen.getByRole("button", { name: /start this scene/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /本当ですね/ }));
    await user.click(screen.getByRole("button", { name: /different phrasing/i }));
    await user.click(screen.getByRole("button", { name: /商店街の屋根のある道/ }));

    const comparison = screen.getByRole("complementary", { name: "Compare your previous and revised response" });
    expect(comparison).toHaveTextContent("本当ですね。傘を持ってきてよかったです。");
    expect(comparison).toHaveTextContent("そうですね。私は商店街の屋根のある道を通りました。");
    expect(screen.queryByRole("button", { name: /optional scene/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /optional scene/i })).toBeInTheDocument());
    expect(screen.getByText(/Current connection:/)).toBeInTheDocument();
    expect(screen.getByText(/New scene unlocked:/)).toBeInTheDocument();
  });

  it("does not publish an unlock until a failed checkpoint write is retried and confirmed", async () => {
    const user = userEvent.setup();
    const key = gameWorldProgressKey(rainyMondayContent.world.id);
    const originalSetItem = Storage.prototype.setItem.bind(localStorage);
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((itemKey, value) => {
      if (itemKey === key) throw new Error("synthetic quota failure");
      originalSetItem(itemKey, value);
    });
    renderGame();
    const next = rainyMondayContent.world.moments[1];
    await user.click(screen.getByRole("button", { name: /start conversation/i }));
    await user.click(screen.getByRole("button", { name: /start this scene/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /本当ですね/ }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/not saved on this device yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: new RegExp(localizeGameWorldText(next.objective, "en")) })).not.toBeInTheDocument();
    expect(localStorage.getItem(key)).toBeNull();

    setSpy.mockRestore();
    await user.click(screen.getByRole("button", { name: /retry saving scene/i }));
    await waitFor(() => expect(screen.getByText(localizeGameWorldText(next.objective, "en"))).toBeInTheDocument());
  });
});
