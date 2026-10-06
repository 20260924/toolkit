import { spawn } from "node:child_process";

/** Opens `url` in the default browser. Best effort: a failure is logged, never thrown. */
export function openBrowser(url: string): void {
  const [command, args] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]] // "" is start's window title; without it the URL is taken as one.
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  child.on("error", (error) => console.error(`Could not open a browser: ${error.message}`));
  child.unref();
}
