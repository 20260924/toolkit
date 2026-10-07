// Reads the output of ffmpeg's `metadata=print`, two lines per frame:
//   frame:0    pts:145408  pts_time:9.466667
//   lavfi.scene_score=0.019026
// and returns seconds by frame index. frame:N is the (N+1)th extracted file.
export function parseTimes(text: string): Map<number, number> {
  const times = new Map<number, number>();
  for (const line of text.split(/\r?\n/)) {
    const frame = /(?:^|\s)frame:(\d+)(?:\s|$)/.exec(line)?.[1];
    const time = /(?:^|\s)pts_time:(-?[\d.]+)(?:\s|$)/.exec(line)?.[1];
    if (frame === undefined || time === undefined) continue;
    const seconds = Number(time);
    if (Number.isFinite(seconds)) times.set(Number(frame), seconds);
  }
  return times;
}

// 0001.webp → frame index 0; null for a name that does not start with a number.
export function frameIndex(fileName: string): number | null {
  const digits = /^(\d+)\./.exec(fileName)?.[1];
  return digits === undefined ? null : Number(digits) - 1;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// 75.9 → "01:15"; past an hour, "1:02:03".
export function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

export const IMAGE_FILE = /\.(png|jpe?g|webp|avif|gif|bmp)$/i;

// 0001.webp → 0001
export const stem = (fileName: string) => fileName.replace(/\.[^.]+$/, "");
