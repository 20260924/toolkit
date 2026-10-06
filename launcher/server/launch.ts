// Starts the built toolkit in the background (no window), then opens it in the browser.
// Opens the running one instead when it is already up. Stop it with `pnpm stop`.
import { spawn } from "node:child_process";
import { openSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { appDataDir } from "@toolkit/utils/node";

import { BASE_URL, isToolkitRunning } from "./instance.ts";
import { openBrowser } from "./open-browser.ts";

const START_TIMEOUT_MS = 15_000;

if (await isToolkitRunning()) {
  console.log(`toolkit is already running on ${BASE_URL}.`);
} else {
  // Only the latest run is kept; the background server has no other place to report errors.
  const logFile = join(appDataDir("launcher"), "server.log");
  const log = openSync(logFile, "w");
  const child = spawn(process.execPath, ["server/index.ts", "--static"], {
    cwd: join(import.meta.dirname, ".."),
    detached: true,
    stdio: ["ignore", log, log],
    windowsHide: true,
  });
  child.unref();

  let exited = false;
  child.once("exit", () => (exited = true));

  const deadline = Date.now() + START_TIMEOUT_MS;
  while (!(await isToolkitRunning())) {
    if (exited || Date.now() > deadline) {
      console.error(`toolkit did not start. Log (${logFile}):\n`);
      console.error(readFileSync(logFile, "utf8").trim().split("\n").slice(-20).join("\n"));
      process.exit(1);
    }
    await sleep(200);
  }
  console.log(`toolkit started in the background on ${BASE_URL}. Logs: ${logFile}`);
}

openBrowser(BASE_URL);
