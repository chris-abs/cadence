import { useQuery } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { RecentResponse } from '../types'

export function useRecentEntities() {
  return useQuery({
    queryKey: queryKeys.recent,
    queryFn: () => api.get<RecentResponse>('/recent'),
    staleTime: Infinity,
  })
}
