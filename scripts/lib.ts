import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));

export const APP_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export function run(command: string): void {
  // A shell resolves pnpm's .cmd shim on Windows.
  const result = spawnSync(command, { cwd: ROOT, stdio: "inherit", shell: true });
  if (result.status !== 0) throw new Error(`Command failed: ${command}`);
}
