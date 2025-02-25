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

export function useFamily(id: number) {
  return useQuery({
    queryKey: queryKeys.family.detail(id),
    queryFn: () => api.get<Family>(`/families/${id}`),
    enabled: id > 0,
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
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<User>(queryKeys.user)

  return user?.familyId
}
