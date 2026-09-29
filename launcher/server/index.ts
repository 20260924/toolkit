import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import { API_PORT, HOST } from "./config.ts";
import { localOnly } from "./guard.ts";
import { appServers } from "./registry.ts";

const serveBuild = process.argv.includes("--static");

// Non-strict: /api/<id>/ and /api/<id> reach the same app route.
const api = new Hono({ strict: false });
for (const { id, app } of appServers) api.route(`/${id}`, app);
api.all("*", (c) => c.json({ error: "Not found" }, 404));

const app = new Hono({ strict: false });
app.use(localOnly());
app.route("/api", api);

if (serveBuild) {
  app.use("*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

serve({ fetch: app.fetch, hostname: HOST, port: API_PORT }, ({ port }) => {
  const what = serveBuild ? "toolkit" : "toolkit API";
  console.log(`${what} listening on http://${HOST}:${port}`);
});
