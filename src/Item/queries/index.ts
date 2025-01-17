import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { Container } from '@/Container/types'
import { CreateItemData, UpdateItemData } from '../schemas'
import { Item } from '../types'

export function useItem(id: number) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: async () => {
      const item = await api.get<Item>(`/items/${id}`)
      return {
        ...item,
        queryKey: [queryKeys.items.detail(id), item.container?.id],
      }
    },
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
      if (newItem.containerId) {
        queryClient.setQueryData(
          queryKeys.containers.detail(newItem.containerId),
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
    mutationFn: (data: UpdateItemData) => {
      console.log('Mutation payload:', data)
      return api.put<Item>(`/items/${data.id}`, data)
    },
    onSuccess: (updatedItem) => {
      console.log('Updated item response:', updatedItem)
      queryClient.setQueryData(queryKeys.items.detail(updatedItem.id), updatedItem)
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list })
      queryClient.invalidateQueries({ queryKey: queryKeys.recent })

      if (updatedItem.containerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.containers.detail(updatedItem.containerId),
        })
      }
    },
  })
}
