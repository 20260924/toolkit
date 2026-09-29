// Usage: pnpm drop <app-id>
// Deletes the directory and unregisters it in one step; a hand-deleted app blocks all pnpm scripts.
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

import { ROOT, APP_ID } from "./lib.ts";
import { syncApps } from "./sync-apps.ts";

const id = process.argv[2];
if (!id || !APP_ID.test(id)) {
  console.error("Usage: pnpm drop <app-id>");
  process.exit(1);
}

const dir = join(ROOT, "apps", id);
if (!existsSync(dir)) {
  console.error(`apps/${id} does not exist.`);
  process.exit(1);
}

rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
await syncApps();
console.log(`Removed apps/${id}.`);
