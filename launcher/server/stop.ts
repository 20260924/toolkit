// Stops a toolkit started by `pnpm launch` (or any running one on the configured port).
import { BASE_URL, SHUTDOWN_PATH, isToolkitRunning } from "./instance.ts";

if (!(await isToolkitRunning())) {
  console.log("toolkit is not running.");
} else {
  await fetch(`${BASE_URL}${SHUTDOWN_PATH}`, { method: "POST" });
  console.log("toolkit stopped.");
}
