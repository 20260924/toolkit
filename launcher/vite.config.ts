import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { API_PORT, HOST, WEB_DEV_PORT } from "./server/config.ts";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: HOST,
    port: WEB_DEV_PORT,
    strictPort: true,
    proxy: { "/api": `http://${HOST}:${API_PORT}` },
  },
  test: {
    include: ["server/**/*.test.ts", "src/**/*.test.{ts,tsx}"],
  },
});
