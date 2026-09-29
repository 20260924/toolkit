import { strToU8, zipSync, type Zippable } from "fflate";

import type { ListWithNodes } from "./db.ts";
import { fileNames, safeFileName } from "./format.ts";

// 01.png, 02.txt, … in list order. Memos stay out; they are notes for the list, not content.
export async function downloadZip({ list, nodes }: ListWithNodes) {
  const names = fileNames(nodes);
  const entries = await Promise.all(
    nodes.map(async (node, index): Promise<[string, Zippable[string]]> => [
      names[index] ?? `${index + 1}`,
      node.kind === "text"
        ? strToU8(node.text)
        : // Images are compressed already; storing them is faster and no bigger.
          [new Uint8Array(await node.blob.arrayBuffer()), { level: 0 }],
    ]),
  );
  const zipped = zipSync(Object.fromEntries(entries));
  const url = URL.createObjectURL(new Blob([zipped.slice()], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(list.name)}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
