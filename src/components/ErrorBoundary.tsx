import { Component, type ErrorInfo, type ReactNode } from 'react';
import { PrimaryButton, SecondaryButton } from './trip-platform/shared/ui';

type Props = { children: ReactNode; title?: string };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Travel Buddy UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="rounded-3xl border border-rose-300/30 bg-rose-950/30 p-6 text-rose-50" role="alert">
        <h2 className="text-xl font-semibold">{this.props.title ?? 'Something went wrong'}</h2>
        <p className="mt-2 text-sm text-rose-100/90">
          The panel failed to render. Your local data should still be intact — try reloading or opening another tab.
        </p>
        <p className="mt-3 rounded-xl bg-black/20 px-3 py-2 font-mono text-xs">{this.state.error.message}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={() => this.setState({ error: null })}>
            Try again
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => window.location.reload()}>
            Reload app
          </SecondaryButton>
        </div>
      </div>
    );
  }
}
