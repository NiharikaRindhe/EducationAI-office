import React from 'react';

/**
 * Catches render-time crashes anywhere below it.
 *
 * Without this, one thrown error inside any component unmounts the entire
 * React tree and leaves a blank white page — for a classroom of students
 * mid-exam, with no message and no way back. A boundary turns that into a
 * recoverable screen.
 *
 * Deliberately a class component: `getDerivedStateFromError` /
 * `componentDidCatch` have no hook equivalent.
 */

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Kept as console output rather than a toast: this is for whoever is
    // debugging the lab PC, not for the student looking at the screen.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ error: null });
    // Hash router — reset the fragment and let the route guards decide where
    // this user actually belongs rather than guessing their portal here.
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 flex flex-col gap-4 text-center">
          <span className="text-3xl" role="img" aria-label="">
            ⚠️
          </span>
          <h1 className="font-display font-bold text-lg text-slate-800">Something went wrong</h1>
          <p className="font-sans text-[13px] text-slate-500 leading-relaxed">
            This page hit an unexpected error. Your work is saved on the server — reloading usually fixes it.
            If it keeps happening, tell your teacher or school admin.
          </p>

          <div className="flex gap-2 justify-center mt-1">
            <button
              onClick={this.handleReload}
              className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              Reload page
            </button>
            <button
              onClick={this.handleGoHome}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              Go home
            </button>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-left text-[11px] text-rose-600 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
