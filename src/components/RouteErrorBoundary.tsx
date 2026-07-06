import { Component, type ErrorInfo, type ReactNode } from "react";

type RouteErrorBoundaryProps = {
  resetKey: string;
  title: string;
  body: string;
  reloadLabel: string;
  children: ReactNode;
};

type RouteErrorBoundaryState = {
  error: Error | null;
};

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[route-error]", error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <section className="route-error" role="alert" aria-live="assertive">
        <h2>{this.props.title}</h2>
        <p>{this.props.body}</p>
        <button type="button" className="next-button" onClick={() => window.location.reload()}>
          {this.props.reloadLabel}
        </button>
      </section>
    );
  }
}
