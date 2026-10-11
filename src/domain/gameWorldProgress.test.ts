import { describe, expect, it } from "vitest";
import { createConversationSession } from "./conversationSession";
import {
  applyCompletedConversationSession,
  type GameWorldDefinition,
  type GameWorldState
} from "./gameWorld";
import {
  GAME_WORLD_PROGRESS_PROFILE,
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

function countingStorage(initial: Record<string, string> = {}) {
  const storage = memoryStorage(initial);
  const calls = { reads: 0, writes: 0 };
  return {
    ...storage,
    calls,
    getItem(key: string) {
      calls.reads += 1;
      return storage.getItem(key);
    },
    setItem(key: string, value: string) {
      calls.writes += 1;
      storage.setItem(key, value);
    }
  };
}

function completeRainEntry(): GameWorldState {
  const { world } = rainyMondayContent;
  const moment = world.moments.find(({ id }) => id === "rain-entry");
  if (moment == null) throw new Error("Rain entry moment is missing.");
  const session = createConversationSession(world.sessionDefinitions);
  if (!session.select(moment.scenarioId) || !session.start()) {
    throw new Error("Could not start the rain entry session.");
  }
  while (session.getState().phase !== "complete") {
    const current = session.getState();
    if (current.phase === "interaction" && current.step?.kind === "learner_response") {
      const response = current.step.responseExamples[0];
      if (response == null || session.submitResponse(response.id) == null) {
        throw new Error("Could not submit the rain entry response.");
      }
      continue;
    }
    if (current.phase === "interaction" && current.step?.kind === "partner_line") {
      if (!session.advance()) throw new Error("Could not advance the rain entry partner line.");
      continue;
    }
    if (current.phase === "feedback") {
      if (!session.continue()) throw new Error("Could not continue the rain entry session.");
      continue;
    }
    throw new Error("Rain entry session did not reach completion.");
  }
  const result = applyCompletedConversationSession(world, world.initialState, moment.id, session.getState());
  if (!result.applied) throw new Error("Could not complete the rain entry moment.");
  return result.state;
}

function encodeCheckpoint(state: GameWorldState): string {
  return JSON.stringify({
    profile: GAME_WORLD_PROGRESS_PROFILE,
    worldId: rainyMondayContent.world.id,
    contentRevision: rainyMondayContentRevision,
    state
  });
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

  it("preserves prior bytes when storage rejects a valid write", () => {
    const { world } = rainyMondayContent;
    const key = gameWorldProgressKey(world.id);
    const before = encodeCheckpoint(world.initialState);
    const storage = countingStorage({ [key]: before });
    const rejectedStorage = {
      ...storage,
      setItem() {
        storage.calls.writes += 1;
        throw new Error("quota");
      }
    };

    expect(writeConfirmedGameWorldProgress(rejectedStorage, world, rainyMondayContentRevision, completeRainEntry()))
      .toEqual({ status: "storage_error" });
    expect(storage.calls).toEqual({ reads: 0, writes: 1 });
    expect(storage.values.get(key)).toBe(before);
  });

  it("preserves prior bytes when readback does not match a valid write", () => {
    const { world } = rainyMondayContent;
    const key = gameWorldProgressKey(world.id);
    const before = encodeCheckpoint(world.initialState);
    const storage = countingStorage({ [key]: before });
    const staleReadbackStorage = {
      ...storage,
      getItem(readKey: string) {
        storage.calls.reads += 1;
        return storage.values.get(readKey) ?? null;
      },
      setItem() {
        storage.calls.writes += 1;
      }
    };

    expect(writeConfirmedGameWorldProgress(staleReadbackStorage, world, rainyMondayContentRevision, completeRainEntry()))
      .toEqual({ status: "readback_mismatch" });
    expect(storage.calls).toEqual({ reads: 1, writes: 1 });
    expect(storage.values.get(key)).toBe(before);
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

  it("does not replace progressed bytes when toJSON substitutes the valid initial state", () => {
    const { world } = rainyMondayContent;
    const progressed = completeRainEntry();
    const key = gameWorldProgressKey(world.id);
    const before = encodeCheckpoint(progressed);
    const storage = countingStorage({ [key]: before });
    const candidate = { ...progressed };
    Object.defineProperty(candidate, "toJSON", { value: () => world.initialState });

    expect(writeConfirmedGameWorldProgress(storage, world, rainyMondayContentRevision, candidate))
      .toEqual({ status: "invalid_state" });
    expect(storage.calls).toEqual({ reads: 0, writes: 0 });
    expect(storage.values.get(key)).toBe(before);
  });

  it("rejects an unreachable original state even when toJSON returns a valid state", () => {
    const { world } = rainyMondayContent;
    const key = gameWorldProgressKey(world.id);
    const before = encodeCheckpoint(world.initialState);
    const storage = countingStorage({ [key]: before });
    const candidate = { ...world.initialState, completedMomentIds: ["unknown-moment"] };
    Object.defineProperty(candidate, "toJSON", { value: () => world.initialState });

    expect(writeConfirmedGameWorldProgress(storage, world, rainyMondayContentRevision, candidate))
      .toEqual({ status: "invalid_state" });
    expect(storage.calls).toEqual({ reads: 0, writes: 0 });
    expect(storage.values.get(key)).toBe(before);
  });

  it("contains a throwing state getter before storage access", () => {
    const { world } = rainyMondayContent;
    const key = gameWorldProgressKey(world.id);
    const before = encodeCheckpoint(world.initialState);
    const storage = countingStorage({ [key]: before });
    const candidate = { ...world.initialState };
    Object.defineProperty(candidate, "completedMomentIds", {
      get() { throw new Error("state getter failed"); }
    });

    expect(writeConfirmedGameWorldProgress(storage, world, rainyMondayContentRevision, candidate))
      .toEqual({ status: "invalid_state" });
    expect(storage.calls).toEqual({ reads: 0, writes: 0 });
    expect(storage.values.get(key)).toBe(before);
  });

  it("contains a revoked state proxy before storage access", () => {
    const { world } = rainyMondayContent;
    const key = gameWorldProgressKey(world.id);
    const before = encodeCheckpoint(world.initialState);
    const storage = countingStorage({ [key]: before });
    const revocable = Proxy.revocable({ ...world.initialState }, {});
    revocable.revoke();

    expect(writeConfirmedGameWorldProgress(
      storage,
      world,
      rainyMondayContentRevision,
      revocable.proxy as unknown as GameWorldState
    )).toEqual({ status: "invalid_state" });
    expect(storage.calls).toEqual({ reads: 0, writes: 0 });
    expect(storage.values.get(key)).toBe(before);
  });
});
