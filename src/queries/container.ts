import { useQuery } from '@tanstack/react-query'
import type { Container } from '@/types/container'
import { apiRequest } from '@/utils/api'

async function fetchContainer(id: number): Promise<Container> {
  return apiRequest<Container>(`/containers/${id}`)
}

export function useContainer(id: number) {
  return useQuery({
    queryKey: ['container', id],
    queryFn: () => fetchContainer(id),
    enabled: !!id,
  })
}
