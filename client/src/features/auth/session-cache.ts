import type { QueryClient } from "@tanstack/react-query";
import { missingSession } from "@/lib/api";
import { authKeys } from "./queries";

/** Everything cached for the active profile: any query outside the auth feature. */
export function removeProfileData(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.all[0] });
}

/** The device is back at the picker: forget the profile and what it could see. */
export function forgetProfile(queryClient: QueryClient) {
  queryClient.setQueryData(authKeys.me, null);
  removeProfileData(queryClient);
  void queryClient.invalidateQueries({ queryKey: authKeys.profiles });
}

/** The device is signed out of the family: forget everything but registration status. */
export function forgetFamily(queryClient: QueryClient) {
  queryClient.setQueryData(authKeys.session, null);
  queryClient.setQueryData(authKeys.me, null);
  queryClient.removeQueries({ queryKey: authKeys.profiles });
  removeProfileData(queryClient);
}

/**
 * Central handling of the two "session required" 401s (spec §3): whichever query
 * or mutation hits one, the cached session state is cleared, and the route
 * layouts, which render from that state, send the user to login or the picker.
 * Returns the unsubscribe function.
 */
export function installSessionGuard(queryClient: QueryClient): () => void {
  function onError(error: unknown) {
    switch (missingSession(error)) {
      case "family":
        forgetFamily(queryClient);
        break;
      case "profile":
        forgetProfile(queryClient);
        break;
      case undefined:
        break;
    }
  }
  const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "error") onError(event.action.error);
  });
  const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "error") onError(event.action.error);
  });
  return () => {
    unsubscribeQueries();
    unsubscribeMutations();
  };
}
