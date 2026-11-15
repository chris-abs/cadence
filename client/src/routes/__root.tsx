import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { NotFound } from "@/components/not-found";
import { ErrorState, LoadingState } from "@/components/page-states";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFound,
  pendingComponent: () => <LoadingState />,
  errorComponent: ({ reset }) => (
    <ErrorState message="Cadence could not load. Check the connection." onRetry={reset} />
  ),
});
