import { useQuery } from '@tanstack/react-query'
import type { SearchResponse } from '@/types/search'
import { api } from '@/entity/Global/utils/api'
import { queryKeys } from '@/entity/Global/lib/queryKeys'

export function useSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => api.get<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}
