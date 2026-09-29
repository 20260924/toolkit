import { Component, Suspense, type ComponentType, type ReactNode } from "react";

export function AppPage({ View }: { View: ComponentType }) {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<p className="font-mono text-sm text-muted">loading…</p>}>
        <View />
      </Suspense>
    </AppErrorBoundary>
  );
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  override state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  override render() {
    if (this.state.error === null) return this.props.children;
    return (
      <pre className="overflow-auto font-mono text-sm whitespace-pre-wrap text-danger">
        {String(this.state.error instanceof Error ? this.state.error.stack : this.state.error)}
      </pre>
    );
  }
}
