import { useSyncExternalStore, type ComponentProps, type MouseEvent } from "react";

export type Route = { page: "home" } | { page: "app"; id: string };

const APP_PATH = /^\/a\/([a-z0-9-]+)\/?$/;

function parse(pathname: string): Route {
  const id = APP_PATH.exec(pathname)?.[1];
  return id ? { page: "app", id } : { page: "home" };
}

export const appPath = (id: string) => `/a/${id}`;

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

export function useRoute(): Route {
  return parse(useSyncExternalStore(subscribe, () => location.pathname));
}

export function navigate(path: string) {
  if (location.pathname === path) return;
  history.pushState(null, "", path);
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
