import { useSyncExternalStore } from "react";

import { IMAGE_FILE, frameIndex, parseTimes } from "./times.ts";

export type Frame = { name: string; file: File; url: string; time: number | null };

type Session = {
  folder: string;
  files: { name: string; file: File; url: string }[];
  timesName: string;
  times: Map<number, number>;
};

// The picked files live only in memory: the browser cannot reopen them by path, so they
// are kept here while moving around the launcher and picked again after a reload.
let session: Session = { folder: "", files: [], timesName: "", times: new Map() };
const listeners = new Set<() => void>();

function set(next: Session) {
  session = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSession() {
  return useSyncExternalStore(subscribe, () => session);
}

export function loadFolder(picked: FileList) {
  for (const { url } of session.files) URL.revokeObjectURL(url);
  const files = [...picked]
    .filter((file) => IMAGE_FILE.test(file.name))
    .toSorted((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((file) => ({ name: file.name, file, url: URL.createObjectURL(file) }));
  // webkitRelativePath is "folder/0001.webp" for a picked folder.
  const folder = picked[0]?.webkitRelativePath.split("/")[0] ?? "";
  set({ ...session, folder, files });
  return files.length;
}

export async function loadTimes(file: File) {
  const times = parseTimes(await file.text());
  set({ ...session, timesName: file.name, times });
  return times.size;
}

export function framesOf({ files, times }: Session): Frame[] {
  return files.map(({ name, file, url }) => {
    const index = frameIndex(name);
    return { name, file, url, time: index === null ? null : (times.get(index) ?? null) };
  });
}
