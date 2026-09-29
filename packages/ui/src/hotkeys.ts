import { useEffect, useRef } from "react";

// "n", "Enter", "ArrowUp", "Delete", "mod+z" (Ctrl or ⌘), "alt+ArrowDown"
export type Hotkeys = Record<string, ((event: KeyboardEvent) => void) | false | undefined>;

// Letters match the physical key, so they still work with the Korean input method on.
function matches(event: KeyboardEvent, combo: string) {
  const parts = combo.split("+");
  const key = parts.pop() ?? "";
  if (parts.includes("mod") !== (event.ctrlKey || event.metaKey)) return false;
  if (parts.includes("alt") !== event.altKey) return false;
  if (parts.includes("shift") !== event.shiftKey) return false;
  if (/^[a-z]$/i.test(key)) return event.code === `Key${key.toUpperCase()}`;
  return event.key === key;
}

// Keys typed into a field or an open dialog belong to them, not to the page.
export function isInField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest("input, textarea, select")) return true;
  return target.closest('[role="dialog"], [role="alertdialog"]') !== null;
}

export function useHotkeys(hotkeys: Hotkeys, enabled = true) {
  const latest = useRef(hotkeys);
  useEffect(() => {
    latest.current = hotkeys;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || isInField(event.target)) return;
      for (const [combo, handler] of Object.entries(latest.current)) {
        if (handler && matches(event, combo)) {
          event.preventDefault();
          handler(event);
          return;
        }
      }
    }
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

// "mod+z" → "ctrl+z" (or "⌘z" on a Mac), for showing a key next to what it does.
export function formatCombo(combo: string): string {
  const mac = /Mac|iPhone|iPad/.test(navigator.userAgent);
  return combo.replace("mod+", mac ? "⌘" : "ctrl+").replace("alt+", mac ? "⌥" : "alt+");
}
