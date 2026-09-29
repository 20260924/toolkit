import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Per-app data directory, created on first use: ~/.toolkit/<appId> (root overridable with TOOLKIT_DATA_DIR). */
export function appDataDir(appId: string): string {
  const root = process.env.TOOLKIT_DATA_DIR ?? join(homedir(), ".toolkit");
  const dir = join(root, appId);
  mkdirSync(dir, { recursive: true });
  return dir;
}
