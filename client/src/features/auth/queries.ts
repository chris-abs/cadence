import { queryOptions, useQuery } from "@tanstack/react-query";
import { api, ApiError, type components, type MissingSession, unwrap } from "@/lib/api";

export type FamilySession = components["schemas"]["FamilySession"];
export type Me = components["schemas"]["Me"];
export type ProfileSummary = components["schemas"]["ProfileSummary"];

const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const authKeys = {
  all: ["auth"] as const,
  registration: ["auth", "registration"] as const,
  session: ["auth", "session"] as const,
  me: ["auth", "me"] as const,
  profiles: ["auth", "profiles"] as const,
};

/**
 * A missing session is an answer, not a failure: resolve it to `null` so the
 * guards can route on data. Every other error still throws.
 */
async function nullWhenMissing<T>(session: MissingSession, request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.missingSession === session) return null;
    throw error;
  }
}

export const registrationQuery = queryOptions({
  queryKey: authKeys.registration,
  queryFn: ({ signal }) => unwrap(api.GET("/auth/registration", { signal })),
  staleTime: 5 * MINUTE,
});

/** This device's family session and picker, or `null` when the device is signed out. */
export const familySessionQuery = queryOptions({
  queryKey: authKeys.session,
  queryFn: ({ signal }) => nullWhenMissing("family", unwrap(api.GET("/auth/session", { signal }))),
  // Changes only on sign-in/out, which write the cache directly; a 401 elsewhere clears it.
  staleTime: 5 * MINUTE,
});

/**
 * The active profile and its rights, or `null` when no profile is selected.
 * Throws `family_session_required` when the device is signed out, which the
 * session guard turns into a trip to the login screen.
 */
export const meQuery = queryOptions({
  queryKey: authKeys.me,
  queryFn: ({ signal }) => nullWhenMissing("profile", unwrap(api.GET("/me", { signal }))),
  // Rights can change at any time (spec §5); refetched on focus once this old.
  staleTime: 30 * SECOND,
});

/** The picker's profiles. Short-lived: lockouts and other devices change them. */
export const profilesQuery = queryOptions({
  queryKey: authKeys.profiles,
  queryFn: async ({ signal }) => (await unwrap(api.GET("/profiles", { signal }))).profiles,
  staleTime: 10 * SECOND,
});

export function useRegistrationStatus() {
  return useQuery(registrationQuery);
}

export function useFamilySession() {
  return useQuery(familySessionQuery);
}

export function useMe() {
  return useQuery(meQuery);
}

/**
 * The active profile's `Me`, for screens inside the app shell: the profile
 * layout renders them only once `Me` is loaded.
 */
export function useActiveMe(): Me {
  const { data } = useMe();
  if (!data) throw new Error("useActiveMe is used outside the profile session layout");
  return data;
}

export function useProfiles() {
  return useQuery(profilesQuery);
}
