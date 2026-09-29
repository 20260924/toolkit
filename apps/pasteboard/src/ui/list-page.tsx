import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Modifier,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Link, navigate, useCrumbs } from "@toolkit/shell";
import {
  Button,
  HeaderRow,
  Hints,
  confirm,
  isInField,
  toast,
  useHotkeys,
  useListKeys,
} from "@toolkit/ui";
import { Download, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { appendNodes, getList, removeNodes, reorderNodes, restoreNodes, type Node } from "./db.ts";
import { downloadZip } from "./export.ts";
import { fileNames, formatBytes, numbers } from "./format.ts";
import { NODE_COLUMNS, NodeRow, nodeSize } from "./node-row.tsx";
import { buildNodes, draftsFromClipboard, draftsFromTransfer, type Draft } from "./paste.ts";
import { indexPath } from "./paths.ts";
import { Viewer } from "./viewer.tsx";
import { undoable } from "./undo.ts";
import { useLive } from "./use-live.ts";

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export function ListPage({ id }: { id: string }) {
  const [data, setData] = useLive(`list:${id}`, () => getList(id));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The viewer shows the selected node, so stepping through it moves the selection too.
  const [viewing, setViewing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useCrumbs(data ? [{ label: data.list.name }] : []);

  const nodes = data?.nodes ?? [];
  const selected = nodes.findIndex((node) => node.id === selectedId);
  const nos = numbers(nodes.length);
  const names = fileNames(nodes);

  async function add(drafts: Draft[]) {
    if (!data || drafts.length === 0) return;
    const { added, skipped } = await buildNodes(id, drafts, data.nodes.at(-1));
    if (skipped.length > 0) {
      toast(
        skipped.length === 1
          ? "마지막 항목과 같은 내용이라 건너뛰었습니다"
          : `마지막 항목과 같은 내용 ${skipped.length}개를 건너뛰었습니다`,
        { action: { label: "그래도 추가", onClick: () => void append(skipped) } },
      );
    }
    await append(added);
  }

  async function append(added: Node[]) {
    const last = added.at(-1);
    if (!last) return;
    await appendNodes(id, added);
    setSelectedId(last.id);
  }

  async function pasteFromClipboard() {
    try {
      await add(await draftsFromClipboard());
    } catch {
      toast("클립보드를 읽지 못했습니다. ctrl+v 로 붙여넣어 보세요");
    }
  }

  // Paste and file drops anywhere on the page, except into a field such as the memo.
  const addRef = useRef(add);
  useEffect(() => {
    addRef.current = add;
  });
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (!event.clipboardData || isInField(event.target)) return;
      event.preventDefault();
      void addRef.current(draftsFromTransfer(event.clipboardData));
    }
    function onDragOver(event: DragEvent) {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    }
    function onDrop(event: DragEvent) {
      if (!event.dataTransfer?.files.length) return;
      event.preventDefault();
      void addRef.current(draftsFromTransfer(event.dataTransfer));
    }
    addEventListener("paste", onPaste);
    addEventListener("dragover", onDragOver);
    addEventListener("drop", onDrop);
    return () => {
      removeEventListener("paste", onPaste);
      removeEventListener("dragover", onDragOver);
      removeEventListener("drop", onDrop);
    };
  }, []);

  function move(from: number, to: number) {
    if (!data || to < 0 || to >= nodes.length || from === to) return;
    const moved = arrayMove(nodes, from, to);
    const nodeIds = moved.map((node) => node.id);
    setData({ list: { ...data.list, nodeIds }, nodes: moved });
    void reorderNodes(id, nodeIds);
  }

  async function removeAt(index: number) {
    const node = nodes[index];
    if (!node) return;
    const next = nodes[index + 1] ?? nodes[index - 1];
    const removed = await removeNodes(id, [node.id]);
    setSelectedId(next?.id ?? null);
    undoable(`${nos[index]} 항목을 삭제했습니다`, () => restoreNodes(removed));
  }

  async function clear() {
    if (!data || nodes.length === 0) return;
    const ok = await confirm({
      title: "모든 항목을 삭제할까요?",
      description: `'${data.list.name}'의 항목 ${nodes.length}개가 삭제됩니다.`,
      confirmLabel: "모두 삭제",
      danger: true,
    });
    if (!ok) return;
    const removed = await removeNodes(
      id,
      nodes.map((node) => node.id),
    );
    setSelectedId(null);
    undoable(`항목 ${removed.entries.length}개를 삭제했습니다`, () => restoreNodes(removed));
  }

  function download() {
    if (data && nodes.length > 0) void downloadZip(data);
  }

  useListKeys({
    count: nodes.length,
    selected,
    onSelect: (index) => setSelectedId(nodes[index]?.id ?? null),
    onOpen: () => setViewing(true),
  });
  useHotkeys({
    "alt+ArrowUp": selected >= 0 && (() => move(selected, selected - 1)),
    "alt+ArrowDown": selected >= 0 && (() => move(selected, selected + 1)),
    Delete: selected >= 0 && (() => void removeAt(selected)),
    m: selected >= 0 && (() => setEditingId(nodes[selected]?.id ?? null)),
    "mod+s": download,
    Escape: () => navigate(indexPath()),
  });

  if (data === undefined) return null;
  if (data === null) return <NotFound />;

  const total = nodes.reduce((sum, node) => sum + nodeSize(node), 0);
  return (
    <div className="font-mono text-sm">
      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="text-muted">
            항목 {nodes.length}개 · {formatBytes(total)}
          </span>
          <span className="flex gap-2">
            <Button
              disabled={nodes.length === 0}
              onClick={() => void clear()}
              className="hover:border-danger hover:text-danger"
            >
              <Trash2 size={14} />
              모두 삭제
            </Button>
            <Button variant="primary" disabled={nodes.length === 0} onClick={download}>
              <Download size={14} />
              zip 다운로드
            </Button>
          </span>
        </div>

        {nodes.length === 0 ? (
          <button
            type="button"
            onClick={() => void pasteFromClipboard()}
            className="w-full rounded-md border border-dashed border-line px-4 py-10 text-muted hover:border-primary"
          >
            ctrl+v 로 텍스트나 이미지를 붙여넣으세요 (파일을 끌어 놓아도 됩니다)
          </button>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[verticalOnly]}
            onDragEnd={({ active, over }) => {
              if (!over) return;
              const ids = nodes.map((node) => node.id);
              move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
            }}
          >
            <SortableContext
              items={nodes.map((node) => node.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="-mx-2 grid" style={{ gridTemplateColumns: NODE_COLUMNS }}>
                <HeaderRow
                  gap="gap-x-4"
                  cells={[
                    "",
                    "no",
                    "내용",
                    "메모",
                    "형식",
                    { label: "크기", align: "right" },
                    { label: "용량", align: "right" },
                    "",
                  ]}
                />
                {nodes.map((node, index) => (
                  <NodeRow
                    key={node.id}
                    node={node}
                    no={nos[index] ?? ""}
                    active={index === selected}
                    editing={editingId === node.id}
                    onEditMemo={() => {
                      setSelectedId(node.id);
                      setEditingId(node.id);
                    }}
                    onDoneMemo={() => setEditingId(null)}
                    onSelect={() => setSelectedId(node.id)}
                    onOpen={() => {
                      setSelectedId(node.id);
                      setViewing(true);
                    }}
                    onDelete={() => void removeAt(index)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        <Hints
          className="mt-6"
          items={[
            { keys: "ctrl+v", label: "붙여넣기", onClick: () => void pasteFromClipboard() },
            { keys: "↑↓", label: "선택" },
            { keys: "enter", label: "원본 보기" },
            { keys: "m", label: "메모" },
            { keys: "alt+↑↓", label: "이동" },
            { keys: "del", label: "삭제" },
            { keys: "ctrl+s", label: "zip", onClick: download },
            { keys: "esc", label: "목록" },
          ]}
        />
      </section>

      <Viewer
        nodes={nodes}
        names={names}
        index={viewing ? selected : -1}
        onIndexChange={(index) => setSelectedId(nodes[index]?.id ?? null)}
        onClose={() => setViewing(false)}
      />
    </div>
  );
}

function NotFound() {
  return (
    <p className="font-mono text-sm text-muted">
      리스트를 찾을 수 없습니다.{" "}
      <Link to={indexPath()} className="text-ink underline underline-offset-2">
        목록으로
      </Link>
    </p>
  );
}
