import type { AppManifest } from "@toolkit/utils";
import type { ComponentType } from "react";

export type AppEntry = {
  manifest: AppManifest;
  load: () => Promise<{ default: ComponentType }>;
};
