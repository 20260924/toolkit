import { openDB, type DBSchema } from "idb";

export type List = {
  id: string;
  name: string;
  memo: string;
  // The order of the list lives here, so a reorder rewrites one record.
  nodeIds: string[];
  createdAt: number;
  updatedAt: number;
};

// memo is a note for the list only; it stays out of the zip.
type NodeBase = { id: string; listId: string; hash: string; memo: string; createdAt: number };
export type TextNode = NodeBase & { kind: "text"; text: string };
export type ImageNode = NodeBase & {
  kind: "image";
  blob: Blob;
  mime: string;
  width: number;
  height: number;
};
export type Node = TextNode | ImageNode;

export type ListWithNodes = { list: List; nodes: Node[] };
// Removed nodes with the positions they held, for undo.
export type Removed = { listId: string; entries: { node: Node; index: number }[] };

interface Schema extends DBSchema {
  lists: { key: string; value: List };
  nodes: { key: string; value: Node; indexes: { listId: string } };
}

const db = openDB<Schema>("toolkit:pasteboard", 1, {
  upgrade(database) {
    database.createObjectStore("lists", { keyPath: "id" });
    database.createObjectStore("nodes", { keyPath: "id" }).createIndex("listId", "listId");
  },
});

// Views reload whenever anything is written.
const changes = new EventTarget();

export function onChange(listener: () => void) {
  changes.addEventListener("change", listener);
  return () => changes.removeEventListener("change", listener);
}

function changed() {
  changes.dispatchEvent(new Event("change"));
}

export async function getLists(): Promise<List[]> {
  const lists = await (await db).getAll("lists");
  // Lists saved before memos existed have none.
  for (const list of lists) list.memo ??= "";
  return lists.toSorted((a, b) => a.createdAt - b.createdAt);
}

export async function getList(id: string): Promise<ListWithNodes | null> {
  const tx = (await db).transaction(["lists", "nodes"]);
  const list = await tx.objectStore("lists").get(id);
  if (!list) return null;
  const nodes = await tx.objectStore("nodes").index("listId").getAll(id);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  // Text nodes saved before memos covered them have none.
  const ordered = list.nodeIds.flatMap((nodeId) => byId.get(nodeId) ?? []);
  for (const node of ordered) node.memo ??= "";
  return { list, nodes: ordered };
}

export async function createList(name: string): Promise<List> {
  const now = Date.now();
  const list: List = {
    id: crypto.randomUUID().slice(0, 8),
    name,
    memo: "",
    nodeIds: [],
    createdAt: now,
    updatedAt: now,
  };
  await (await db).add("lists", list);
  changed();
  return list;
}

async function updateList(id: string, update: (list: List) => Partial<List>) {
  const tx = (await db).transaction("lists", "readwrite");
  const list = await tx.store.get(id);
  if (list) await tx.store.put({ ...list, ...update(list), updatedAt: Date.now() });
  await tx.done;
}

export async function setListMemo(id: string, memo: string) {
  await updateList(id, () => ({ memo }));
  changed();
}

export async function renameList(id: string, name: string) {
  await updateList(id, () => ({ name }));
  changed();
}

export async function deleteList(id: string): Promise<ListWithNodes | null> {
  const snapshot = await getList(id);
  const tx = (await db).transaction(["lists", "nodes"], "readwrite");
  const nodes = tx.objectStore("nodes");
  const keys = await nodes.index("listId").getAllKeys(id);
  await Promise.all(keys.map((key) => nodes.delete(key)));
  await tx.objectStore("lists").delete(id);
  await tx.done;
  changed();
  return snapshot;
}

export async function restoreList({ list, nodes }: ListWithNodes) {
  const tx = (await db).transaction(["lists", "nodes"], "readwrite");
  await tx.objectStore("lists").put(list);
  await Promise.all(nodes.map((node) => tx.objectStore("nodes").put(node)));
  await tx.done;
  changed();
}

export async function appendNodes(listId: string, added: Node[]) {
  const tx = (await db).transaction(["lists", "nodes"], "readwrite");
  const lists = tx.objectStore("lists");
  const list = await lists.get(listId);
  if (!list) return;
  await Promise.all(added.map((node) => tx.objectStore("nodes").add(node)));
  await lists.put({
    ...list,
    nodeIds: [...list.nodeIds, ...added.map((node) => node.id)],
    updatedAt: Date.now(),
  });
  await tx.done;
  changed();
}

export async function removeNodes(listId: string, ids: string[]): Promise<Removed> {
  const tx = (await db).transaction(["lists", "nodes"], "readwrite");
  const lists = tx.objectStore("lists");
  const nodes = tx.objectStore("nodes");
  const list = await lists.get(listId);
  const entries: Removed["entries"] = [];
  if (list) {
    const found = await Promise.all(
      list.nodeIds.map(async (id, index) => {
        const node = ids.includes(id) ? await nodes.get(id) : undefined;
        return node && { node, index };
      }),
    );
    entries.push(...found.filter((entry) => entry !== undefined));
    await Promise.all(ids.map((id) => nodes.delete(id)));
    await lists.put({
      ...list,
      nodeIds: list.nodeIds.filter((id) => !ids.includes(id)),
      updatedAt: Date.now(),
    });
  }
  await tx.done;
  changed();
  return { listId, entries };
}

// Puts nodes back where they were; anything added in the meantime stays after them.
export async function restoreNodes({ listId, entries }: Removed) {
  const tx = (await db).transaction(["lists", "nodes"], "readwrite");
  const lists = tx.objectStore("lists");
  const list = await lists.get(listId);
  if (list) {
    await Promise.all(entries.map(({ node }) => tx.objectStore("nodes").put(node)));
    const nodeIds = [...list.nodeIds];
    for (const { node, index } of entries.toSorted((a, b) => a.index - b.index)) {
      nodeIds.splice(Math.min(index, nodeIds.length), 0, node.id);
    }
    await lists.put({ ...list, nodeIds, updatedAt: Date.now() });
  }
  await tx.done;
  changed();
}

export async function reorderNodes(listId: string, nodeIds: string[]) {
  await updateList(listId, () => ({ nodeIds }));
  changed();
}

export async function setMemo(nodeId: string, memo: string) {
  const tx = (await db).transaction("nodes", "readwrite");
  const node = await tx.store.get(nodeId);
  if (node) await tx.store.put({ ...node, memo });
  await tx.done;
  changed();
}
