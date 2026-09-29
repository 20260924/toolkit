import { useEffect } from "react";

import { AppPage } from "./app-page.tsx";
import { findApp } from "./apps.ts";
import { Header } from "./header.tsx";
import { HomePage } from "./home-page.tsx";
import { useRoute } from "./router.tsx";

export function Launcher() {
  const route = useRoute();
  const found = route.page === "app" ? findApp(route.id) : undefined;
  const title = found ? `${found.app.manifest.name} · toolkit` : "toolkit";

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header appId={found?.app.manifest.id} />
      <main className="flex-1 px-6 pt-3 pb-6">
        {found ? <AppPage key={found.app.manifest.id} View={found.View} /> : <HomePage />}
      </main>
    </div>
  );
}
