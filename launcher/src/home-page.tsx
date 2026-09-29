import { appPath, navigate } from "@toolkit/shell";
import { Hints, SelectList } from "@toolkit/ui";
import { useEffect, useState } from "react";

import { apps } from "./apps.ts";

// Remembered across visits to an app.
let lastSelected = 0;

export function HomePage() {
  const [selected, setSelected] = useState(() => Math.min(lastSelected, apps.length - 1));

  useEffect(() => {
    lastSelected = selected;
  }, [selected]);

  return (
    <div className="font-mono text-sm">
      {apps.length === 0 ? (
        <p className="text-muted">앱이 없습니다. pnpm new &lt;id&gt; 로 추가하세요.</p>
      ) : (
        <SelectList
          items={apps}
          columns={["max-content", "1fr"]}
          getKey={(app) => app.manifest.id}
          getHref={(app) => appPath(app.manifest.id)}
          selected={selected}
          onSelect={setSelected}
          onOpen={(app) => navigate(appPath(app.manifest.id))}
          renderRow={({ manifest }, active) => (
            <>
              <span>{manifest.id}</span>
              <span className={active ? "" : "text-muted"}>{manifest.description}</span>
            </>
          )}
        />
      )}
      <Hints
        className="mt-6"
        items={[
          { keys: "↑↓", label: "선택" },
          { keys: "enter", label: "열기" },
        ]}
      />
    </div>
  );
}
