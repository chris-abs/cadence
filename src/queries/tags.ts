import { Tag } from '@/types'
import { apiRequest } from '@/utils/api'
import { useQuery } from '@tanstack/react-query'

async function fetchTag(id: number): Promise<Tag> {
  return apiRequest<Tag>(`/tags/${id}`)
}

export function useTag(id: number) {
  return useQuery({
    queryKey: ['tag', id],
    queryFn: () => fetchTag(id),
    enabled: !!id,
  })
}
