import { Link } from "./router.tsx";

export function Header({ appId }: { appId?: string | undefined }) {
  return (
    <header className="sticky top-0 z-10 bg-canvas px-6 py-3 font-mono text-sm">
      {appId === undefined ? (
        <span>toolkit</span>
      ) : (
        <>
          <Link to="/" className="text-muted hover:text-ink">
            toolkit
          </Link>
          <span className="text-muted"> / </span>
          <span>{appId}</span>
        </>
      )}
    </header>
  );
}
