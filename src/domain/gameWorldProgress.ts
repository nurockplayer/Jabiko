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

function ownDataValue(value: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor != null && "value" in descriptor ? descriptor.value : undefined;
}

function copyStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  const copy: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = ownDataValue(value, String(index));
    if (typeof item !== "string") return null;
    copy.push(item);
  }
  return Object.freeze(copy);
}

function copyOutcomeReferences(value: unknown): GameWorldState["outcomeReferences"] | null {
  if (!Array.isArray(value)) return null;
  const copy: { momentId: string; outcomeId: string }[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const reference = ownDataValue(value, String(index));
    if (!isRecord(reference) || !hasExactKeys(reference, ["momentId", "outcomeId"])) return null;
    const momentId = ownDataValue(reference, "momentId");
    const outcomeId = ownDataValue(reference, "outcomeId");
    if (typeof momentId !== "string" || typeof outcomeId !== "string") return null;
    copy.push(Object.freeze({ momentId, outcomeId }));
  }
  return Object.freeze(copy);
}

/** Copy only declared data fields so candidate hooks cannot alter the validated state. */
function captureProgressState(value: unknown): GameWorldState | null {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      "completedMomentIds", "relationshipStages", "unlockedLocationIds", "unlockedMomentIds", "outcomeReferences"
    ])) return null;

    const completedMomentIds = copyStringArray(ownDataValue(value, "completedMomentIds"));
    const relationshipStagesValue = ownDataValue(value, "relationshipStages");
    const unlockedLocationIds = copyStringArray(ownDataValue(value, "unlockedLocationIds"));
    const unlockedMomentIds = copyStringArray(ownDataValue(value, "unlockedMomentIds"));
    const outcomeReferences = copyOutcomeReferences(ownDataValue(value, "outcomeReferences"));
    if (
      completedMomentIds == null || !isRecord(relationshipStagesValue) ||
      unlockedLocationIds == null || unlockedMomentIds == null || outcomeReferences == null
    ) return null;

    const stageEntries: [string, string][] = [];
    for (const npcId of Object.keys(relationshipStagesValue)) {
      const stageId = ownDataValue(relationshipStagesValue, npcId);
      if (typeof stageId !== "string") return null;
      stageEntries.push([npcId, stageId]);
    }

    const projection: GameWorldState = Object.freeze({
      completedMomentIds,
      relationshipStages: Object.freeze(Object.fromEntries(stageEntries)),
      unlockedLocationIds,
      unlockedMomentIds,
      outcomeReferences
    });
    return isProgressStateShape(projection) ? projection : null;
  } catch {
    return null;
  }
}

function sameProgressState(left: GameWorldState, right: GameWorldState): boolean {
  const sameStringArray = (first: readonly string[], second: readonly string[]): boolean =>
    first.length === second.length && first.every((value, index) => value === second[index]);
  const leftNpcIds = Object.keys(left.relationshipStages);
  const rightNpcIds = Object.keys(right.relationshipStages);
  return sameStringArray(left.completedMomentIds, right.completedMomentIds) &&
    sameStringArray(left.unlockedLocationIds, right.unlockedLocationIds) &&
    sameStringArray(left.unlockedMomentIds, right.unlockedMomentIds) &&
    leftNpcIds.length === rightNpcIds.length &&
    leftNpcIds.every((npcId) =>
      Object.prototype.hasOwnProperty.call(right.relationshipStages, npcId) &&
      left.relationshipStages[npcId] === right.relationshipStages[npcId]
    ) &&
    left.outcomeReferences.length === right.outcomeReferences.length &&
    left.outcomeReferences.every((reference, index) =>
      reference.momentId === right.outcomeReferences[index]?.momentId &&
      reference.outcomeId === right.outcomeReferences[index]?.outcomeId
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
  if (!isContentRevision(contentRevision)) {
    return { status: "invalid_state" };
  }
  const key = gameWorldProgressKey(world.id);
  let encoded: string;
  try {
    const candidate = captureProgressState(state);
    if (candidate == null || getGameWorldAvailability(world, candidate).status !== "ready") {
      return { status: "invalid_state" };
    }
    const envelope: GameWorldProgressEnvelope = {
      profile: GAME_WORLD_PROGRESS_PROFILE,
      worldId: world.id,
      contentRevision,
      state
    };
    encoded = JSON.stringify(envelope);
    // Validate the actual bytes before they can replace the last confirmed checkpoint.
    const serialized = decodeEnvelope(JSON.parse(encoded) as unknown, world, contentRevision);
    if (serialized.status !== "ready") {
      return { status: "invalid_state" };
    }
    const serializedState = captureProgressState(serialized.state);
    if (serializedState == null || !sameProgressState(candidate, serializedState)) {
      return { status: "invalid_state" };
    }
  } catch {
    return { status: "invalid_state" };
  }
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
