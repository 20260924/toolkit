import { describe, expect, it } from "vitest";

import { escapeHtml, renderDocument } from "./document.ts";

describe("escapeHtml", () => {
  it("escapes markup and quotes", () => {
    expect(escapeHtml(`<b a="1">'&'</b>`)).toBe(
      "&lt;b a=&quot;1&quot;&gt;&#39;&amp;&#39;&lt;/b&gt;",
    );
  });
});

describe("renderDocument", () => {
  const html = renderDocument({
    title: "설치 <절차>",
    intro: "  설치파일 제작 절차.\n<녹화> 기준  ",
    frames: [
      { src: "assets/0001.webp", time: 9.47, note: "VB 5.0 실행\n<프로젝트> 열기" },
      { src: "assets/0040.webp", time: null, note: "" },
    ],
  });

  it("lists the frames in order with time and escaped note", () => {
    expect(html.indexOf("assets/0001.webp")).toBeLessThan(html.indexOf("assets/0040.webp"));
    expect(html).toContain("<time>00:09</time>");
    expect(html).toContain("VB 5.0 실행\n&lt;프로젝트&gt; 열기");
    expect(html).toContain("<title>설치 &lt;절차&gt;</title>");
  });

  it("puts the author's intro under the title", () => {
    expect(html).toContain('<p class="intro">설치파일 제작 절차.\n&lt;녹화&gt; 기준</p>');
    expect(html).not.toContain("내보냄");
  });

  it("leaves the intro out when empty", () => {
    const bare = renderDocument({ title: "t", intro: "  ", frames: [] });
    expect(bare).not.toContain('class="intro"');
  });

  it("loads nothing from the network", () => {
    expect(html).not.toMatch(/(src|href)="(https?:)?\/\//);
  });
});
