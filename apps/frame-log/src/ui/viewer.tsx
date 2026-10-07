import { Overlay } from "@toolkit/ui";

import type { Frame } from "./session.ts";
import { formatTime } from "./times.ts";

// One frame at full size over the page; ←→ steps through the list.
export function Viewer({
  frames,
  notes,
  index,
  onIndexChange,
  onClose,
}: {
  frames: Frame[];
  notes: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const frame = frames[index];

  return (
    <Overlay
      open={frame !== undefined}
      onClose={onClose}
      label={frame?.name ?? ""}
      onPrev={index > 0 ? () => onIndexChange(index - 1) : undefined}
      onNext={index < frames.length - 1 ? () => onIndexChange(index + 1) : undefined}
    >
      {frame && (
        <div className="flex h-full flex-col">
          <img src={frame.url} alt="" className="min-h-0 w-full flex-1 object-contain" />
          <p className="flex justify-between gap-4 border-t border-line px-4 py-3 text-muted">
            <span className="truncate">
              <span className="text-ink">{frame.name}</span>
              {frame.time !== null && ` · ${formatTime(frame.time)}`}
              {notes[index] && ` · ${notes[index]}`}
            </span>
            <span>
              {index + 1} / {frames.length}
            </span>
          </p>
        </div>
      )}
    </Overlay>
  );
}
