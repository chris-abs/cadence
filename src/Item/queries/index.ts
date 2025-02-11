import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { invalidateQueries } from '@/Global/utils/queryInvalidation'
import { Tag } from '@/Tag/types'
import { Item } from '../types'
import { CreateItemData, UpdateItemData } from '../schemas'

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
    onSuccess: (newItem, variables) => {
      queryClient.setQueryData(queryKeys.items.list, (old: Item[] = []) => {
        return [...old, newItem]
      })

      if (variables.containerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.containers.detail(variables.containerId),
        })

        queryClient.refetchQueries({
          queryKey: queryKeys.containers.list,
          exact: true,
        })
      }

      if (variables.tagNames?.length) {
        queryClient.refetchQueries({
          queryKey: queryKeys.tags.list,
          exact: true,
        })

        const tags = queryClient.getQueryData<Tag[]>(queryKeys.tags.list)
        variables.tagNames.forEach((tagName) => {
          const tag = tags?.find((t) => t.name === tagName)
          if (tag) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.tags.detail(tag.id),
            })
          }
        })
      }

      invalidateQueries(queryClient, {
        lists: ['items'],
      })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateItemData) => {
      const formData = new FormData()
      formData.append('itemData', JSON.stringify(data))

      if (data.images?.length) {
        data.images.forEach((file) => formData.append('images', file))
      }

      return api.put<Item>(`/items/${data.id}`, formData)
    },
    onSuccess: (updatedItem, variables) => {
      queryClient.setQueryData(queryKeys.items.detail(variables.id), updatedItem)

      queryClient.setQueryData(queryKeys.items.list, (old: Item[] = []) => {
        return old.map((item) => (item.id === variables.id ? updatedItem : item))
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.containers.list,
        exact: true,
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.tags.list,
        exact: true,
      })

      invalidateQueries(queryClient, {
        lists: ['items'],
      })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/items/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.items.detail(deletedId),
      })

      queryClient.setQueryData(queryKeys.items.list, (old: Item[] = []) => {
        return old.filter((item) => item.id !== deletedId)
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.containers.list,
        exact: true,
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.tags.list,
        exact: true,
      })

      invalidateQueries(queryClient, {
        lists: ['items'],
      })
    },
  })
}
