import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

// Service-worker update lifecycle (#327). registerType is "prompt", so a new
// build installs into the waiting SW without auto-reloading; this hook surfaces
// `needRefresh` (drives the UpdateToast) and `updateApp` (applies the waiting SW
// + reloads). Without this, the auto-injected bare registerSW.js only called
// navigator.serviceWorker.register and never told the running page about a new
// version, so users were stuck on the old build until an incognito visit.
//
// Safe-window auto apply (user feedback 2026-07: "都要手動太不人性"): the app
// knows when a reload is harmless, so it applies the waiting SW by itself at
// those moments instead of always waiting for a toast click. `safeViewKey` is
// the current top-level view name, or null while the learner is mid-practice
// (challenge / mock — a reload there would wipe the running question set):
//   - update arrives while the tab is hidden on a safe view  -> apply now
//   - tab goes hidden on a safe view with an update waiting  -> apply (the
//     reload happens in the background; the tab comes back on the new build)
//   - the view CHANGES to (or between) safe views             -> apply (the
//     page is transitioning anyway, one reload is barely visible)
//   - visible + same view, or mid-practice                    -> never; the
//     toast stays as the manual path
//
// Discovery: onRegisteredSW polls for a new SW hourly, and the tab re-checks
// whenever it becomes visible again, so a long-open tab notices a deploy at
// the next refocus instead of up to an hour later.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function usePwaUpdate(safeViewKey: string | null) {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  // Loose update() return type: the DOM lib types it Promise<ServiceWorkerRegistration>,
  // test doubles return Promise<void>; we only ever fire-and-forget it.
  const registrationRef = useRef<{ update: () => Promise<unknown> } | null>(null);
  // Refs mirror the reactive values so the SW callbacks and the (single)
  // visibilitychange listener always read the current state.
  const needRefreshRef = useRef(false);
  // safeKeyRef is the latest-value bridge for the external SW callbacks and the
  // visibilitychange listener. It must never be written during render (#678);
  // the layout effect below syncs it from safeViewKey after every commit.
  const safeKeyRef = useRef<string | null>(null);

  const updateApp = useCallback(() => {
    void updateRef.current?.(true);
  }, []);

  useLayoutEffect(() => {
    safeKeyRef.current = safeViewKey;
  }, [safeViewKey]);

  useEffect(() => {
    updateRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefreshRef.current = true;
        setNeedRefresh(true);
        // Deploy landed while the learner was away: apply invisibly.
        if (document.hidden && safeKeyRef.current !== null) {
          void updateRef.current?.(true);
        }
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          registrationRef.current = registration;
          setInterval(() => {
            void registration.update();
          }, UPDATE_CHECK_INTERVAL_MS);
        }
      }
    });
    // registerSW is idempotent per page load; the empty deps are deliberate.
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (needRefreshRef.current && safeKeyRef.current !== null) {
          updateApp();
        }
      } else {
        // Back in view: check for a new SW right away instead of waiting for
        // the hourly poll.
        void registrationRef.current?.update();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [updateApp]);

  // View navigation is a safe seam: if an update is waiting and the learner
  // lands on (or moves between) non-practice views, apply it there.
  const previousKeyRef = useRef(safeViewKey);
  useEffect(() => {
    const changed = previousKeyRef.current !== safeViewKey;
    previousKeyRef.current = safeViewKey;
    if (changed && safeViewKey !== null && needRefresh) {
      updateApp();
    }
  }, [safeViewKey, needRefresh, updateApp]);

  return { needRefresh, updateApp };
}
