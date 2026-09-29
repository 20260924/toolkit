import { describe, expect, it } from "vitest";

import { extension, fileNames, formatBytes, charCount, numbers, safeFileName } from "./format.ts";

describe("numbers", () => {
  it("pads to two digits at least", () => {
    expect(numbers(3)).toEqual(["01", "02", "03"]);
  });

  it("widens for the last number", () => {
    expect(numbers(100).at(0)).toBe("001");
    expect(numbers(100).at(-1)).toBe("100");
  });
});

describe("fileNames", () => {
  it("names text and images by position", () => {
    expect(
      fileNames([
        { kind: "image", mime: "image/png" },
        { kind: "text" },
        { kind: "image", mime: "image/jpeg" },
      ]),
    ).toEqual(["01.png", "02.txt", "03.jpg"]);
  });
});

describe("extension", () => {
  it("falls back to the mime subtype", () => {
    expect(extension("image/svg+xml")).toBe("svg");
    expect(extension("image/x-icon")).toBe("xicon");
  });
});

describe("text summaries", () => {
  it("counts characters, not bytes", () => {
    expect(charCount("설치 완료")).toBe(5);
    expect(charCount("é👍🏽")).toBe(2);
  });
});

describe("formatBytes", () => {
  it("picks a readable unit", () => {
    expect(formatBytes(830)).toBe("830B");
    expect(formatBytes(412 * 1024)).toBe("412KB");
    expect(formatBytes(1.25 * 1024 * 1024)).toBe("1.3MB");
  });
});

describe("safeFileName", () => {
  it("replaces reserved characters", () => {
    expect(safeFileName('설치: v1/v2 "최종"')).toBe("설치_ v1_v2 _최종_");
  });

  it("never returns an empty name", () => {
    expect(safeFileName("...")).toBe("pasteboard");
  });
});
