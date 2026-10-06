import { useAppPath } from "@toolkit/shell";
import { useEffect } from "react";

import { IndexPage } from "./index-page.tsx";
import { ListPage } from "./list-page.tsx";

export default function App() {
  const [listId] = useAppPath();

  // Ask the browser not to evict the lists under storage pressure.
  useEffect(() => {
    void navigator.storage?.persist?.();
  }, []);

  return listId ? <ListPage key={listId} id={listId} /> : <IndexPage />;
}
