import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { Profile, CreateProfileRequest, UpdateProfileRequest, VerifyPinRequest } from '../types'

export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profile.list,
    queryFn: () => api.get<Profile[]>('/profiles'),
  })
}

export function useActiveProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: () => {
      const storedProfile = localStorage.getItem('activeProfile')
      if (!storedProfile) {
        return Promise.reject(new Error('No active profile'))
      }
      return Promise.resolve(JSON.parse(storedProfile) as Profile)
    },
    staleTime: Infinity,
    retry: false,
  })
}

export function useProfile(id: number) {
  return useQuery({
    queryKey: queryKeys.profile.detail(id),
    queryFn: () => api.get<Profile>(`/profiles/${id}`),
    enabled: !!id,
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProfileRequest) => api.post<Profile>('/profiles', data),
    onSuccess: (newProfile) => {
      queryClient.setQueryData(queryKeys.profile.detail(newProfile.id), newProfile)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.list })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => api.put<Profile>(`/profiles/${data.id}`, data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.profile.detail(updatedProfile.id), updatedProfile)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.list })

      const activeProfile = queryClient.getQueryData<Profile>(queryKeys.profile.current)
      if (activeProfile && activeProfile.id === updatedProfile.id) {
        queryClient.setQueryData(queryKeys.profile.current, updatedProfile)
        localStorage.setItem('activeProfile', JSON.stringify(updatedProfile))
      }
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/profiles/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.profile.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.list })

      const activeProfile = queryClient.getQueryData<Profile>(queryKeys.profile.current)
      if (activeProfile && activeProfile.id === deletedId) {
        localStorage.removeItem('activeProfile')
        queryClient.removeQueries({ queryKey: queryKeys.profile.current })
      }
    },
  })
}

export function useSwitchProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, pin }: { profileId: number; pin?: string }) =>
      api.post<{ profile: Profile }>('/profiles/switch', { profileId, pin }),
    onSuccess: (response) => {
      const profile = response.profile
      queryClient.setQueryData(queryKeys.profile.current, profile)
      localStorage.setItem('activeProfile', JSON.stringify(profile))
    },
  })
}

export function useVerifyPin() {
  return useMutation({
    mutationFn: (data: VerifyPinRequest) =>
      api.post<{ verified: boolean }>('/profiles/verify-pin', data),
  })
}
