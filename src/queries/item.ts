import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Item } from '@/types/item'
import { api } from '@/utils/api'
import type { CreateItemData } from '@/schemas/item'

export function useItem(id: number) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => api.get<Item>(`/items/${id}`),
    enabled: !!id,
  })
}

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => api.get<Item[]>('/items'),
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateItemData) => api.post<Item>('/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
