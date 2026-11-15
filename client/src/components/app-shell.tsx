import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** The frame around every screen: the app header and one centred `main` landmark. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
          <Link to="/" className="font-heading text-lg font-semibold">
            Cadence
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
