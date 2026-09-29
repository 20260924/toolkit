// Usage: pnpm new <app-id> [--no-server]
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { ROOT, APP_ID } from "./lib.ts";
import { syncApps } from "./sync-apps.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  allowNegative: true,
  options: { server: { type: "boolean", default: true } },
});

const id = positionals[0];
if (!id || !APP_ID.test(id)) {
  console.error("Usage: pnpm new <app-id> [--no-server]   (app-id in kebab-case, e.g. json-diff)");
  process.exit(1);
}

const dir = join(ROOT, "apps", id);
if (existsSync(dir)) {
  console.error(`apps/${id} already exists.`);
  process.exit(1);
}

const name = id
  .split("-")
  .map((word) => word[0]?.toUpperCase() + word.slice(1))
  .join(" ");

cpSync(join(ROOT, "templates", "app"), dir, { recursive: true });

for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const file = join(entry.parentPath, entry.name);
  const text = readFileSync(file, "utf8");
  writeFileSync(file, text.replaceAll("__APP_ID__", id).replaceAll("__APP_NAME__", name));
}

if (!values.server) {
  rmSync(join(dir, "src", "server"), { recursive: true });
  rmSync(join(dir, "tsconfig.server.json"));

  const pkgFile = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
  delete pkg.exports["./server"];
  delete pkg.dependencies.hono;
  delete pkg.devDependencies["@types/node"];
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);

  const tsconfigFile = join(dir, "tsconfig.json");
  const tsconfig = JSON.parse(readFileSync(tsconfigFile, "utf8"));
  tsconfig.references = [{ path: "./tsconfig.ui.json" }];
  writeFileSync(tsconfigFile, `${JSON.stringify(tsconfig, null, 2)}\n`);
}

await syncApps();

console.log(`
Created apps/${id}${values.server ? "" : " (no server)"}.
  UI:     apps/${id}/src/ui/index.tsx     → http://127.0.0.1:4601/a/${id}  (pnpm dev)
${values.server ? `  API:    apps/${id}/src/server/index.ts  → /api/${id}\n` : ""}  Edit the description in apps/${id}/src/manifest.ts.`);
