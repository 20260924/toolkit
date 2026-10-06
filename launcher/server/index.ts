import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import { API_PORT, HOST } from "./config.ts";
import { localOnly } from "./guard.ts";
import { BASE_URL, MARKER_HEADER, SHUTDOWN_PATH, isToolkitRunning } from "./instance.ts";
import { openBrowser } from "./open-browser.ts";
import { appServers } from "./registry.ts";

const serveBuild = process.argv.includes("--static");
const openOnStart = process.argv.includes("--open");

// Non-strict: /api/<id>/ and /api/<id> reach the same app route.
const api = new Hono({ strict: false });
for (const { id, app } of appServers) api.route(`/${id}`, app);
api.all("*", (c) => c.json({ error: "Not found" }, 404));

const app = new Hono({ strict: false });
app.use(localOnly());
app.use(async (c, next) => {
  await next();
  c.header(MARKER_HEADER, "1");
});
app.route("/api", api);

// Used by `pnpm stop`; a server started in the background has no window to close.
app.post(SHUTDOWN_PATH, (c) => {
  console.log("Shutting down.");
  setTimeout(() => process.exit(0), 100);
  return c.body(null, 204);
});

if (serveBuild) {
  app.use("*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

const server = serve({ fetch: app.fetch, hostname: HOST, port: API_PORT }, () => {
  const what = serveBuild ? "toolkit" : "toolkit API";
  console.log(`${what} listening on ${BASE_URL}`);
  if (openOnStart) openBrowser(BASE_URL);
});

server.on("error", async (error: NodeJS.ErrnoException) => {
  if (error.code !== "EADDRINUSE") throw error;
  if (await isToolkitRunning()) {
    console.log(`toolkit is already running on ${BASE_URL}.`);
    if (openOnStart) openBrowser(BASE_URL);
    process.exit(0);
  }
  console.error(
    `Port ${API_PORT} is in use by another program. Set TOOLKIT_PORT to use a different port.`,
  );
  process.exit(1);
});
