import { describe, expect, it } from "vitest";

import { formatTime, frameIndex, parseTimes } from "./times.ts";

describe("parseTimes", () => {
  it("reads frame and pts_time across runs of spaces", () => {
    const text = [
      "frame:0    pts:145408  pts_time:9.466667",
      "lavfi.scene_score=0.019026",
      "frame:264  pts:14083072 pts_time:916.866667",
      "lavfi.scene_score=0.096221",
    ].join("\r\n");
    expect([...parseTimes(text)]).toEqual([
      [0, 9.466667],
      [264, 916.866667],
    ]);
  });

  it("skips lines without both fields", () => {
    expect(parseTimes("frame:3 pts:1\n\ngarbage\n").size).toBe(0);
  });
});

describe("frameIndex", () => {
  it("maps the file number to the ffmpeg frame index", () => {
    expect(frameIndex("0001.webp")).toBe(0);
    expect(frameIndex("0265.png")).toBe(264);
  });

  it("returns null for other names", () => {
    expect(frameIndex("cover.png")).toBeNull();
  });
});

describe("formatTime", () => {
  it("shows minutes and seconds", () => {
    expect(formatTime(9.466667)).toBe("00:09");
    expect(formatTime(916.866667)).toBe("15:16");
  });

  it("adds hours past an hour", () => {
    expect(formatTime(3723)).toBe("1:02:03");
  });
});
