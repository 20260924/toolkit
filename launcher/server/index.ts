import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import { API_PORT, HOST } from "./config.ts";
import { localOnly } from "./guard.ts";
import { openBrowser } from "./open-browser.ts";
import { appServers } from "./registry.ts";

const serveBuild = process.argv.includes("--static");
const openOnStart = process.argv.includes("--open");

// Lets a second launch tell a running toolkit apart from some other program on the port.
const MARKER_HEADER = "x-toolkit";

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

if (serveBuild) {
  app.use("*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

const url = `http://${HOST}:${API_PORT}`;

const server = serve({ fetch: app.fetch, hostname: HOST, port: API_PORT }, () => {
  const what = serveBuild ? "toolkit" : "toolkit API";
  console.log(`${what} listening on ${url}`);
  if (openOnStart) openBrowser(url);
});

server.on("error", async (error: NodeJS.ErrnoException) => {
  if (error.code !== "EADDRINUSE") throw error;
  if (await isToolkitRunning()) {
    console.log(`toolkit is already running on ${url}.`);
    if (openOnStart) openBrowser(url);
    process.exit(0);
  }
  console.error(
    `Port ${API_PORT} is in use by another program. Set TOOLKIT_PORT to use a different port.`,
  );
  process.exit(1);
});

async function isToolkitRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${url}/api`);
    return res.headers.get(MARKER_HEADER) === "1";
  } catch {
    return false;
  }
}
