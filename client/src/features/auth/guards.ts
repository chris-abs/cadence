import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { missingSession } from "@/lib/api";
import type { Permission } from "./permissions";
import { familySessionQuery, meQuery, registrationQuery } from "./queries";

/**
 * Route guards for `beforeLoad`. Where a device belongs (spec §2):
 * no family session → login; family session, no profile → picker; both → app.
 * Errors other than a missing session reach the route's error component.
 * Guards read the cache when it has an answer (the session guard keeps it
 * honest), so moving between screens costs no requests.
 */

const cachedOrFetched = { staleTime: "static" } as const;

/** Login and register are for signed-out devices only. */
export async function requireSignedOut(queryClient: QueryClient) {
  const session = await queryClient.query({ ...familySessionQuery, ...cachedOrFetched });
  if (session) throw redirect({ to: "/" });
}

/** Register is also hidden while registration is closed. */
export async function requireRegistrationOpen(queryClient: QueryClient) {
  // Always ask: registration closes the moment the first family exists.
  const status = await queryClient.query({ ...registrationQuery, staleTime: 0 });
  if (!status?.open) throw redirect({ to: "/login" });
}

interface FamilySessionOptions {
  /**
   * Start loading `Me` alongside the session when the target screen needs a
   * profile, so bootstrap is one round trip, not two in sequence.
   */
  prefetchMe: boolean;
}

export async function requireFamilySession(
  queryClient: QueryClient,
  { prefetchMe }: FamilySessionOptions,
) {
  if (prefetchMe) {
    // Errors surface when the profile guard reads the same query.
    queryClient.query({ ...meQuery, ...cachedOrFetched }).catch(() => undefined);
  }
  const session = await queryClient.query({ ...familySessionQuery, ...cachedOrFetched });
  if (!session) throw redirect({ to: "/login" });
  return { familySession: session };
}

export async function requireProfileSession(queryClient: QueryClient) {
  let me;
  try {
    me = await queryClient.query({ ...meQuery, ...cachedOrFetched });
  } catch (error) {
    if (missingSession(error) === "family") throw redirect({ to: "/login" });
    throw error;
  }
  if (!me) throw redirect({ to: "/picker" });
  return { me };
}

/** For screens behind a right, e.g. family settings. */
export async function requirePermission(queryClient: QueryClient, permission: Permission) {
  const { me } = await requireProfileSession(queryClient);
  if (!me.permissions.includes(permission)) throw redirect({ to: "/" });
}
