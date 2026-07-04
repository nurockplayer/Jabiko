import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BRIDGE_PATH, legacyRedirectTarget, runBridgeResponder } from "./domain/originMigration";

// Domain-move plumbing (#jabiko-app-domain), evaluated before any render:
//
// 1. Framed at the bridge path on the OLD origin: the visitor's service
//    worker intercepted the bridge iframe and served this shell instead of
//    the static migration-bridge.html. Act as the bridge (same protocol)
//    and skip rendering the app entirely.
// 2. Top-level on the OLD origin: the SW also hides the edge 301 (it serves
//    the cached shell without touching the network), so hop to the
//    canonical domain ourselves, preserving path/query/hash.
const framedAtBridge = window.top !== window && window.location.pathname.startsWith(BRIDGE_PATH);
const redirect = window.top === window ? legacyRedirectTarget(window.location.href) : null;

if (framedAtBridge) {
  runBridgeResponder(window.localStorage);
} else if (redirect !== null) {
  window.location.replace(redirect);
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
