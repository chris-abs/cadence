import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
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
    queryFn: () => api.get<Workspace[]>('/workspaces'),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.recent })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.recent })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/workspaces/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.workspaces.detail(deletedId) })
      queryClient.setQueryData(queryKeys.workspaces.list, (old: Workspace[] = []) => {
        return old.filter((workspace) => workspace.id !== deletedId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.recent })
    },
  })
}
