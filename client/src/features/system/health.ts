import { queryOptions, useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";

export const healthQuery = queryOptions({
  queryKey: ["system", "health"],
  queryFn: ({ signal }) => unwrap(api.GET("/healthz", { signal })),
  // Report an outage immediately and notice when the API comes back.
  retry: false,
  refetchInterval: 15_000,
});

export function useHealth() {
  return useQuery(healthQuery);
}
