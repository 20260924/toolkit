import { Overlay } from "@toolkit/ui";

import { BlobImage } from "./blob-image.tsx";
import type { Node } from "./db.ts";
import { formatBytes } from "./format.ts";
import { nodeShape, nodeSize } from "./node-row.tsx";

// The original of one node over the whole page; ←→ steps through the list.
export function Viewer({
  nodes,
  names,
  index,
  onIndexChange,
  onClose,
}: {
  nodes: Node[];
  names: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const node = nodes[index];
  const name = names[index] ?? "";

  return (
    <Overlay
      open={node !== undefined}
      onClose={onClose}
      label={name}
      onPrev={index > 0 ? () => onIndexChange(index - 1) : undefined}
      onNext={index < nodes.length - 1 ? () => onIndexChange(index + 1) : undefined}
    >
      {node && (
        <div className="flex h-full flex-col">
          {node.kind === "image" ? (
            <BlobImage
              key={node.id}
              blob={node.blob}
              className="min-h-0 w-full flex-1 object-contain"
            />
          ) : (
            <pre className="min-h-0 flex-1 overflow-auto p-4 break-words whitespace-pre-wrap">
              {node.text}
            </pre>
          )}
          <p className="flex justify-between gap-4 border-t border-line px-4 py-3 text-muted">
            <span className="truncate">
              <span className="text-ink">{name}</span> · {nodeShape(node)} ·{" "}
              {formatBytes(nodeSize(node))}
            </span>
            <span>
              {index + 1} / {nodes.length}
            </span>
          </p>
        </div>
      )}
    </Overlay>
  );
}
