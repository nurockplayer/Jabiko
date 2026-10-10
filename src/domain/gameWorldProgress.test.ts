import { describe, expect, it } from "vitest";
import type { GameWorldDefinition, GameWorldState } from "./gameWorld";
import {
  gameWorldProgressKey,
  readGameWorldProgress,
  writeConfirmedGameWorldProgress
} from "./gameWorldProgress";
import { rainyMondayContent, rainyMondayContentRevision } from "./gameWorldContent/rainyMonday";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    values
  };
}

describe("device-local game world progress", () => {
  const world = { id: "rainy-monday" } as GameWorldDefinition;

  it("distinguishes a missing save from invalid bytes without writing a replacement", () => {
    const storage = memoryStorage();
    expect(readGameWorldProgress(storage, world, 1)).toEqual({ status: "missing" });

    storage.setItem(gameWorldProgressKey(world.id), "{broken");
    expect(readGameWorldProgress(storage, world, 1)).toEqual({ status: "invalid" });
    expect(storage.values.get(gameWorldProgressKey(world.id))).toBe("{broken");
  });

  it("keeps the boundary closed and reports storage access errors distinctly", () => {
    const storage = memoryStorage({
      [gameWorldProgressKey(world.id)]: JSON.stringify({
        profile: "jabiko-world-progress/v1",
        worldId: world.id,
        contentRevision: 1,
        state: {},
        learnerReply: "must not be persisted"
      })
    });
    expect(readGameWorldProgress(storage, world, 1)).toEqual({ status: "invalid" });
    expect(readGameWorldProgress({ getItem() { throw new Error("blocked"); }, setItem() {} }, world, 1))
      .toEqual({ status: "storage_error" });
  });

  it("rejects an incompatible positive revision and malformed revision number", () => {
    const storage = memoryStorage({
      [gameWorldProgressKey(rainyMondayContent.world.id)]: JSON.stringify({
        profile: "jabiko-world-progress/v1",
        worldId: rainyMondayContent.world.id,
        contentRevision: 2,
        state: rainyMondayContent.world.initialState
      })
    });
    expect(readGameWorldProgress(storage, rainyMondayContent.world, 1)).toEqual({ status: "incompatible" });
    expect(readGameWorldProgress(storage, rainyMondayContent.world, 0)).toEqual({ status: "incompatible" });
  });

  it("confirms a candidate only after strict readback and refuses unreachable state", () => {
    const storage = memoryStorage();
    const { world } = rainyMondayContent;
    const contentRevision = rainyMondayContentRevision;
    expect(writeConfirmedGameWorldProgress(storage, world, contentRevision, world.initialState)).toEqual({ status: "confirmed" });
    expect(readGameWorldProgress(storage, world, contentRevision)).toEqual({ status: "ready", state: world.initialState });

    const invalid = { ...world.initialState, completedMomentIds: ["project-story"] };
    expect(writeConfirmedGameWorldProgress(storage, world, contentRevision, invalid)).toEqual({ status: "invalid_state" });
    expect(readGameWorldProgress(storage, world, contentRevision)).toEqual({ status: "ready", state: world.initialState });
  });

  it("does not confirm when browser storage rejects or cannot read back a write", () => {
    const { world } = rainyMondayContent;
    const contentRevision = rainyMondayContentRevision;
    const deniedWrite = {
      getItem: () => null,
      setItem: () => { throw new Error("quota"); }
    };
    expect(writeConfirmedGameWorldProgress(deniedWrite, world, contentRevision, world.initialState))
      .toEqual({ status: "storage_error" });

    const missingReadback = { getItem: () => null, setItem: () => undefined };
    expect(writeConfirmedGameWorldProgress(missingReadback, world, contentRevision, world.initialState))
      .toEqual({ status: "readback_mismatch" });
  });

  it("rejects extra state fields before they can replace a confirmed checkpoint", () => {
    const storage = memoryStorage();
    const { world } = rainyMondayContent;
    const contentRevision = rainyMondayContentRevision;
    expect(writeConfirmedGameWorldProgress(storage, world, contentRevision, world.initialState))
      .toEqual({ status: "confirmed" });
    const key = gameWorldProgressKey(world.id);
    const before = storage.getItem(key);
    const candidate = { ...world.initialState, learnerReply: "must not be persisted" };

    expect(writeConfirmedGameWorldProgress(storage, world, contentRevision, candidate))
      .toEqual({ status: "invalid_state" });
    expect(storage.getItem(key)).toBe(before);
    expect(readGameWorldProgress(storage, world, contentRevision))
      .toEqual({ status: "ready", state: world.initialState });
  });

  it("validates serialized state before any storage write", () => {
    const { world } = rainyMondayContent;
    const candidate = { ...world.initialState };
    Object.defineProperty(candidate, "toJSON", {
      value: () => ({ ...world.initialState, learnerReply: "must not be persisted" })
    });
    let writes = 0;
    const storage = {
      getItem: () => null,
      setItem: () => { writes += 1; }
    };

    expect(writeConfirmedGameWorldProgress(storage, world, rainyMondayContentRevision, candidate))
      .toEqual({ status: "invalid_state" });
    expect(writes).toBe(0);
  });

  it("reports serialization failure without throwing or touching storage", () => {
    const { world } = rainyMondayContent;
    const candidate = { ...world.initialState };
    Object.defineProperty(candidate, "toJSON", {
      value: () => { throw new Error("cannot serialize"); }
    });
    let writes = 0;
    const storage = {
      getItem: () => null,
      setItem: () => { writes += 1; }
    };

    expect(writeConfirmedGameWorldProgress(storage, world, rainyMondayContentRevision, candidate))
      .toEqual({ status: "invalid_state" });
    expect(writes).toBe(0);
  });

  it("rejects malformed runtime state before calling the reachability validator", () => {
    const { world } = rainyMondayContent;
    const candidate = { ...world.initialState, completedMomentIds: undefined } as unknown as GameWorldState;
    const storage = memoryStorage();

    expect(writeConfirmedGameWorldProgress(storage, world, rainyMondayContentRevision, candidate))
      .toEqual({ status: "invalid_state" });
    expect(storage.values.size).toBe(0);
  });
});
