import { Item } from '@/types'
import { apiRequest } from '@/utils/api'
import { useQuery } from '@tanstack/react-query'

async function fetchItem(id: number): Promise<Item> {
  return apiRequest<Item>(`/items/${id}`)
}

export function useItem(id: number) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => fetchItem(id),
    enabled: !!id,
  })
}
