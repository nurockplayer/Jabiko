import {
  getGameWorldAvailability,
  type GameWorldDefinition,
  type GameWorldState
} from "./gameWorld";

export const GAME_WORLD_PROGRESS_PROFILE = "jabiko-world-progress/v1" as const;

export interface GameWorldProgressEnvelope {
  profile: typeof GAME_WORLD_PROGRESS_PROFILE;
  worldId: string;
  contentRevision: number;
  state: GameWorldState;
}
export interface GameWorldProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type GameWorldProgressRead =
  | { status: "missing" }
  | { status: "ready"; state: GameWorldState }
  | { status: "invalid" }
  | { status: "incompatible" }
  | { status: "storage_error" };

export type GameWorldProgressWrite =
  | { status: "confirmed" }
  | { status: "invalid_state" }
  | { status: "storage_error" }
  | { status: "readback_mismatch" };

export function gameWorldProgressKey(worldId: string): string {
  return `jabiko-world-progress/v1:${worldId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isContentRevision(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}

function isProgressStateShape(value: unknown): value is GameWorldState {
  if (!isRecord(value) || !hasExactKeys(value, [
    "completedMomentIds", "relationshipStages", "unlockedLocationIds", "unlockedMomentIds", "outcomeReferences"
  ])) return false;
  if (
    !isStringArray(value.completedMomentIds) ||
    !isStringArray(value.unlockedLocationIds) ||
    !isStringArray(value.unlockedMomentIds) ||
    !isRecord(value.relationshipStages) ||
    !Object.values(value.relationshipStages).every((stageId) => typeof stageId === "string") ||
    !Array.isArray(value.outcomeReferences)
  ) return false;
  return value.outcomeReferences.every((reference) =>
    isRecord(reference) && hasExactKeys(reference, ["momentId", "outcomeId"]) &&
    typeof reference.momentId === "string" && typeof reference.outcomeId === "string"
  );
}

function decodeEnvelope(value: unknown, world: GameWorldDefinition, contentRevision: number): GameWorldProgressRead {
  if (!isRecord(value) || !hasExactKeys(value, ["profile", "worldId", "contentRevision", "state"])) {
    return { status: "invalid" };
  }
  if (
    value.profile !== GAME_WORLD_PROGRESS_PROFILE ||
    value.worldId !== world.id ||
    !isContentRevision(value.contentRevision) || value.contentRevision !== contentRevision
  ) return { status: "incompatible" };
  if (!isProgressStateShape(value.state)) return { status: "invalid" };
  const availability = getGameWorldAvailability(world, value.state);
  return availability.status === "ready"
    ? { status: "ready", state: value.state }
    : { status: "invalid" };
}

export function readGameWorldProgress(
  storage: GameWorldProgressStorage,
  world: GameWorldDefinition,
  contentRevision: number
): GameWorldProgressRead {
  if (!isContentRevision(contentRevision)) return { status: "incompatible" };
  let raw: string | null;
  try {
    raw = storage.getItem(gameWorldProgressKey(world.id));
  } catch {
    return { status: "storage_error" };
  }
  if (raw === null) return { status: "missing" };
  try {
    return decodeEnvelope(JSON.parse(raw) as unknown, world, contentRevision);
  } catch {
    return { status: "invalid" };
  }
}

/** Persist one completed candidate and confirm it by reading back the exact envelope. */
export function writeConfirmedGameWorldProgress(
  storage: GameWorldProgressStorage,
  world: GameWorldDefinition,
  contentRevision: number,
  state: GameWorldState
): GameWorldProgressWrite {
  if (!isContentRevision(contentRevision) || getGameWorldAvailability(world, state).status !== "ready") {
    return { status: "invalid_state" };
  }
  const envelope: GameWorldProgressEnvelope = {
    profile: GAME_WORLD_PROGRESS_PROFILE,
    worldId: world.id,
    contentRevision,
    state
  };
  const key = gameWorldProgressKey(world.id);
  const encoded = JSON.stringify(envelope);
  try {
    storage.setItem(key, encoded);
    const readback = storage.getItem(key);
    if (readback !== encoded) return { status: "readback_mismatch" };
    const decoded = decodeEnvelope(JSON.parse(readback) as unknown, world, contentRevision);
    return decoded.status === "ready" ? { status: "confirmed" } : { status: "readback_mismatch" };
  } catch {
    return { status: "storage_error" };
  }
}
