import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import {
  Family,
  FamilyInvite,
  CreateFamilyRequest,
  JoinFamilyRequest,
  CreateInviteRequest,
  ModuleID,
} from '@/Global/types/family'

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
    queryFn: () => api.get<Family['modules']>(`/families/${familyId}/modules`),
    enabled: familyId > 0,
  })
}

export function useCreateFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFamilyRequest) => api.post<Family>('/families', data),
    onSuccess: (newFamily) => {
      queryClient.setQueryData(queryKeys.family.detail(newFamily.id), newFamily)

      queryClient.invalidateQueries({
        queryKey: queryKeys.user,
      })
    },
  })
}

export function useJoinFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: JoinFamilyRequest) => api.post<{ success: boolean }>('/families/join', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user,
      })
    },
  })
}

export function useCreateInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: number; data: CreateInviteRequest }) =>
      api.post<FamilyInvite>(`/families/${familyId}/invites`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.invites(variables.familyId),
      })
    },
  })
}

interface UpdateModuleParams {
  familyId: number
  moduleId: ModuleID
  isEnabled: boolean
}

export function useUpdateModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: UpdateModuleParams) =>
      api.put(`/families/${params.familyId}/modules/${params.moduleId}`, {
        isEnabled: params.isEnabled,
      }),
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
