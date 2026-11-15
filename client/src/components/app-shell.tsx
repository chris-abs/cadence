import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  /** Navigation links after the app name. */
  nav?: ReactNode;
  /** The header's trailing area, e.g. the active profile and its actions. */
  actions?: ReactNode;
  /** Messages above the page, e.g. advice banners. */
  notices?: ReactNode;
}

/** The frame around every in-app screen: the app header and one centred `main` landmark. */
export function AppShell({ children, nav, actions, notices }: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <Link to="/" className="font-heading text-lg font-semibold text-primary">
            Cadence
          </Link>
          {nav && (
            <nav aria-label="Main" className="flex items-center gap-1">
              {nav}
            </nav>
          )}
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        {notices}
        {children}
      </main>
    </div>
  );
}
