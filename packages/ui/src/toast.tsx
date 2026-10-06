import { Toast } from "@base-ui/react/toast";
import { useSyncExternalStore } from "react";

import { formatCombo, useHotkeys } from "./hotkeys.ts";

const manager = Toast.createToastManager();

export type ToastOptions = {
  // shortcut (e.g. "mod+z") presses the action while the toast is on screen.
  action?: { label: string; onClick: () => void; shortcut?: string };
  timeout?: number;
};

// Actions reachable by shortcut, newest last; each leaves with its toast.
type Shortcut = { id: string; combo: string; press: () => void };
let shortcuts: Shortcut[] = [];
const listeners = new Set<() => void>();

function setShortcuts(next: Shortcut[]) {
  shortcuts = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A short notice at the bottom of the screen, optionally with one action (e.g. 되돌리기).
export function toast(message: string, { action, timeout }: ToastOptions = {}): string {
  const id = crypto.randomUUID();
  let pressed = false;
  const press = () => {
    if (pressed) return;
    pressed = true;
    manager.close(id);
    action?.onClick();
  };
  manager.add({
    id,
    description: message,
    timeout: timeout ?? (action ? 6000 : 3000),
    onClose: () => setShortcuts(shortcuts.filter((shortcut) => shortcut.id !== id)),
    ...(action && {
      actionProps: {
        children: action.shortcut ? (
          <>
            {action.label}{" "}
            <span className="font-normal text-faint">{formatCombo(action.shortcut)}</span>
          </>
        ) : (
          action.label
        ),
        onClick: press,
      },
    }),
  });
  if (action?.shortcut) setShortcuts([...shortcuts, { id, combo: action.shortcut, press }]);
  return id;
}

toast.close = (id?: string) => manager.close(id);

// The newest toast wins when several share a shortcut.
function useToastShortcuts() {
  const current = useSyncExternalStore(subscribe, () => shortcuts);
  const combos = new Set(current.map((shortcut) => shortcut.combo));
  useHotkeys(
    Object.fromEntries(
      [...combos].map((combo) => [
        combo,
        () => current.findLast((shortcut) => shortcut.combo === combo)?.press(),
      ]),
    ),
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((item) => (
    <Toast.Root
      key={item.id}
      toast={item}
      className="flex items-center gap-4 rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm shadow-lg transition-[opacity,translate] duration-150 data-ending-style:opacity-0 data-limited:hidden data-starting-style:translate-y-2 data-starting-style:opacity-0"
    >
      <Toast.Description className="min-w-0 flex-1" />
      <Toast.Action className="font-semibold text-primary underline-offset-2 hover:underline" />
      <Toast.Close aria-label="닫기" className="text-faint hover:text-ink">
        ×
      </Toast.Close>
    </Toast.Root>
  ));
}

// Mounted once by the launcher.
export function ToastHost() {
  useToastShortcuts();
  return (
    <Toast.Provider toastManager={manager} limit={3}>
      <Toast.Portal>
        <Toast.Viewport className="fixed right-6 bottom-6 z-60 flex w-80 max-w-[calc(100vw-3rem)] flex-col gap-2">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
