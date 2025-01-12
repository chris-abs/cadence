import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Tag } from '@/types'
import { api } from '@/utils/api'
import { CreateTagData } from '@/schemas/tag'
import { queryKeys } from '@/lib/queryKeys'

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
      queryClient.invalidateQueries({ queryKey: queryKeys.recent })
    },
  })
}
