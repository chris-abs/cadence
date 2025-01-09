import { useQuery } from '@tanstack/react-query'
import { Tag } from '@/types'
import { api } from '@/utils/api'

export function useTag(id: number) {
  return useQuery({
    queryKey: ['tag', id],
    queryFn: () => api.get<Tag>(`/tags/${id}`),
    enabled: !!id,
  })
}
