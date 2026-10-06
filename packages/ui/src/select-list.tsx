import { Link } from "@toolkit/shell";
import type { ReactNode } from "react";

import { cn } from "./cn.ts";
import { useHotkeys } from "./hotkeys.ts";

// ↑↓ moves the selection, Enter opens it.
export function useListKeys({
  count,
  selected,
  onSelect,
  onOpen,
  enabled = true,
}: {
  count: number;
  selected: number;
  onSelect: (index: number) => void;
  onOpen?: ((index: number) => void) | undefined;
  enabled?: boolean;
}) {
  useHotkeys(
    {
      ArrowDown: count > 0 && (() => onSelect(Math.min(selected + 1, count - 1))),
      ArrowUp: count > 0 && (() => onSelect(Math.max(selected - 1, 0))),
      Home: count > 0 && (() => onSelect(0)),
      End: count > 0 && (() => onSelect(count - 1)),
      Enter: onOpen && selected >= 0 && selected < count && (() => onOpen(selected)),
    },
    enabled,
  );
}

// The selected row is drawn inverted, like a terminal cursor line.
export const rowClass = (active: boolean) =>
  cn("col-span-full grid grid-cols-subgrid gap-x-6 px-2 py-0.5", active && "bg-ink text-canvas");

// A keyboard-driven list whose rows line up in columns. The first cells form the link that
// opens the row; trailing cells (notes, dates, actions) sit outside it in fixed columns on
// the right. -mx-2 cancels the row padding so the first column lines up with the text around it.
export function SelectList<T>({
  items,
  columns,
  getKey,
  getHref,
  selected,
  onSelect,
  onOpen,
  renderRow,
  trailing,
  headers,
  keys = true,
  className,
}: {
  items: readonly T[];
  // One grid track per cell renderRow returns.
  columns: string[];
  getKey: (item: T) => string;
  getHref: (item: T) => string;
  selected: number;
  onSelect: (index: number) => void;
  onOpen: (item: T) => void;
  renderRow: (item: T, active: boolean) => ReactNode;
  trailing?: { columns: string[]; render: (item: T, active: boolean) => ReactNode };
  // One label per track, row cells first, then trailing ones.
  headers?: HeaderCell[];
  keys?: boolean;
  className?: string;
}) {
  useListKeys({
    count: items.length,
    selected,
    onSelect,
    onOpen: (index) => {
      const item = items[index];
      if (item !== undefined) onOpen(item);
    },
    enabled: keys,
  });

  const tracks = [...columns, ...(trailing?.columns ?? [])];
  return (
    <ul className={cn("-mx-2 grid", className)} style={{ gridTemplateColumns: tracks.join(" ") }}>
      {headers && (
        <HeaderRow cells={headers} split={columns.length} trailing={trailing !== undefined} />
      )}
      {items.map((item, index) => {
        const active = index === selected;
        return (
          <li
            key={getKey(item)}
            onMouseEnter={() => onSelect(index)}
            className={cn(rowClass(active), "group gap-x-0 p-0")}
          >
            <Link
              to={getHref(item)}
              onFocus={() => onSelect(index)}
              style={{ gridColumn: `span ${columns.length}` }}
              className="grid grid-cols-subgrid gap-x-6 px-2 py-0.5 outline-none"
            >
              {renderRow(item, active)}
            </Link>
            {trailing && (
              <span
                style={{ gridColumn: `span ${trailing.columns.length}` }}
                className="grid grid-cols-subgrid items-center gap-x-6 py-0.5 pr-2 pl-6"
              >
                {trailing.render(item, active)}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type HeaderCell = string | { label: string; align: "right" };

function Cell({ cell }: { cell: HeaderCell }) {
  return typeof cell === "string" ? (
    <span>{cell}</span>
  ) : (
    <span className={cell.align === "right" ? "text-right" : ""}>{cell.label}</span>
  );
}

// Column labels above a list. Mirrors a row's structure so each label sits over its column.
export function HeaderRow({
  cells,
  split = cells.length,
  trailing = false,
  className,
  gap = "gap-x-6",
}: {
  cells: HeaderCell[];
  // How many cells belong to the row part; the rest go to the trailing part.
  split?: number;
  trailing?: boolean;
  className?: string;
  // The column gap of the rows below, when they use another one.
  gap?: string;
}) {
  const main = cells.slice(0, split);
  const rest = cells.slice(split);
  return (
    <li
      aria-hidden
      className={cn(
        "col-span-full mb-1 grid grid-cols-subgrid border-b border-line text-faint select-none",
        className,
      )}
    >
      <span
        style={{ gridColumn: `span ${main.length}` }}
        className={cn("grid grid-cols-subgrid px-2 py-0.5", gap)}
      >
        {main.map((cell, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- cells are positional
          <Cell key={index} cell={cell} />
        ))}
      </span>
      {trailing && (
        <span
          style={{ gridColumn: `span ${rest.length}` }}
          className={cn("grid grid-cols-subgrid py-0.5 pr-2 pl-6", gap)}
        >
          {rest.map((cell, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- cells are positional
            <Cell key={index} cell={cell} />
          ))}
        </span>
      )}
    </li>
  );
}
