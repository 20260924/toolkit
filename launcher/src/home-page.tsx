import { useEffect, useState } from "react";

import { apps } from "./apps.ts";
import { Link, appPath, navigate } from "./router.tsx";

// Remembered across visits to an app.
let lastSelected = 0;

export function HomePage() {
  const [selected, setSelected] = useState(() => Math.min(lastSelected, apps.length - 1));

  useEffect(() => {
    lastSelected = selected;
  }, [selected]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelected(Math.min(selected + 1, apps.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelected(Math.max(selected - 1, 0));
      } else if (event.key === "Enter") {
        const app = apps[selected];
        if (app) navigate(appPath(app.manifest.id));
      }
    }
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return (
    <div className="font-mono text-sm">
      {apps.length === 0 ? (
        <p className="text-muted">앱이 없습니다. pnpm new &lt;id&gt; 로 추가하세요.</p>
      ) : (
        // -mx-2 cancels the row padding so the ids line up with the header text.
        <ul className="-mx-2 grid grid-cols-[max-content_1fr]">
          {apps.map(({ manifest }, index) => {
            const active = index === selected;
            return (
              <li key={manifest.id} className="col-span-2 grid grid-cols-subgrid">
                <Link
                  to={appPath(manifest.id)}
                  onMouseEnter={() => setSelected(index)}
                  onFocus={() => setSelected(index)}
                  className={`col-span-2 grid grid-cols-subgrid gap-x-6 px-2 py-0.5 outline-none ${active ? "bg-ink text-canvas" : ""}`}
                >
                  <span>{manifest.id}</span>
                  <span className={active ? "" : "text-muted"}>{manifest.description}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-faint">↑↓ 선택 · enter 열기</p>
    </div>
  );
}
