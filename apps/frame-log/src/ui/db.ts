import { openDB, type DBSchema } from "idb";

// What the author decided about one frame, keyed by its file name. Images are not stored;
// loading the same folder again picks these back up.
export type FrameState = { name: string; note: string; removed: boolean };

interface Schema extends DBSchema {
  frames: { key: string; value: FrameState };
}

const db = openDB<Schema>("toolkit:frame-log", 1, {
  upgrade(database) {
    database.createObjectStore("frames", { keyPath: "name" });
  },
});

export async function getStates(): Promise<Map<string, FrameState>> {
  const states = await (await db).getAll("frames");
  return new Map(states.map((state) => [state.name, state]));
}

export async function putState(state: FrameState) {
  await (await db).put("frames", state);
}
