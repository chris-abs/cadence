import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { invalidateQueries } from '@/Global/utils/queryInvalidation'
import { Workspace } from '../types'
import { CreateWorkspaceData, UpdateWorkspaceData } from '../schemas'

export function useWorkspace(id: number) {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(id),
    queryFn: () => api.get<Workspace>(`/workspaces/${id}`),
    enabled: !!id,
  })
}

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces.list,
    queryFn: () => api.get<Workspace[]>('/workspaces?include=containers'),
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateWorkspaceData) => api.post<Workspace>('/workspaces', data),
    onSuccess: (newWorkspace) => {
      queryClient.setQueryData(queryKeys.workspaces.list, (old: Workspace[] = []) => {
        return [...old, newWorkspace]
      })

      invalidateQueries(queryClient, {
        lists: ['workspaces'],
      })
    },
  })
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateWorkspaceData) => api.put<Workspace>(`/workspaces/${data.id}`, data),
    onSuccess: (updatedWorkspace, variables) => {
      queryClient.setQueryData(queryKeys.workspaces.detail(variables.id), updatedWorkspace)

      queryClient.setQueryData(queryKeys.workspaces.list, (old: Workspace[] = []) => {
        return old.map((workspace) =>
          workspace.id === variables.id ? updatedWorkspace : workspace,
        )
      })

      invalidateQueries(queryClient, {
        exactIds: {
          workspaceId: variables.id,
          containerIds: updatedWorkspace.containers?.map((c) => c.id),
        },
        lists: ['workspaces'],
      })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const workspace = queryClient.getQueryData<Workspace>(queryKeys.workspaces.detail(id))
      const containerIds = workspace?.containers?.map((c) => c.id) || []

      await api.delete(`/workspaces/${id}`)
      return { containerIds }
    },
    onSuccess: (result, deletedId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.workspaces.detail(deletedId),
      })

      queryClient.setQueryData(queryKeys.workspaces.list, (old: Workspace[] = []) => {
        return old.filter((workspace) => workspace.id !== deletedId)
      })

      invalidateQueries(queryClient, {
        exactIds: {
          containerIds: result.containerIds,
        },
        lists: ['workspaces'],
      })
    },
  })
}
