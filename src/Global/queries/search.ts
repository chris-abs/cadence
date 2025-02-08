import { useQuery } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import type {
  ContainerSearchResponse,
  ItemSearchResponse,
  SearchResponse,
  TagSearchResponse,
  WorkspaceSearchResponse,
} from '@/Global/types/search'
import { Container } from '@/Container/types'

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
      api.get<WorkspaceSearchResponse[]>(`/search/workspaces?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useContainerSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.containers.search(query),
    queryFn: () =>
      api.get<ContainerSearchResponse[]>(`/search/containers?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useItemSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.items.search(query),
    queryFn: () => api.get<ItemSearchResponse[]>(`/search/items?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useTagSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tags.search(query),
    queryFn: () => api.get<TagSearchResponse[]>(`/search/tags?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useTaggedItemSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.taggedItems.search(query),
    queryFn: () =>
      api.get<ItemSearchResponse[]>(`/search/tagged-items?q=${encodeURIComponent(query)}`),
    enabled: options?.enabled && !!query,
  })
}

export function useContainerQRSearch(qrCode: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.containers.qr(qrCode),
    queryFn: () => api.get<Container>(`/search/containers/qr/${encodeURIComponent(qrCode)}`),
    enabled: options?.enabled && !!qrCode,
  })
}
