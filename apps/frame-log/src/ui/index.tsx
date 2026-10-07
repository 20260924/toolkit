import { Button, HeaderRow, Hints, toast, useHotkeys, useListKeys } from "@toolkit/ui";
import { FileText, FolderOpen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getStates, putState, type FrameState } from "./db.ts";
import { FRAME_COLUMNS, FrameRow } from "./frame-row.tsx";
import { framesOf, loadFolder, loadTimes, useSession } from "./session.ts";
import { stem } from "./times.ts";
import { undoable } from "./undo.ts";
import { Viewer } from "./viewer.tsx";

const blank = (name: string): FrameState => ({ name, note: "", removed: false });

export default function App() {
  const session = useSession();
  const frames = useMemo(() => framesOf(session), [session]);
  const [states, setStates] = useState<Map<string, FrameState>>();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const timesInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ask the browser not to evict the notes under storage pressure.
    void navigator.storage?.persist?.();
    void getStates().then(setStates);
  }, []);

  // React has no prop for picking a folder.
  useEffect(() => {
    if (folderInput.current) folderInput.current.webkitdirectory = true;
  }, []);

  const stateOf = (name: string) => states?.get(name) ?? blank(name);
  const visible = frames.filter((frame) => !stateOf(frame.name).removed);
  const notes = visible.map((frame) => stateOf(frame.name).note);
  const selected = visible.findIndex((frame) => frame.name === selectedName);
  const removedCount = frames.length - visible.length;
  const untimed = frames.filter((frame) => frame.time === null).length;

  async function save(state: FrameState) {
    setStates((current) => new Map(current).set(state.name, state));
    await putState(state);
  }

  async function removeAt(index: number) {
    const frame = visible[index];
    if (!frame) return;
    const next = visible[index + 1] ?? visible[index - 1];
    const state = stateOf(frame.name);
    await save({ ...state, removed: true });
    setSelectedName(next?.name ?? null);
    undoable(`${stem(frame.name)} 프레임을 삭제했습니다`, async () => {
      await save({ ...state, removed: false });
      setSelectedName(frame.name);
    });
  }

  useListKeys({
    count: visible.length,
    selected,
    onSelect: (index) => setSelectedName(visible[index]?.name ?? null),
    onOpen: () => setViewing(true),
    enabled: !viewing,
  });
  useHotkeys({
    Delete: selected >= 0 && (() => void removeAt(selected)),
    m: selected >= 0 && (() => setEditingName(visible[selected]?.name ?? null)),
  });

  return (
    <div className="font-mono text-sm">
      <input
        ref={folderInput}
        type="file"
        hidden
        onChange={(event) => {
          const { files } = event.currentTarget;
          if (files?.length) {
            const count = loadFolder(files);
            if (count === 0) toast("폴더에 이미지가 없습니다");
          }
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={timesInput}
        type="file"
        accept=".txt,text/plain"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file)
            void loadTimes(file).then((count) => {
              if (count === 0) toast("times.txt에서 frame/pts_time 줄을 찾지 못했습니다");
            });
          event.currentTarget.value = "";
        }}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <span className="flex flex-wrap items-center gap-2">
          <Button onClick={() => folderInput.current?.click()}>
            <FolderOpen size={14} />
            {session.folder || "프레임 폴더"}
          </Button>
          <Button onClick={() => timesInput.current?.click()}>
            <FileText size={14} />
            {session.timesName || "times.txt"}
          </Button>
          {frames.length > 0 && (
            <span className="text-muted">
              {visible.length} / {frames.length}개{removedCount > 0 && ` · 삭제 ${removedCount}개`}
              {notes.filter(Boolean).length > 0 && ` · 설명 ${notes.filter(Boolean).length}개`}
              {session.timesName && untimed > 0 && (
                <span className="text-danger"> · 시각 없음 {untimed}개</span>
              )}
            </span>
          )}
        </span>
      </div>

      {frames.length === 0 ? (
        <button
          type="button"
          onClick={() => folderInput.current?.click()}
          className="w-full rounded-md border border-dashed border-line px-4 py-10 text-muted hover:border-primary"
        >
          프레임 폴더(0001.png …)와 times.txt를 불러오세요. 같은 폴더를 다시 불러오면 이전 작업이
          이어집니다.
        </button>
      ) : (
        states && (
          <ul className="-mx-2 grid" style={{ gridTemplateColumns: FRAME_COLUMNS }}>
            <HeaderRow gap="gap-x-4" cells={["no", "프레임", "시각", "설명", ""]} />
            {visible.map((frame, index) => (
              <FrameRow
                key={frame.name}
                frame={frame}
                note={notes[index] ?? ""}
                active={index === selected}
                editing={editingName === frame.name}
                onSelect={() => setSelectedName(frame.name)}
                onOpen={() => {
                  setSelectedName(frame.name);
                  setViewing(true);
                }}
                onEditNote={() => {
                  setSelectedName(frame.name);
                  setEditingName(frame.name);
                }}
                onDoneNote={() => setEditingName(null)}
                onSaveNote={(note) => void save({ ...stateOf(frame.name), note })}
                onDelete={() => void removeAt(index)}
              />
            ))}
          </ul>
        )
      )}

      <Hints
        className="mt-6"
        items={[
          { keys: "↑↓", label: "선택" },
          { keys: "enter", label: "원본 보기" },
          { keys: "m", label: "설명" },
          { keys: "del", label: "삭제" },
          { keys: "ctrl+z", label: "되돌리기" },
        ]}
      />

      <Viewer
        frames={visible}
        notes={notes}
        index={viewing ? selected : -1}
        onIndexChange={(index) => setSelectedName(visible[index]?.name ?? null)}
        onClose={() => setViewing(false)}
      />
    </div>
  );
}
