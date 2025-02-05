import { useQuery } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import type {
  DashboardContainerSearchResult,
  DashboardItemSearchResult,
  DashboardTagSearchResult,
  DashboardWorkspaceSearchResult,
  SearchResponse,
} from '@/Global/types/search'

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
    queryFn: () =>
      api.get<DashboardWorkspaceSearchResult[]>(
        `/search/workspaces?q=${encodeURIComponent(query)}`,
      ),
    enabled: options?.enabled && !!query,
  })
}

export function useContainerSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.containers.search(query),
    queryFn: () =>
      api.get<DashboardContainerSearchResult[]>(
        `/search/containers?q=${encodeURIComponent(query)}`,
      ),
    enabled: options?.enabled && !!query,
  })
}

export function useItemSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.items.search(query),
    queryFn: () =>
      api.get<DashboardItemSearchResult[]>(`/search/items?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useTagSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tags.search(query),
    queryFn: () =>
      api.get<DashboardTagSearchResult[]>(`/search/tags?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useTaggedItemSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.taggedItems.search(query),
    queryFn: () =>
      api.get<DashboardItemSearchResult[]>(`/search/tagged-items?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}
