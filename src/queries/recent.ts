import { useQuery } from '@tanstack/react-query'
import type { RecentResponse } from '@/types/collection'
import { api } from '@/utils/api'

export function useRecentEntities() {
  return useQuery({
    queryKey: ['recent'],
    queryFn: () => api.get<RecentResponse>('/recent'),
  })
}
