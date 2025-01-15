import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { Container } from '@/Container/types'
import { CreateItemData, UpdateItemData } from '../schemas'
import { Item } from '../types'

export function useItem(id: number) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: () => api.get<Item>(`/items/${id}`),
    enabled: !!id,
  })
}

export function useItems() {
  return useQuery({
    queryKey: queryKeys.items.list,
    queryFn: () => api.get<Item[]>('/items'),
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateItemData) => api.post<Item>('/items', data),
    onSuccess: (newItem) => {
      queryClient.setQueryData(queryKeys.items.list, (old: Item[] = []) => {
        return [...old, newItem]
      })
      if (newItem.container_id) {
        queryClient.setQueryData(
          queryKeys.containers.detail(newItem.container_id),
          (oldContainer: Container | undefined) => {
            if (!oldContainer) return oldContainer
            return {
              ...oldContainer,
              items: [...(oldContainer.items || []), newItem],
            }
          },
        )
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.recent })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateItemData) => api.put<Item>(`/items/${data.id}`, data),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(queryKeys.items.detail(updatedItem.id), updatedItem)
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list })
      queryClient.invalidateQueries({ queryKey: queryKeys.recent })
    },
  })
}
