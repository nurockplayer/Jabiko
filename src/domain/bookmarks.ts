// Question bookmarks (#470): the learner stars any question -- right or
// wrong -- to revisit later in a dedicated "收藏" practice mode.
//
// State is a plain ordered list of question ids in localStorage. Order is
// add-order (most-recently-starred last), which the review pool preserves.
// Stateless module (reads/writes storage on every call), same crash-safe
// idiom as levelPreference.ts -- persistence failure never throws, it just
// behaves as "no bookmarks". Cross-device sync (a Supabase table, mirroring
// the attempts pattern) is a deliberate follow-up; this ships local-first.
import { readStored, writeStored } from "./safeStorage";

export const BOOKMARKS_KEY = "jabiko:bookmarks";

// Parse the stored JSON into an ordered, de-duplicated string list.
// Anything malformed (corrupt JSON, non-array, non-string entries) is
// dropped rather than thrown, so a bad write can never brick the feature.
function readBookmarkList(): string[] {
  const raw = readStored(BOOKMARKS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const entry of parsed) {
      if (typeof entry === "string" && !seen.has(entry)) {
        seen.add(entry);
        ids.push(entry);
      }
    }
    return ids;
  } catch {
    return [];
  }
}

/** Ordered list of bookmarked question ids (add-order, oldest first). */
export function getBookmarkedIds(): string[] {
  return readBookmarkList();
}

/** Membership-friendly view of the bookmarked ids. */
export function readBookmarkedIds(): Set<string> {
  return new Set(readBookmarkList());
}

export function isBookmarked(questionId: string): boolean {
  return readBookmarkList().includes(questionId);
}

/**
 * Add the id if absent, remove it if present. Returns the NEW state
 * (true = now bookmarked, false = now removed) so the caller can update
 * its button without a re-read.
 */
export function toggleBookmark(questionId: string): boolean {
  const ids = readBookmarkList().filter((id) => id !== questionId);
  const wasPresent = ids.length !== readBookmarkList().length;
  if (!wasPresent) {
    ids.push(questionId);
  }
  writeStored(BOOKMARKS_KEY, JSON.stringify(ids));
  return !wasPresent;
}
