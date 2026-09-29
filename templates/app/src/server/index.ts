import { Hono } from "hono";

// Mounted by the launcher at /api/__APP_ID__. Call it from the UI with createApi(manifest.id).
export default new Hono().get("/", (c) => c.json({ ok: true }));
