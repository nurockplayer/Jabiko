// Challenge deep-linking (issue #264): express a challenge drill's mode + level
// range as URL query params so a specific drill can be shared / bookmarked /
// survive a refresh, e.g. `/challenge?mode=daily` or `/challenge?mode=exam&level=n2n3`.
//
// Scope (MVP): the unambiguous mode + level-range subset. Mock-section deep
// links (examSection {level, promptLabel}) are a follow-up. The result is
// structurally a subset of SessionInit, so App can hand it straight to
// openChallenge -- this module stays UI-free and only depends on domain types.
import type { PracticeMode } from "./practiceMode";
import type { LevelRange } from "./levelRange";

export type ChallengeDeepLink = { mode?: PracticeMode; levelRange?: LevelRange };

const MODES: readonly PracticeMode[] = ["basic", "cloze", "daily", "kana", "starter", "pattern", "exam", "review", "vocab"];
const RANGES: readonly LevelRange[] = ["all", "n1n2", "n2n3", "n3n4", "n4n5", "starter"];

function asMode(value: string | null): PracticeMode | undefined {
  return value !== null && (MODES as readonly string[]).includes(value) ? (value as PracticeMode) : undefined;
}

function asRange(value: string | null): LevelRange | undefined {
  return value !== null && (RANGES as readonly string[]).includes(value) ? (value as LevelRange) : undefined;
}

// Parse `?mode=&level=` into a launch seed. Unknown/absent params are ignored;
// returns undefined when nothing usable is present (caller keeps the default
// landing) so a bare `/challenge` is unchanged.
export function challengeInitFromQuery(search: string): ChallengeDeepLink | undefined {
  const params = new URLSearchParams(search);
  const mode = asMode(params.get("mode"));
  const levelRange = asRange(params.get("level"));
  if (!mode && !levelRange) return undefined;
  const init: ChallengeDeepLink = {};
  if (mode) init.mode = mode;
  if (levelRange) init.levelRange = levelRange;
  return init;
}

// Inverse: build the shareable query string for a drill. Kept here (with a
// tested round-trip) for link-building / a future live URL sync.
export function challengeQueryFromInit(init: ChallengeDeepLink | undefined): string {
  if (!init) return "";
  const params = new URLSearchParams();
  if (init.mode) params.set("mode", init.mode);
  if (init.levelRange) params.set("level", init.levelRange);
  const query = params.toString();
  return query ? `?${query}` : "";
}
