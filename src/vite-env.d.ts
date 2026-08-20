/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Cloudflare Zaraz (#404): the snippet injects window.zaraz in production.
// trackEvent never assumes it exists; declared here so src/lib/analytics.ts
// can call it under TS strict without `any`.
interface Window {
  __tcfapi?: import("./lib/adsense").TcfApi;
  adsbygoogle?: Array<Record<string, never>>;
  zaraz?: {
    track: (name: string, payload: Record<string, unknown>) => void;
  };
}
