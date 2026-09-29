import { useEffect, useRef, useState } from "react";

import { onChange } from "./db.ts";

// Loads once per key and again after every write. set() shows a value right away,
// ahead of the write that will confirm it (e.g. while dragging).
export function useLive<T>(key: string, load: () => Promise<T>) {
  const [state, setState] = useState<{ key: string; data: T }>();
  const latest = useRef(load);
  useEffect(() => {
    latest.current = load;
  });

  useEffect(() => {
    let active = true;
    let version = 0;
    function run() {
      const current = ++version;
      void latest.current().then((data) => {
        if (active && current === version) setState({ key, data });
      });
    }
    run();
    const off = onChange(run);
    return () => {
      active = false;
      off();
    };
  }, [key]);

  const data = state?.key === key ? state.data : undefined;
  const set = (next: T) => setState({ key, data: next });
  return [data, set] as const;
}
