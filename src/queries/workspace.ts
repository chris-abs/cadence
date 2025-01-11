import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Workspace } from '@/types/workspace'
import { api } from '@/utils/api'
import type { CreateWorkspaceData } from '@/schemas/workspace'

export function useWorkspace(id: number) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: () => api.get<Workspace>(`/workspaces/${id}`),
    enabled: !!id,
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateWorkspaceData) => api.post<Workspace>('/workspaces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent'] })
    },
  })
}
