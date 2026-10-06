import { useEffect, useSyncExternalStore } from "react";

// Header segments an app adds after its own id: toolkit / <app> / <crumb> / …
export type Crumb = { label: string; to?: string };

let current: Crumb[] = [];
const listeners = new Set<() => void>();

function set(crumbs: Crumb[]) {
  current = crumbs;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCurrentCrumbs(): Crumb[] {
  return useSyncExternalStore(subscribe, () => current);
}

export function useCrumbs(crumbs: Crumb[]) {
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    set(JSON.parse(key) as Crumb[]);
    return () => set([]);
  }, [key]);
}
