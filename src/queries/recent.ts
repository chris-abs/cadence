import { useQuery } from '@tanstack/react-query'
import type { RecentResponse } from '@/types/collection'
import { api } from '@/utils/api'
import { queryKeys } from '@/lib/queryKeys'

export function useRecentEntities() {
  return useQuery({
    queryKey: queryKeys.recent,
    queryFn: () => api.get<RecentResponse>('/recent'),
  })
}
