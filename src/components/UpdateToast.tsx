import { RefreshCw } from "lucide-react";

// "A new version is available" toast (#327). Non-intrusive: a returning learner
// with an installed service worker sees this instead of being silently reloaded
// mid-drill. Clicking it applies the waiting SW and reloads. Pure presentation;
// the SW lifecycle lives in usePwaUpdate.
export function UpdateToast({ label, onUpdate }: { label: string; onUpdate: () => void }) {
  return (
    <div className="update-toast" role="status" aria-live="polite">
      <button type="button" className="update-toast-button" onClick={onUpdate}>
        <RefreshCw aria-hidden="true" />
        {label}
      </button>
    </div>
  );
}
