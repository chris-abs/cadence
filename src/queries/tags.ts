import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Tag } from '@/types'
import { api } from '@/utils/api'
import { CreateTagData } from '@/schemas/tag'

export function useTag(id: number) {
  return useQuery({
    queryKey: ['tag', id],
    queryFn: () => api.get<Tag>(`/tags/${id}`),
    enabled: !!id,
  })
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<Tag[]>('/tags'),
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTagData) => api.post<Tag>('/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
