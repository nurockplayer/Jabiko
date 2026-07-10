import { Component, type ErrorInfo, type ReactNode } from "react";
import { isChunkLoadError, recoverPoisonedAssets } from "../lib/assetRecovery";

// One silent self-repair per session: enough to recover a poisoned cache
// (2026-07-06 outage) without ever looping a genuinely broken deploy.
const RECOVERY_ATTEMPT_KEY = "jabiko:route-recovery";

function recoveryAttempts(): number {
  try {
    return Number(sessionStorage.getItem(RECOVERY_ATTEMPT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function setRecoveryAttempts(count: number) {
  try {
    if (count <= 0) sessionStorage.removeItem(RECOVERY_ATTEMPT_KEY);
    else sessionStorage.setItem(RECOVERY_ATTEMPT_KEY, String(count));
  } catch {
    // sessionStorage unavailable: recovery still runs, just unguarded.
  }
}

type RouteErrorBoundaryProps = {
  resetKey: string;
  title: string;
  body: string;
  reloadLabel: string;
  clearCacheLabel: string;
  homeLabel: string;
  onGoHome: () => void;
  context: {
    route: string;
    locale: string;
    buildVersion: string;
  };
  children: ReactNode;
  /** Injectable for tests; defaults to the real cache-repair routine. */
  recover?: (error: unknown) => Promise<boolean>;
  /** Injectable for tests; defaults to window.location.reload(). */
  reload?: () => void;
};

type RouteErrorBoundaryState = {
  error: Error | null;
  /** A repair+reload is in flight (button disabled meanwhile). */
  recovering: boolean;
  /** The in-flight repair is the automatic one: keep the screen blank. */
  silent: boolean;
};

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null, recovering: false, silent: false };

  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return { error };
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null, recovering: false, silent: false });
    }
    // A healthy render means any earlier repair worked — reopen the budget
    // so a future incident gets its silent attempt again.
    if (!this.state.error && recoveryAttempts() > 0) {
      setRecoveryAttempts(0);
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[route-error]", error, {
      route: this.props.context.route,
      locale: this.props.context.locale,
      buildVersion: this.props.context.buildVersion,
      componentStack: errorInfo.componentStack
    });
    // Chunk-load failures are almost always a poisoned/stale local cache
    // (immutable HTTP entry or old SW shell) — a bare reload can't fix those,
    // so repair the caches and reload once, silently. Ordinary render errors
    // never auto-reload (that would loop a real bug).
    if (isChunkLoadError(error) && recoveryAttempts() < 1) {
      setRecoveryAttempts(recoveryAttempts() + 1);
      this.setState({ recovering: true, silent: true });
      this.repairThenReload(error);
    }
  }

  repairThenReload(error: unknown) {
    const { recover = recoverPoisonedAssets, reload = () => window.location.reload() } =
      this.props;
    recover(error)
      .catch(() => undefined)
      .then(() => reload());
  }

  handleReloadClick = () => {
    this.setState({ recovering: true });
    const { reload = () => window.location.reload() } = this.props;
    reload();
  };

  handleClearCacheClick = () => {
    // The button must actually repair, not just reload: for a user pinned by
    // a poisoned immutable cache entry + stale SW, reload alone is a no-op.
    this.setState({ recovering: true });
    this.repairThenReload(this.state.error);
  };

  handleGoHomeClick = () => {
    this.props.onGoHome();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    // While the silent auto-repair runs, keep the route blank instead of
    // flashing an error screen the reload is about to replace anyway.
    if (this.state.silent) {
      return null;
    }

    return (
      <section className="route-error" role="alert" aria-live="assertive">
        <h2>{this.props.title}</h2>
        <p>{this.props.body}</p>
        <button
          type="button"
          className="next-button"
          disabled={this.state.recovering}
          onClick={this.handleReloadClick}
        >
          {this.props.reloadLabel}
        </button>
        <div className="route-error-actions">
          <button
            type="button"
            className="next-button"
            disabled={this.state.recovering}
            onClick={this.handleClearCacheClick}
          >
            {this.props.clearCacheLabel}
          </button>
          <button
            type="button"
            className="next-button route-error-home"
            disabled={this.state.recovering}
            onClick={this.handleGoHomeClick}
          >
            {this.props.homeLabel}
          </button>
        </div>
      </section>
    );
  }
}
