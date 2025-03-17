import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { Profile, CreateProfileRequest, UpdateProfileRequest } from '../types'

export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profile.list,
    queryFn: () => api.get<Profile[]>('/profiles'),
  })
}

export function useProfile(id: number) {
  return useQuery({
    queryKey: queryKeys.profile.detail(id),
    queryFn: () => api.get<Profile>(`/profiles/${id}`),
    enabled: !!id,
  })
}

export function useActiveProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: () => {
      const profileJson = localStorage.getItem('activeProfile')
      if (!profileJson) {
        throw new Error('No active profile')
      }
      return JSON.parse(profileJson) as Profile
    },
    staleTime: Infinity,
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProfileRequest) => api.post<Profile>('/profiles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.list,
      })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => {
      if (data.image) {
        const formData = new FormData()
        formData.append('image', data.image)

        const profileData = {
          name: data.name,
          role: data.role,
          pin: data.pin,
          currentPin: data.currentPin,
        }

        formData.append('profileData', JSON.stringify(profileData))
        return api.put<Profile>(`/profiles/${data.id}`, formData)
      }

      return api.put<Profile>(`/profiles/${data.id}`, data)
    },
    onSuccess: (updatedProfile, variables) => {
      queryClient.setQueryData(queryKeys.profile.detail(variables.id), updatedProfile)

      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.list,
      })

      const activeProfile = localStorage.getItem('activeProfile')
      if (activeProfile) {
        const parsed = JSON.parse(activeProfile)
        if (parsed.id === updatedProfile.id) {
          localStorage.setItem('activeProfile', JSON.stringify(updatedProfile))
          queryClient.setQueryData(queryKeys.profile.current, updatedProfile)
        }
      }
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/profiles/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.profile.detail(deletedId),
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.list,
      })

      const activeProfile = localStorage.getItem('activeProfile')
      if (activeProfile) {
        const parsed = JSON.parse(activeProfile)
        if (parsed.id === deletedId) {
          localStorage.removeItem('activeProfile')
        }
      }
    },
  })
}

export function useRestoreProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.put<Profile>(`/profiles/${id}/restore`, { id }),
    onSuccess: (restoredProfile) => {
      queryClient.setQueryData(queryKeys.profile.detail(restoredProfile.id), restoredProfile)
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.list,
      })
    },
  })
}
