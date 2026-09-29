import { lazy, type ComponentType } from "react";

import { apps } from "./registry.ts";
import type { AppEntry } from "./app-entry.ts";

export { apps };

// One lazy component per app, created once so React keeps its state across renders.
const views = new Map<string, ComponentType>(apps.map((app) => [app.manifest.id, lazy(app.load)]));

export function findApp(id: string): { app: AppEntry; View: ComponentType } | undefined {
  const app = apps.find((a) => a.manifest.id === id);
  const View = views.get(id);
  return app && View ? { app, View } : undefined;
}
