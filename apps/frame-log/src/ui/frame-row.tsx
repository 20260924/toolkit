import { EditableCell, TextButton, cn, rowClass } from "@toolkit/ui";
import { useEffect, useRef } from "react";

import type { Frame } from "./session.ts";
import { formatTime, stem } from "./times.ts";

// no · thumbnail · time · note · delete
export const FRAME_COLUMNS = "max-content max-content max-content minmax(0,1fr) auto";

export function FrameRow({
  frame,
  note,
  active,
  editing,
  onSelect,
  onOpen,
  onEditNote,
  onDoneNote,
  onSaveNote,
  onDelete,
}: {
  frame: Frame;
  note: string;
  active: boolean;
  editing: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onEditNote: () => void;
  onDoneNote: () => void;
  onSaveNote: (note: string) => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);

  // Keep the cursor line in view as it moves by keyboard or after a delete.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const dim = active ? "" : "text-muted";
  return (
    <li
      ref={ref}
      onClick={onSelect}
      className={cn(
        rowClass(active),
        "group scroll-my-12 items-center gap-x-4 py-1",
        !active && "hover:bg-surface",
      )}
    >
      <span className={dim}>{stem(frame.name)}</span>
      <button type="button" title="원본 보기" onClick={onOpen} className="cursor-zoom-in">
        <img
          src={frame.url}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="aspect-video w-48 rounded-sm border border-line bg-canvas object-cover object-top hover:border-primary"
        />
      </button>
      <span className={dim}>{frame.time === null ? "--:--" : formatTime(frame.time)}</span>
      <EditableCell
        value={note}
        placeholder="설명"
        active={active}
        editing={editing}
        onEdit={onEditNote}
        onDone={onDoneNote}
        onSave={onSaveNote}
      />
      <TextButton
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className={cn("hover:text-danger", dim)}
      >
        삭제
      </TextButton>
    </li>
  );
}
