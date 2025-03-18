import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { ApiError } from '@/Global/types/api'
import { Family, Module, UpdateFamilyData } from '../types'
import { useActiveProfile } from '@/Profile/queries'

export function useFamily() {
  return useQuery({
    queryKey: queryKeys.family.detail,
    queryFn: () => api.get<Family>('/family'),
    retry: (failureCount, error) => {
      if ((error as ApiError)?.statusCode === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function useFamilyModules() {
  return useQuery({
    queryKey: queryKeys.family.modules,
    queryFn: () => api.get<Module[]>('/family/modules'),
  })
}

export function useUpdateFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateFamilyData) => api.put<Family>('/family', data),
    onSuccess: (updatedFamily) => {
      queryClient.setQueryData(queryKeys.family.detail, updatedFamily)

      queryClient.invalidateQueries({
        queryKey: queryKeys.family.modules,
      })
    },
  })
}

export function useUpdateModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ moduleId, isEnabled }: { moduleId: string; isEnabled: boolean }) =>
      api.put(`/family/modules/${moduleId}`, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.modules,
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.family.detail,
      })
    },
  })
}

export function useDeleteFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete<{ message: string }>('/family/delete'),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: queryKeys.family.detail,
      })
      queryClient.removeQueries({
        queryKey: queryKeys.family.modules,
      })
    },
  })
}

export function useRestoreFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.put<{ message: string }>('/family/restore', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family,
      })
    },
  })
}

export function useCurrentFamily() {
  const { data: activeProfile } = useActiveProfile()

  return useQuery({
    queryKey: queryKeys.family.detail,
    queryFn: () => api.get<Family>('/family'),
    enabled: !!activeProfile,
    retry: (failureCount, error) => {
      if ((error as ApiError)?.statusCode === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}
