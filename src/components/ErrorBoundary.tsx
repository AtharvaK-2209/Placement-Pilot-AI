/**
 * @file ErrorBoundary.tsx
 * Phase 6A — Error boundary to catch React errors gracefully
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
          <div className="max-w-2xl text-center">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger/10">
                <AlertTriangle size={40} className="text-danger" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="mb-3 text-3xl font-bold text-text-primary">
              Something went wrong
            </h1>
            <p className="mb-6 text-base text-text-secondary">
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>

            {/* Error Details (collapsed by default in production) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 rounded-xl border border-white/5 bg-bg-card p-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary">
                  Error Details (Development Only)
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-text-secondary/70">Error Message:</p>
                    <pre className="mt-1 overflow-x-auto rounded bg-bg-secondary p-2 text-xs text-danger">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-xs font-medium text-text-secondary/70">Component Stack:</p>
                      <pre className="mt-1 max-h-64 overflow-auto rounded bg-bg-secondary p-2 text-xs text-text-secondary">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 active:translate-y-0"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-bg-card px-6 py-3 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-white/20 hover:bg-bg-secondary hover:-translate-y-0.5"
              >
                <Home size={16} />
                Go to Dashboard
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-xs text-text-secondary/60">
              <p>If this problem persists, please try:</p>
              <ul className="mt-2 space-y-1">
                <li>• Refreshing the page</li>
                <li>• Clearing your browser cache</li>
                <li>• Checking your internet connection</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Functional Error Fallback Component ───────────────────────────────────────

export function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error?: Error; 
  resetError?: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-danger/20 bg-danger/5 p-8">
      <div className="max-w-md text-center">
        <AlertTriangle size={32} className="mx-auto mb-4 text-danger" />
        <h3 className="mb-2 text-lg font-semibold text-text-primary">
          Component Error
        </h3>
        <p className="mb-4 text-sm text-text-secondary">
          This component encountered an error and couldn't be displayed.
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <pre className="mb-4 max-h-32 overflow-auto rounded bg-bg-secondary p-2 text-left text-xs text-danger">
            {error.toString()}
          </pre>
        )}
        {resetError && (
          <button
            onClick={resetError}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
