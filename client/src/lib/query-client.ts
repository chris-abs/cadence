import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

const MAX_RETRIES = 2;

/** Client errors (4xx) will not succeed on retry; everything else might. */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
      },
    },
  });
}
