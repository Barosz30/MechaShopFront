import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MechaShop render error', error, errorInfo);
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(67,216,255,0.16),_transparent_24%),radial-gradient(circle_at_85%_12%,_rgba(147,120,255,0.16),_transparent_22%),linear-gradient(180deg,_#050816_0%,_#091224_45%,_#04070f_100%)] px-4 py-10 text-slate-100">
        <main className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <section className="glass-panel w-full rounded-[2rem] border border-white/10 p-8 text-center sm:p-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-rose-400/12 text-rose-300">
              <AlertTriangle className="h-7 w-7" />
            </span>
            <h1 className="mt-6 text-3xl font-semibold text-white">Something interrupted the storefront</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              The page hit an unexpected rendering problem. Reload to recover the shopping session
              and continue browsing.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload storefront
            </button>
          </section>
        </main>
      </div>
    );
  }
}

export default ErrorBoundary;
