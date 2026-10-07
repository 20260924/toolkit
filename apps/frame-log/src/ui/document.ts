import { formatTime } from "./times.ts";

export type DocumentFrame = { src: string; time: number | null; note: string };

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

// Everything is inline: the page is opened from disk (file://) with no network.
const STYLE = `
:root {
  color-scheme: light dark;
  --canvas: #f5f3ec; --surface: #fffdf6; --line: #d9ded4;
  --ink: #142010; --muted: #61705e; --primary: #375b46;
}
@media (prefers-color-scheme: dark) {
  :root {
    --canvas: #1b211e; --surface: #232a26; --line: #34403a;
    --ink: #e4eae0; --muted: #98a698; --primary: #8fbf9f;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--canvas); color: var(--ink);
  font: 15px/1.6 "Malgun Gothic", system-ui, sans-serif;
}
main { max-width: 1100px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { margin: 0 0 4px; font-size: 24px; }
.meta { margin: 0 0 24px; color: var(--muted); font-size: 13px; }
ol { list-style: none; margin: 0; padding: 0; }
li {
  display: grid; grid-template-columns: 320px 4.5em minmax(0, 1fr); gap: 16px;
  align-items: start; padding: 12px 0; border-top: 1px solid var(--line);
}
li a { display: block; line-height: 0; }
li img {
  width: 100%; aspect-ratio: 16 / 9; object-fit: cover; object-position: top;
  border: 1px solid var(--line); border-radius: 4px; background: var(--surface); cursor: zoom-in;
}
li a:hover img, li a:focus-visible img { border-color: var(--primary); }
time { font-family: ui-monospace, Consolas, monospace; color: var(--muted); padding-top: 2px; }
.note { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; padding-top: 2px; }
@media (max-width: 640px) {
  li { grid-template-columns: 1fr; gap: 6px; }
}
#viewer {
  position: fixed; inset: 0; z-index: 10; display: none; flex-direction: column;
  background: rgb(0 0 0 / 0.88); color: #eee;
}
#viewer.open { display: flex; }
#viewer img { flex: 1; min-height: 0; width: 100%; object-fit: contain; cursor: zoom-out; }
#viewer p {
  margin: 0; padding: 10px 16px; display: flex; gap: 16px; justify-content: space-between;
  font-size: 14px;
}
#viewer span { white-space: pre-wrap; overflow-wrap: anywhere; }
#viewer kbd { opacity: 0.6; font: inherit; white-space: nowrap; }
`;

// Clicking a thumbnail opens the original over the page; ←→ step, Esc or a click closes.
// Without the script the thumbnail is still a plain link to the image.
const SCRIPT = `
const links = [...document.querySelectorAll("li a")];
const viewer = document.getElementById("viewer");
const image = viewer.querySelector("img");
const caption = viewer.querySelector("span");
const counter = viewer.querySelector("kbd");
let current = -1;
function show(index) {
  const link = links[index];
  if (!link) return;
  current = index;
  image.src = link.href;
  caption.textContent = link.dataset.caption;
  counter.textContent = (index + 1) + " / " + links.length + "  ← →  esc";
  viewer.classList.add("open");
}
function close() {
  viewer.classList.remove("open");
  links[current]?.focus();
  current = -1;
}
links.forEach((link, index) => link.addEventListener("click", (event) => {
  event.preventDefault();
  show(index);
}));
viewer.addEventListener("click", close);
addEventListener("keydown", (event) => {
  if (current < 0) return;
  if (event.key === "Escape") close();
  else if (event.key === "ArrowLeft") show(current - 1);
  else if (event.key === "ArrowRight") show(current + 1);
  else return;
  event.preventDefault();
});
`;

export function renderDocument({
  title,
  frames,
  exportedAt,
}: {
  title: string;
  frames: DocumentFrame[];
  exportedAt: string;
}): string {
  const rows = frames.map(({ src, time, note }) => {
    const shown = time === null ? "" : formatTime(time);
    const caption = [shown, note].filter(Boolean).join("  ");
    return `<li>
<a href="${escapeHtml(src)}" data-caption="${escapeHtml(caption)}"><img src="${escapeHtml(src)}" alt="" loading="lazy"></a>
<time>${shown}</time>
<p class="note">${escapeHtml(note)}</p>
</li>`;
  });

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<h1>${escapeHtml(title)}</h1>
<p class="meta">프레임 ${frames.length}개 · ${escapeHtml(exportedAt)} 내보냄 · 썸네일을 누르면 원본 크기로 봅니다</p>
<ol>
${rows.join("\n")}
</ol>
</main>
<div id="viewer" role="dialog" aria-modal="true" aria-label="원본 보기"><img alt=""><p><span></span><kbd></kbd></p></div>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
