import { useRef, useState } from "react";

import { cn } from "./cn.ts";

function CellInput({
  value,
  placeholder,
  onSave,
  onDone,
}: {
  value: string;
  placeholder: string;
  onSave: (value: string) => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState(value);
  // Enter, Esc, and the blur that follows them all land here; only the first counts.
  const finished = useRef(false);

  function finish(commit: boolean) {
    if (finished.current) return;
    finished.current = true;
    if (commit && draft.trim() !== value) onSave(draft.trim());
    onDone();
  }

  return (
    <input
      autoFocus
      value={draft}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => finish(true)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Enter") finish(true);
        if (event.key === "Escape") finish(false);
      }}
      className="-mx-1.5 w-[calc(100%+0.75rem)] min-w-0 rounded-sm border border-primary bg-canvas px-1.5 py-0.5 text-ink outline-none placeholder:text-faint"
    />
  );
}

// Padding sits in a negative margin so the text lines up with its column (and header).
// One line of text in a list row that turns into an input on click (or when the page sets
// editing, e.g. from a key). Enter or leaving saves, Esc cancels. When empty, the prompt
// shows only on the active or hovered row; the row needs the `group` class for the latter.
export function EditableCell({
  value,
  placeholder,
  active,
  editing,
  onEdit,
  onDone,
  onSave,
}: {
  value: string;
  placeholder: string;
  active: boolean;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onSave: (value: string) => void;
}) {
  if (editing) {
    return <CellInput value={value} placeholder={placeholder} onSave={onSave} onDone={onDone} />;
  }
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onEdit();
      }}
      className="-mx-1.5 w-[calc(100%+0.75rem)] min-w-0 truncate rounded-sm px-1.5 py-0.5 text-left hover:outline hover:outline-line"
    >
      {value || (
        <span className={cn("text-faint", !active && "opacity-0 group-hover:opacity-100")}>
          + {placeholder}
        </span>
      )}
    </button>
  );
}
