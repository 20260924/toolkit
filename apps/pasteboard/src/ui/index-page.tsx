import { navigate } from "@toolkit/shell";
import {
  EditableCell,
  Hints,
  SelectList,
  TextButton,
  cn,
  confirm,
  prompt,
  useHotkeys,
} from "@toolkit/ui";
import { useEffect, useState } from "react";

import {
  createList,
  deleteList,
  getLists,
  renameList,
  restoreList,
  setListMemo,
  type List,
} from "./db.ts";
import { formatDate } from "./format.ts";
import { listPath } from "./paths.ts";
import { undoable } from "./undo.ts";
import { useLive } from "./use-live.ts";

// Remembered while moving between the index and a list.
let lastSelected = 0;

async function create(count: number) {
  const name = await prompt({
    title: "새 리스트",
    defaultValue: `리스트 ${count + 1}`,
    confirmLabel: "만들기",
  });
  if (name === null) return;
  const list = await createList(name);
  navigate(listPath(list.id));
}

async function rename(list: List) {
  const name = await prompt({ title: "이름 변경", defaultValue: list.name, confirmLabel: "변경" });
  if (name !== null && name !== list.name) await renameList(list.id, name);
}

async function remove(list: List) {
  const count = list.nodeIds.length;
  if (count > 0) {
    const ok = await confirm({
      title: `'${list.name}' 리스트를 삭제할까요?`,
      description: `항목 ${count}개도 함께 삭제됩니다.`,
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
  }
  const snapshot = await deleteList(list.id);
  if (snapshot) undoable(`'${list.name}' 리스트를 삭제했습니다`, () => restoreList(snapshot));
}

export function IndexPage() {
  const [lists] = useLive("lists", getLists);
  const [selected, setSelected] = useState(lastSelected);
  const [editingId, setEditingId] = useState<string | null>(null);
  const count = lists?.length ?? 0;
  const index = Math.max(0, Math.min(selected, count - 1));
  const current = lists?.[index];

  useEffect(() => {
    if (count > 0) lastSelected = index;
  }, [index, count]);

  useHotkeys({
    n: () => void create(count),
    r: current && (() => void rename(current)),
    m: current && (() => setEditingId(current.id)),
    Delete: current && (() => void remove(current)),
    d: current && (() => void remove(current)),
  });

  if (!lists) return null;

  return (
    <div className="font-mono text-sm">
      {lists.length === 0 ? (
        <p className="text-muted">리스트가 없습니다. n 으로 새 리스트를 만드세요.</p>
      ) : (
        <SelectList
          items={lists}
          // name | memo · count · updated · rename · delete
          columns={["minmax(0,1fr)"]}
          getKey={(list) => list.id}
          getHref={(list) => listPath(list.id)}
          selected={index}
          onSelect={setSelected}
          onOpen={(list) => navigate(listPath(list.id))}
          headers={["이름", "메모", { label: "항목", align: "right" }, "수정", "", ""]}
          renderRow={(list) => <span className="truncate">{list.name}</span>}
          trailing={{
            columns: [
              "minmax(8rem,18rem)",
              "max-content",
              "max-content",
              "max-content",
              "max-content",
            ],
            render: (list, active) => (
              <>
                <EditableCell
                  value={list.memo}
                  placeholder="메모"
                  active={active}
                  editing={editingId === list.id}
                  onEdit={() => setEditingId(list.id)}
                  onDone={() => setEditingId(null)}
                  onSave={(memo) => void setListMemo(list.id, memo)}
                />
                <span className={cn("text-right", !active && "text-muted")}>
                  {list.nodeIds.length}개
                </span>
                <span className={cn(!active && "text-faint")}>{formatDate(list.updatedAt)}</span>
                <TextButton
                  onClick={() => void rename(list)}
                  className={cn(!active && "text-muted")}
                >
                  이름 변경
                </TextButton>
                <TextButton
                  onClick={() => void remove(list)}
                  className={cn("hover:text-danger", !active && "text-muted")}
                >
                  삭제
                </TextButton>
              </>
            ),
          }}
        />
      )}
      <Hints
        className="mt-6"
        items={[
          { keys: "↑↓", label: "선택" },
          { keys: "enter", label: "열기" },
          { keys: "n", label: "새 리스트", onClick: () => void create(count) },
          { keys: "m", label: "메모" },
          { keys: "r", label: "이름 변경" },
          { keys: "del", label: "삭제" },
        ]}
      />
    </div>
  );
}
