import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

// Service-worker update lifecycle (#327). registerType is "prompt", so a new
// build installs into the waiting SW without auto-reloading; this hook surfaces
// `needRefresh` (drives the UpdateToast) and `updateApp` (applies the waiting SW
// + reloads). Without this, the auto-injected bare registerSW.js only called
// navigator.serviceWorker.register and never told the running page about a new
// version, so users were stuck on the old build until an incognito visit.
//
// onRegisteredSW also polls for a new SW hourly, so a long-open tab still
// notices a deploy instead of waiting for the browser's ~24h check.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function usePwaUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          setInterval(() => {
            void registration.update();
          }, UPDATE_CHECK_INTERVAL_MS);
        }
      }
    });
  }, []);

  const updateApp = useCallback(() => {
    void updateRef.current?.(true);
  }, []);

  return { needRefresh, updateApp };
}
