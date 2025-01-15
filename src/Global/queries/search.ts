import { useQuery } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { SearchResponse } from '../types'

export function useSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => api.get<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}
