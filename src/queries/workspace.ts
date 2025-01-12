import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Workspace } from '@/types/workspace'
import { api } from '@/utils/api'
import type { CreateWorkspaceData } from '@/schemas/workspace'
import { queryKeys } from '@/lib/queryKeys'

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
