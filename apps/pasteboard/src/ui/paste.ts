import type { ImageNode, Node, TextNode } from "./db.ts";

export type Draft = { kind: "text"; text: string } | { kind: "image"; blob: Blob };

// Images win over text: copying an image in a browser also puts its URL or alt text on the clipboard.
export function draftsFromTransfer(data: DataTransfer): Draft[] {
  const images = [...data.files].filter((file) => file.type.startsWith("image/"));
  if (images.length > 0) return images.map((blob) => ({ kind: "image", blob }));
  const text = data.getData("text/plain");
  return text.trim() ? [{ kind: "text", text }] : [];
}

// For the paste button, which reads the clipboard without a paste event.
export async function draftsFromClipboard(): Promise<Draft[]> {
  const items = await navigator.clipboard.read();
  const drafts = await Promise.all(
    items.map(async (item): Promise<Draft | undefined> => {
      const image = item.types.find((type) => type.startsWith("image/"));
      if (image) return { kind: "image", blob: await item.getType(image) };
      if (!item.types.includes("text/plain")) return undefined;
      const text = await (await item.getType("text/plain")).text();
      return text.trim() ? { kind: "text", text } : undefined;
    }),
  );
  return drafts.filter((draft) => draft !== undefined);
}

async function sha256(data: BufferSource): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(blob);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: 0, height: 0 };
  }
}

async function toNode(listId: string, draft: Draft): Promise<Node> {
  const base = { id: crypto.randomUUID(), listId, memo: "", createdAt: Date.now() };
  if (draft.kind === "text") {
    const hash = await sha256(new TextEncoder().encode(draft.text));
    return { ...base, kind: "text", text: draft.text, hash } satisfies TextNode;
  }
  const hash = await sha256(await draft.blob.arrayBuffer());
  return {
    ...base,
    kind: "image",
    blob: draft.blob,
    mime: draft.blob.type,
    ...(await imageSize(draft.blob)),
    hash,
  } satisfies ImageNode;
}

// Turns drafts into nodes and sets aside any that repeat the one right before them
// (pasting the same screenshot twice is usually a slip, but the caller may add them anyway).
export async function buildNodes(listId: string, drafts: Draft[], last: Node | undefined) {
  const nodes = await Promise.all(drafts.map((draft) => toNode(listId, draft)));
  const added: Node[] = [];
  const skipped: Node[] = [];
  let previous = last;
  for (const node of nodes) {
    if (previous?.kind === node.kind && previous.hash === node.hash) {
      skipped.push(node);
      continue;
    }
    added.push(node);
    previous = node;
  }
  return { added, skipped };
}
