import { strToU8, zipSync, type Zippable } from "fflate";

import { renderDocument } from "./document.ts";
import type { Frame } from "./session.ts";

const pad2 = (n: number) => String(n).padStart(2, "0");

// Keeps a title usable as a file name on Windows and macOS.
export function safeFileName(name: string): string {
  // oxlint-disable-next-line no-control-regex
  const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/[. ]+$/, "");
  return cleaned || "frame-log";
}

// <title>.zip holding index.html and assets/ with the kept frames, in list order.
export async function downloadZip(title: string, frames: { frame: Frame; note: string }[]) {
  const now = new Date();
  const html = renderDocument({
    title,
    exportedAt: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
    frames: frames.map(({ frame, note }) => ({
      src: `assets/${frame.name}`,
      time: frame.time,
      note,
    })),
  });
  const assets = await Promise.all(
    frames.map(async ({ frame }): Promise<[string, Zippable[string]]> => [
      frame.name,
      // Images are compressed already; storing them is faster and no bigger.
      [new Uint8Array(await frame.file.arrayBuffer()), { level: 0 }],
    ]),
  );
  const zipped = zipSync({ "index.html": strToU8(html), assets: Object.fromEntries(assets) });
  const url = URL.createObjectURL(new Blob([zipped.slice()], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(title)}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
