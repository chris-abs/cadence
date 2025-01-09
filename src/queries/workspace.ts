import { useQuery } from '@tanstack/react-query'
import { Workspace } from '@/types/workspace'
import { api } from '@/utils/api'

export function useWorkspace(id: number) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: () => api.get<Workspace>(`/workspaces/${id}`),
    enabled: !!id,
  })
}
