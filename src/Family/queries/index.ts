import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { User } from '@/User/types'
import {
  Family,
  CreateFamilyRequest,
  JoinFamilyRequest,
  CreateInviteRequest,
  FamilyInvite,
  Module,
} from '../types'
import { ApiError } from '@/Global/types'

export function useFamily(id: number | undefined) {
  console.log('useFamily called with id:', id)

  return useQuery({
    queryKey: queryKeys.family.detail(id || 0),
    queryFn: () => api.get<Family>(`/families/${id}`),
    enabled: id !== undefined && id > 0,
    retry: (failureCount, error) => {
      if ((error as ApiError)?.statusCode === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function useFamilyModules(familyId: number) {
  return useQuery({
    queryKey: queryKeys.family.modules(familyId),
    queryFn: () => api.get<Module[]>(`/families/${familyId}/modules`),
    enabled: familyId > 0,
  })
}

export function useCreateFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFamilyRequest) => api.post<Family>('/families', data),
    onSuccess: (family) => {
      queryClient.setQueryData(queryKeys.family.detail(family.id), family)

      queryClient.setQueryData(queryKeys.family.current, family)

      queryClient.invalidateQueries({
        queryKey: queryKeys.user,
      })
    },
  })
}

export function useJoinFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: JoinFamilyRequest) => api.post('/families/join', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user,
      })
    },
  })
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: number; data: CreateInviteRequest }) =>
      api.post<FamilyInvite>(`/families/${familyId}/invites`, data),
  })
}

export function useUpdateModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      familyId,
      moduleId,
      isEnabled,
    }: {
      familyId: number
      moduleId: string
      isEnabled: boolean
    }) => api.put(`/families/${familyId}/modules/${moduleId}`, { isEnabled }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.detail(variables.familyId),
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.family.modules(variables.familyId),
      })
    },
  })
}

export function useCurrentFamilyId(): number | undefined {
  const { data: user } = useQuery<User>({
    queryKey: queryKeys.user,
  })

  console.log('useCurrentFamilyId - user:', user)
  console.log('useCurrentFamilyId - familyId:', user?.familyId)

  return user?.familyId
}

export function useCurrentFamily() {
  const queryClient = useQueryClient()
  const familyId = useCurrentFamilyId()

  const result = useQuery<Family>({
    queryKey: queryKeys.family.current,
    queryFn: () => api.get<Family>(`/families/${familyId}`),
    enabled: !!familyId,
    retry: (failureCount, error) => {
      if ((error as ApiError)?.statusCode === 404) {
        return false
      }
      return failureCount < 3
    },
  })

  if (result.data && familyId) {
    queryClient.setQueryData(queryKeys.family.detail(familyId), result.data)
  }

  return result
}
