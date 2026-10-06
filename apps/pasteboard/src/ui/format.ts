const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
};

export function extension(mime: string): string {
  return EXTENSIONS[mime] ?? mime.split("/")[1]?.replace(/[^a-z0-9]/g, "") ?? "bin";
}

// 01, 02, … wide enough for the last number, never narrower than two digits.
export function numbers(count: number): string[] {
  const width = Math.max(2, String(count).length);
  return Array.from({ length: count }, (_, index) => String(index + 1).padStart(width, "0"));
}

export function fileNames(items: ({ kind: "text" } | { kind: "image"; mime: string })[]): string[] {
  const nos = numbers(items.length);
  return items.map((item, index) =>
    item.kind === "text" ? `${nos[index]}.txt` : `${nos[index]}.${extension(item.mime)}`,
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// Characters as people count them, so 한 and é are one each; bytes are shown separately.
export function charCount(text: string): number {
  return [...new Intl.Segmenter().segment(text)].length;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatDate(time: number): string {
  const date = new Date(time);
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

// Keeps a list name usable as a file name on Windows and macOS.
export function safeFileName(name: string): string {
  // oxlint-disable-next-line no-control-regex
  const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/[. ]+$/, "");
  return cleaned || "pasteboard";
}
