// Crash-safe localStorage access.
//
// Reading or writing window.localStorage throws in several real
// situations -- Safari private mode, storage disabled by policy, quota
// exceeded, or no `window` at all (SSR / tests). A bare
// `window.localStorage.getItem(...)` at module/startup time would then
// take the whole app down. These helpers degrade to null / no-op
// instead, so a blocked storage only costs persistence, not the app.
//
// (createAttemptStore in storage.ts has its own richer in-memory
// fallback for the attempt log; this is the lightweight primitive for
// simple key/value preferences like the theme.)

export function readStored(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // Persistence unavailable -- ignore so the caller still works.
  }
}
