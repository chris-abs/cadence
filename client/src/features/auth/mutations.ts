import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api, type components, unwrap } from "@/lib/api";
import { authKeys } from "./queries";
import { forgetFamily, forgetProfile, removeProfileData } from "./session-cache";

type Schemas = components["schemas"];
export type LoginRequest = Schemas["LoginRequest"];
export type RegisterRequest = Schemas["RegisterRequest"];
export type SelectProfileRequest = Schemas["SelectProfileRequest"];

/** Signs the device in to a family, then shows the picker. */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (body: LoginRequest) => unwrap(api.POST("/auth/login", { body })),
    onSuccess: async (session) => {
      // Login replaces this device's sessions, so no profile is active any more.
      forgetFamily(queryClient);
      queryClient.setQueryData(authKeys.session, session);
      queryClient.setQueryData(authKeys.profiles, session.profiles);
      await navigate({ to: "/picker" });
    },
  });
}

/** Creates the family and its owner; the device lands in the app as the owner. */
export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (body: RegisterRequest) => unwrap(api.POST("/auth/register", { body })),
    onSuccess: async (me) => {
      forgetFamily(queryClient);
      // The new family session is loaded by the route guard; the owner is already active.
      queryClient.removeQueries({ queryKey: authKeys.session });
      void queryClient.invalidateQueries({ queryKey: authKeys.registration });
      queryClient.setQueryData(authKeys.me, me);
      await navigate({ to: "/" });
    },
  });
}

/** Selects a profile (with its PIN, if it has one) and opens the app. */
export function useSelectProfile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (body: SelectProfileRequest) => unwrap(api.POST("/auth/profile-session", { body })),
    onSuccess: async (me) => {
      removeProfileData(queryClient);
      queryClient.setQueryData(authKeys.me, me);
      await navigate({ to: "/" });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: authKeys.profiles }),
  });
}

/** Locks the device back to the picker; used by "Switch profile" and auto-lock. */
export function useLock() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => unwrap(api.DELETE("/auth/profile-session")),
    onSuccess: async () => {
      forgetProfile(queryClient);
      await navigate({ to: "/picker" });
    },
  });
}

/** Signs this device out of the family. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => unwrap(api.POST("/auth/logout")),
    onSuccess: async () => {
      forgetFamily(queryClient);
      await navigate({ to: "/login" });
    },
  });
}
