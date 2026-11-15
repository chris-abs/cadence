import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/** Renders `ui` with a fresh QueryClient that never retries, so failures show at once. */
export function renderWithQuery(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}
