import { useQuery } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import type { SearchResponse } from '@/Global/types/search'
import type { Container } from '@/Container/types'
import type { Item } from '@/Item/types'
import type { Tag } from '@/Tag/types'
import type { Workspace } from '@/Workspace/types'

export function useSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => api.get<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useWorkspaceSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.workspaces.search(query),
    queryFn: () => api.get<Workspace[]>(`/search/workspaces?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useContainerSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.containers.search(query),
    queryFn: () => api.get<Container[]>(`/search/containers?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useItemSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.items.search(query),
    queryFn: () => api.get<Item[]>(`/search/items?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useTagSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tags.search(query),
    queryFn: () => api.get<Tag[]>(`/search/tags?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}
