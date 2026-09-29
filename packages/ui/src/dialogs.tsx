import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog } from "@base-ui/react/dialog";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Button } from "./button.tsx";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
};

export type PromptOptions = {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
};

type Request =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (value: string | null) => void };

let request: Request | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function show(next: Request) {
  cancel();
  request = next;
  for (const listener of listeners) listener();
}

function close() {
  request = null;
  for (const listener of listeners) listener();
}

function cancel() {
  if (request?.kind === "confirm") request.resolve(false);
  if (request?.kind === "prompt") request.resolve(null);
  close();
}

// Asks before a destructive action; false on cancel, Esc, or outside click.
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => show({ kind: "confirm", options, resolve }));
}

// Asks for one line of text, e.g. a name; null on cancel.
export function prompt(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => show({ kind: "prompt", options, resolve }));
}

const backdropClass =
  "fixed inset-0 z-50 bg-ink/20 transition-opacity duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0";
const popupClass =
  "fixed top-1/3 left-1/2 z-50 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 flex-col gap-4 rounded-md border border-line bg-surface p-4 font-mono text-sm shadow-lg transition-[scale,opacity] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0";

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-2">{children}</div>;
}

function ConfirmDialog({ open, options }: { open: boolean; options: ConfirmOptions }) {
  // Enter confirms right away; the action that opened the dialog was already deliberate.
  const confirmRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && cancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={backdropClass} />
        <AlertDialog.Popup initialFocus={confirmRef} className={popupClass}>
          <div className="flex flex-col gap-1">
            <AlertDialog.Title className="font-semibold">{options.title}</AlertDialog.Title>
            {options.description && (
              <AlertDialog.Description className="text-muted">
                {options.description}
              </AlertDialog.Description>
            )}
          </div>
          <Actions>
            <AlertDialog.Close render={<Button />}>취소</AlertDialog.Close>
            <Button
              ref={confirmRef}
              variant={options.danger ? "danger" : "primary"}
              onClick={() => {
                if (request?.kind === "confirm") request.resolve(true);
                close();
              }}
            >
              {options.confirmLabel ?? "확인"}
            </Button>
          </Actions>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function PromptDialog({ open, options }: { open: boolean; options: PromptOptions }) {
  const [value, setValue] = useState(options.defaultValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = value.trim();
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && cancel()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={backdropClass} />
        <Dialog.Popup initialFocus={inputRef} className={popupClass}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!trimmed) return;
              if (request?.kind === "prompt") request.resolve(trimmed);
              close();
            }}
          >
            <Dialog.Title className="font-semibold">{options.title}</Dialog.Title>
            <input
              ref={inputRef}
              value={value}
              placeholder={options.placeholder}
              onChange={(event) => setValue(event.target.value)}
              onFocus={(event) => event.target.select()}
              className="rounded-md border border-line bg-canvas px-2 py-1.5 outline-none focus:border-primary"
            />
            <Actions>
              <Dialog.Close render={<Button />}>취소</Dialog.Close>
              <Button type="submit" variant="primary" disabled={!trimmed}>
                {options.confirmLabel ?? "확인"}
              </Button>
            </Actions>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Mounted once by the launcher; renders whichever dialog confirm() or prompt() opened.
export function DialogHost() {
  const current = useSyncExternalStore(subscribe, () => request);
  // Keep the last content on screen while the closing animation runs.
  const [shown, setShown] = useState<Request | null>(null);
  const [count, setCount] = useState(0);
  if (current && current !== shown) {
    setShown(current);
    setCount(count + 1);
  }

  return (
    <>
      {shown?.kind === "confirm" && (
        <ConfirmDialog open={current === shown} options={shown.options} />
      )}
      {shown?.kind === "prompt" && (
        // A fresh key per request resets the typed value.
        <PromptDialog key={count} open={current === shown} options={shown.options} />
      )}
    </>
  );
}
