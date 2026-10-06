import { Link, appPath, type Crumb } from "@toolkit/shell";
import { Fragment } from "react";

// toolkit / <app> / <crumbs…>; every segment but the last links back up.
export function Header({ appId, crumbs }: { appId?: string | undefined; crumbs: Crumb[] }) {
  const segments: Crumb[] = [{ label: "toolkit", to: "/" }];
  if (appId !== undefined) segments.push({ label: appId, to: appPath(appId) }, ...crumbs);

  return (
    <header className="sticky top-0 z-10 truncate bg-canvas px-6 py-3 font-mono text-sm">
      {segments.map((segment, index) => {
        const last = index === segments.length - 1;
        return (
          // Segments are positional; the same place always holds the same level.
          // oxlint-disable-next-line react/no-array-index-key
          <Fragment key={index}>
            {index > 0 && <span className="text-muted"> / </span>}
            {last || segment.to === undefined ? (
              <span className={last ? "" : "text-muted"}>{segment.label}</span>
            ) : (
              <Link to={segment.to} className="text-muted hover:text-ink">
                {segment.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </header>
  );
}
