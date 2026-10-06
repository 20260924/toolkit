import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditableCell, TextButton, cn, rowClass } from "@toolkit/ui";
import { GripVertical } from "lucide-react";
import { useEffect, useRef } from "react";

import { BlobImage } from "./blob-image.tsx";
import { setMemo, type Node } from "./db.ts";
import { charCount, formatBytes } from "./format.ts";

// handle · no · preview · memo · kind · shape · size · actions
export const NODE_COLUMNS =
  "auto max-content minmax(0,1fr) minmax(8rem,18rem) max-content max-content max-content auto";

export function nodeSize(node: Node): number {
  return node.kind === "text" ? new TextEncoder().encode(node.text).length : node.blob.size;
}

export function nodeShape(node: Node): string {
  return node.kind === "image" ? `${node.width}×${node.height}` : `${charCount(node.text)}자`;
}

export function NodeRow({
  node,
  no,
  active,
  editing,
  onSelect,
  onOpen,
  onEditMemo,
  onDoneMemo,
  onDelete,
}: {
  node: Node;
  no: string;
  active: boolean;
  editing: boolean;
  onSelect: () => void;
  // Opens the original; only the preview cell does this, so a stray row click never covers the page.
  onOpen: () => void;
  onEditMemo: () => void;
  onDoneMemo: () => void;
  onDelete: () => void;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });
  const ref = useRef<HTMLLIElement>(null);

  // Keep the cursor line in view as it moves by keyboard or a new paste lands.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const dim = active ? "" : "text-muted";
  return (
    <li
      ref={(element) => {
        setNodeRef(element);
        ref.current = element;
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={onSelect}
      className={cn(
        rowClass(active),
        "group scroll-my-12 items-center gap-x-4 py-1",
        !active && "hover:bg-surface",
        isDragging && "relative z-10 bg-surface shadow-md",
      )}
    >
      <span
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="끌어서 순서 바꾸기"
        onClick={(event) => event.stopPropagation()}
        className={cn("cursor-grab touch-none py-1", !active && "text-faint")}
      >
        <GripVertical size={14} />
      </span>
      <span>{no}</span>
      <button
        type="button"
        title="원본 보기"
        onClick={onOpen}
        className="max-w-full min-w-0 cursor-zoom-in justify-self-start text-left"
      >
        {node.kind === "image" ? (
          <BlobImage
            blob={node.blob}
            className="h-12 w-20 rounded-sm border border-line bg-canvas object-cover object-top hover:border-primary"
          />
        ) : (
          <span className="block truncate underline-offset-2 hover:underline">
            {node.text.replace(/\s+/g, " ").trim()}
          </span>
        )}
      </button>
      <EditableCell
        value={node.memo}
        placeholder="메모"
        onSave={(memo) => void setMemo(node.id, memo)}
        active={active}
        editing={editing}
        onEdit={onEditMemo}
        onDone={onDoneMemo}
      />
      <span className={dim}>{node.kind === "image" ? "img" : "txt"}</span>
      <span className={cn("text-right", dim)}>{nodeShape(node)}</span>
      <span className={cn("text-right", dim)}>{formatBytes(nodeSize(node))}</span>
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
