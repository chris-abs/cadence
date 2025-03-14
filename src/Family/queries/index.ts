import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { ApiError } from '@/Global/types'
import { User } from '@/User/types'
import {
  Family,
  CreateFamilyRequest,
  JoinFamilyRequest,
  CreateInviteRequest,
  FamilyInvite,
  Module,
} from '../types'
import { UpdateFamilyData } from '../schemas'

export function useFamily(id: number | undefined) {
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

export function useFamilyMembers(familyId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.family.members(familyId ?? 0),
    queryFn: () => api.get<User[]>(`/families/${familyId}/members`),
    enabled: !!familyId && familyId > 0,
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

      queryClient.invalidateQueries({
        queryKey: queryKeys.family.current,
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

export function useInviteDetails(token?: string) {
  return useQuery({
    queryKey: ['family', 'invite', token],
    queryFn: () => api.get<FamilyInvite>(`/families/invites/${token}`),
    enabled: !!token,
    retry: false,
  })
}

export function useUpdateFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: number; data: UpdateFamilyData }) =>
      api.put<Family>(`/families/${familyId}`, data),
    onSuccess: (updatedFamily) => {
      queryClient.setQueryData(queryKeys.family.detail(updatedFamily.id), updatedFamily)

      queryClient.setQueryData(queryKeys.family.current, updatedFamily)

      queryClient.invalidateQueries({
        queryKey: ['family'],
      })
    },
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
