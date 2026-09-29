import { Fragment } from "react";

import { cn } from "./cn.ts";

export type Hint = { keys: string; label: string; onClick?: (() => void) | undefined };

// The key legend under a list: "↑↓ 선택 · enter 열기 · n 새 리스트". Hints with onClick
// double as buttons for mouse users.
export function Hints({ items, className }: { items: Hint[]; className?: string }) {
  return (
    <p className={cn("font-mono text-sm text-faint", className)}>
      {items.map((hint, index) => (
        <Fragment key={hint.keys}>
          {index > 0 && " · "}
          {hint.onClick ? (
            <button onClick={hint.onClick} className="hover:text-ink">
              {hint.keys} {hint.label}
            </button>
          ) : (
            `${hint.keys} ${hint.label}`
          )}
        </Fragment>
      ))}
    </p>
  );
}
