import type { MiddlewareHandler } from "hono";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** The Host header must name this machine; otherwise a public domain rebound to 127.0.0.1 could reach us. */
export function isLocalHost(host: string | undefined): boolean {
  if (!host) return false;
  const hostname = hostnameOf(`http://${host}`);
  return hostname !== null && LOCAL_HOSTNAMES.has(hostname);
}

/** Browsers send Origin on cross-site requests; a page on any other site must not drive the local API. */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (origin === undefined) return true; // Same-origin GETs and non-browser clients (curl) omit it.
  const hostname = hostnameOf(origin);
  return hostname !== null && LOCAL_HOSTNAMES.has(hostname);
}

export function localOnly(): MiddlewareHandler {
  return async (c, next) => {
    // Node always sends Host for HTTP/1.1; the URL (built from it) covers in-process requests in tests.
    const host = c.req.header("host") ?? new URL(c.req.url).host;
    if (!isLocalHost(host)) return c.text("Forbidden host", 403);
    if (!isAllowedOrigin(c.req.header("origin"))) return c.text("Forbidden origin", 403);
    await next();
  };
}
