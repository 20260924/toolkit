import { useCurrentCrumbs, usePath } from "@toolkit/shell";
import { DialogHost, ToastHost } from "@toolkit/ui";
import { useEffect } from "react";

import { AppPage } from "./app-page.tsx";
import { findApp } from "./apps.ts";
import { Header } from "./header.tsx";
import { HomePage } from "./home-page.tsx";

export function Launcher() {
  const route = usePath();
  const crumbs = useCurrentCrumbs();
  const found = route.page === "app" ? findApp(route.id) : undefined;
  const title = found
    ? [...crumbs.map((crumb) => crumb.label).toReversed(), found.app.manifest.name, "toolkit"].join(
        " · ",
      )
    : "toolkit";

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header appId={found?.app.manifest.id} crumbs={crumbs} />
      <main className="flex-1 px-6 pt-3 pb-6">
        {found ? <AppPage key={found.app.manifest.id} View={found.View} /> : <HomePage />}
      </main>
      <ToastHost />
      <DialogHost />
    </div>
  );
}
