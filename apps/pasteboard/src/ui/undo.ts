import { toast } from "@toolkit/ui";

// Offers to take back an action for as long as its toast is up, by button or ctrl+z.
export function undoable(message: string, undo: () => Promise<void>) {
  toast(message, {
    action: {
      label: "되돌리기",
      shortcut: "mod+z",
      onClick: () => void undo().then(() => toast("되돌렸습니다")),
    },
  });
}
