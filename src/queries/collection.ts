import { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { EntityType } from '@/types/collection'
import { api } from '@/utils/api'

export async function createCollectionEntity(
  type: EntityType,
  data: { name: string },
): Promise<{ id: number }> {
  const response = await api.post<{ id: number }>(`/${type}s`, data)
  const queryClient = new QueryClient()
  queryClient.invalidateQueries({ queryKey: [type + 's'] })
  queryClient.invalidateQueries({ queryKey: queryKeys.recent })
  return response
}
