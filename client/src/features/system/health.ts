import { queryOptions, useQuery } from "@tanstack/react-query";
import { api, passive, unwrap } from "@/lib/api";

export const healthQuery = queryOptions({
  queryKey: ["system", "health"],
  // Polling, so passive: it must never keep a session alive.
  queryFn: ({ signal }) => unwrap(api.GET("/healthz", { signal, ...passive })),
  // Report an outage immediately and notice when the API comes back.
  retry: false,
  refetchInterval: 15_000,
});

export function useHealth() {
  return useQuery(healthQuery);
}
