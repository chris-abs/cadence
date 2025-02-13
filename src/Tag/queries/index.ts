import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { invalidateQueries } from '@/Global/utils/queryInvalidation'
import { Item } from '@/Item/types'
import { Tag } from '../types'
import { CreateTagData, UpdateTagData, UpdateItemTagsData, BulkAssignTagsData } from '../schemas'

export function useTag(id: number) {
  return useQuery({
    queryKey: queryKeys.tags.detail(id),
    queryFn: () => api.get<Tag>(`/tags/${id}`),
    enabled: !!id,
  })
}

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags.list,
    queryFn: () => api.get<Tag[]>('/tags'),
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTagData) => api.post<Tag>('/tags', data),
    onSuccess: (newTag) => {
      queryClient.setQueryData(queryKeys.tags.list, (old: Tag[] = []) => {
        return [...old, newTag]
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.items.list,
        exact: true,
      })

      invalidateQueries(queryClient, {
        lists: ['tags'],
      })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateTagData) => api.put<Tag>(`/tags/${data.id}`, data),
    onSuccess: (updatedTag, variables) => {
      queryClient.setQueryData(queryKeys.tags.detail(variables.id), updatedTag)

      queryClient.setQueryData(queryKeys.tags.list, (old: Tag[] = []) => {
        return old.map((tag) => (tag.id === variables.id ? updatedTag : tag))
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.items.list,
        exact: true,
      })

      invalidateQueries(queryClient, {
        lists: ['tags'],
      })
    },
  })
}

export function useUpdateItemTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, tagIds }: UpdateItemTagsData) =>
      api.put<Item>(`/items/${itemId}/tags`, { tagIds }),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(queryKeys.items.detail(updatedItem.id), updatedItem)

      queryClient.setQueryData(queryKeys.items.list, (old: Item[] = []) => {
        return old.map((item) => (item.id === updatedItem.id ? updatedItem : item))
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

export function useBulkAssignTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkAssignTagsData) => api.post<void>('/tags/bulk-assign', data),
    onSuccess: (_, variables) => {
      variables.itemIds.forEach((itemId) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.items.detail(itemId),
        })
      })

      variables.tagIds.forEach((tagId) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tags.detail(tagId),
        })
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.items.list,
        exact: true,
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.tags.list,
        exact: true,
      })

      invalidateQueries(queryClient, {
        lists: ['items', 'tags'],
      })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/tags/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.tags.detail(deletedId),
      })

      queryClient.setQueryData(queryKeys.tags.list, (old: Tag[] = []) => {
        return old.filter((tag) => tag.id !== deletedId)
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.items.list,
        exact: true,
      })

      invalidateQueries(queryClient, {
        lists: ['tags'],
      })
    },
  })
}
