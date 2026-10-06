import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "./cn.ts";

const controlClass =
  "absolute rounded-full bg-ink/60 p-2 text-canvas transition hover:bg-ink/80 disabled:pointer-events-none disabled:opacity-0";

// Shows one thing at full height over the page, lightbox style: the content fills a
// column in the middle and the controls sit on the dimmed page to either side.
export function Overlay({
  open,
  onClose,
  label,
  onPrev,
  onNext,
  children,
}: {
  open: boolean;
  onClose: () => void;
  // Announced as the dialog title; not shown.
  label: string;
  // Omit or pass undefined at either end to hide that arrow.
  onPrev?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/40 transition-opacity duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          // The popup covers the whole screen, so a click on its bare area is a click outside.
          onClick={(event) => event.target === event.currentTarget && onClose()}
          onKeyDown={(event) => {
            if (event.target instanceof HTMLElement && event.target.closest("input, textarea"))
              return;
            if (event.key === "ArrowLeft") onPrev?.();
            if (event.key === "ArrowRight") onNext?.();
          }}
          className="fixed inset-0 z-50 outline-none transition-opacity duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0"
        >
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          <div className="absolute inset-y-0 left-1/2 w-[calc(100%-2*max(4.5rem,10vw))] -translate-x-1/2 overflow-hidden bg-surface font-mono text-sm shadow-xl">
            {children}
          </div>
          <Dialog.Close aria-label="닫기" className={cn(controlClass, "top-4 right-4")}>
            <X size={22} />
          </Dialog.Close>
          <button
            type="button"
            aria-label="이전"
            disabled={!onPrev}
            onClick={onPrev}
            className={cn(controlClass, "top-1/2 left-4 -translate-y-1/2")}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="다음"
            disabled={!onNext}
            onClick={onNext}
            className={cn(controlClass, "top-1/2 right-4 -translate-y-1/2")}
          >
            <ChevronRight size={22} />
          </button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
