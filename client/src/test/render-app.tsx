import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { vi } from "vitest";
import { installSessionGuard } from "@/features/auth";
import { createAppRouter } from "@/router";
import { server } from "./server";

/**
 * Renders the whole app (real routes, guards and session handling) at `path`,
 * against the MSW mock API. Use for flows that cross screens.
 */
export function renderApp(path = "/", { onRender }: { onRender?: ProfilerOnRenderCallback } = {}) {
  // jsdom has no scrollTo; the router calls it on navigation.
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  installSessionGuard(queryClient);
  const router = createAppRouter(queryClient, createMemoryHistory({ initialEntries: [path] }));
  const app = (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  // `onRender` counts every commit anywhere in the app, for render budgets.
  const view = render(
    onRender ? (
      <Profiler id="app" onRender={onRender}>
        {app}
      </Profiler>
    ) : (
      app
    ),
  );
  return { ...view, queryClient, router };
}

/** Records the API requests made from now on as `METHOD /path` (without `/api`). */
export function recordRequests() {
  const requests: string[] = [];
  const onStart = ({ request }: { request: Request }) => {
    const { pathname } = new URL(request.url);
    requests.push(`${request.method} ${pathname.replace(/^\/api/, "")}`);
  };
  server.events.on("request:start", onStart);
  return {
    requests,
    /** Requests other than the health poll on the home page. */
    get identity() {
      return requests.filter((r) => !r.endsWith("/healthz"));
    },
    clear() {
      requests.length = 0;
    },
    stop() {
      server.events.removeListener("request:start", onStart);
    },
  };
}
