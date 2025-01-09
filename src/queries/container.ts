import { useQuery } from '@tanstack/react-query'
import type { Container } from '@/types/container'
import { api } from '@/utils/api'

export function useContainer(id: number) {
  return useQuery({
    queryKey: ['container', id],
    queryFn: () => api.get<Container>(`/containers/${id}`),
    enabled: !!id,
  })
}
