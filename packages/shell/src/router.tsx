import { useSyncExternalStore, type ComponentProps, type MouseEvent } from "react";

export type Route = { page: "home" } | { page: "app"; id: string; rest: string[] };

const APP_PATH = /^\/a\/([a-z0-9-]+)((?:\/[^/]+)*)\/?$/;

export function parsePath(pathname: string): Route {
  const match = APP_PATH.exec(pathname);
  if (!match?.[1]) return { page: "home" };
  const rest = (match[2] ?? "").split("/").filter(Boolean).map(decodeURIComponent);
  return { page: "app", id: match[1], rest };
}

export const appPath = (id: string, ...rest: string[]) =>
  ["/a", id, ...rest.map(encodeURIComponent)].join("/");

// pushState does not fire popstate, so navigate() announces changes itself.
const NAVIGATE_EVENT = "toolkit:navigate";

function subscribe(onChange: () => void) {
  addEventListener("popstate", onChange);
  addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    removeEventListener("popstate", onChange);
    removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

export function usePath(): Route {
  return parsePath(useSyncExternalStore(subscribe, () => location.pathname));
}

// The segments after /a/<id>, for apps with more than one screen.
export function useAppPath(): string[] {
  const route = usePath();
  return route.page === "app" ? route.rest : [];
}

export function navigate(path: string, { replace = false } = {}) {
  if (location.pathname === path) return;
  if (replace) history.replaceState(null, "", path);
  else history.pushState(null, "", path);
  dispatchEvent(new Event(NAVIGATE_EVENT));
}

// An <a> that switches pages in place; modified clicks (new tab, …) keep the browser default.
export function Link({ to, onClick, ...props }: ComponentProps<"a"> & { to: string }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (event.defaultPrevented || event.button !== 0 || modified) return;
    event.preventDefault();
    navigate(to);
  }
  return <a href={to} onClick={handleClick} {...props} />;
}
