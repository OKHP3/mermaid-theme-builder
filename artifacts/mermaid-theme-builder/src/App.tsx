import { Component, type ReactNode } from "react";
import { ThemeBuilder } from "@/pages/ThemeBuilder";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-destructive/60">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div className="text-center max-w-md">
            <p className="text-sm font-semibold text-foreground mb-1">Failed to load</p>
            <p className="text-xs text-muted-foreground mb-3">
              Something went wrong initialising the theme builder.
            </p>
            <pre className="text-[10px] text-destructive/70 bg-destructive/8 border border-destructive/20 rounded p-3 text-left whitespace-pre-wrap font-mono max-h-40 overflow-auto">
              {this.state.error.message}
            </pre>
          </div>
          <button
            className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeBuilder />
    </ErrorBoundary>
  );
}

export default App;
