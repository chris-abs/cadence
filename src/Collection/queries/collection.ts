import { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/Global/lib/queryKeys'
import { api } from '@/Global/utils/api'
import { EntityType } from '../types/collection'

export async function createCollectionEntity(
  type: EntityType,
  data: { name: string },
  queryClient: QueryClient,
): Promise<{ id: number }> {
  const response = await api.post<{ id: number }>(`/${type}s`, data)
  if (type === 'tag') {
    queryClient.invalidateQueries({ queryKey: queryKeys.tags.list })
  } else {
    queryClient.invalidateQueries({ queryKey: [type + 's'] })
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.recent })
  return response
}

export async function deleteCollectionEntity(type: EntityType, id: number): Promise<void> {
  await api.delete(`/${type}s/${id}`)
  const queryClient = new QueryClient()
  if (type === 'tag') {
    queryClient.invalidateQueries({ queryKey: queryKeys.tags.list })
    queryClient.invalidateQueries({ queryKey: queryKeys.tags.detail(id) })
  } else {
    queryClient.invalidateQueries({ queryKey: [type + 's'] })
    queryClient.invalidateQueries({ queryKey: [type + 's', id] })
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.recent })
}
