import { Item } from '@/types'
import { api } from '@/utils/api'
import { useQuery } from '@tanstack/react-query'

export function useItem(id: number) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => api.get<Item>(`/items/${id}`),
    enabled: !!id,
  })
}
