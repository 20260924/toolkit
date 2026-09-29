import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { isAllowedOrigin, isLocalHost, localOnly } from "./guard.ts";

describe("isLocalHost", () => {
  it.each(["localhost:4600", "127.0.0.1:4601", "[::1]:4600", "localhost"])("accepts %s", (host) => {
    expect(isLocalHost(host)).toBe(true);
  });

  it.each([undefined, "", "evil.example:4600", "127.0.0.1.evil.example", "192.168.0.10:4600"])(
    "rejects %s",
    (host) => {
      expect(isLocalHost(host)).toBe(false);
    },
  );
});

describe("isAllowedOrigin", () => {
  it("allows requests without Origin", () => {
    expect(isAllowedOrigin(undefined)).toBe(true);
  });

  it("allows local origins on any port", () => {
    expect(isAllowedOrigin("http://localhost:4601")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:4600")).toBe(true);
  });

  it("rejects other sites and opaque origins", () => {
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
    expect(isAllowedOrigin("null")).toBe(false);
  });
});

describe("localOnly", () => {
  const app = new Hono().use(localOnly()).post("/", (c) => c.text("ok"));

  it("passes local requests through", async () => {
    const res = await app.request("http://127.0.0.1:4600/", { method: "POST" });
    expect(res.status).toBe(200);
  });

  it("blocks a rebound host", async () => {
    const res = await app.request("http://evil.example/", { method: "POST" });
    expect(res.status).toBe(403);
  });

  it("checks the Host header over the URL", async () => {
    const res = await app.request("http://127.0.0.1:4600/", {
      method: "POST",
      headers: { host: "evil.example:4600" },
    });
    expect(res.status).toBe(403);
  });

  it("blocks a cross-site origin", async () => {
    const res = await app.request("http://127.0.0.1:4600/", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(res.status).toBe(403);
  });
});
