import { API_PORT, HOST } from "./config.ts";

export const BASE_URL = `http://${HOST}:${API_PORT}`;

// Lets a launcher tell a running toolkit apart from some other program on the port.
export const MARKER_HEADER = "x-toolkit";

// Outside /api so it can never collide with an app id.
export const SHUTDOWN_PATH = "/_toolkit/shutdown";

export async function isToolkitRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api`);
    return res.headers.get(MARKER_HEADER) === "1";
  } catch {
    return false;
  }
}
