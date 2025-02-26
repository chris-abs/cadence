import { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/Global/lib/queryKeys'
import { api } from '@/Global/utils/api'
import { EntityType } from '../types'

export async function createCollectionEntity(
  type: EntityType,
  data: { name: string },
  queryClient: QueryClient,
): Promise<{ id: number }> {
  const response = await api.post<{ id: number }>(`/${type}s`, data)

  switch (type) {
    case 'workspace':
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list })
      break
    case 'container':
      queryClient.invalidateQueries({ queryKey: queryKeys.containers.list })
      break
    case 'item':
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list })
      break
    case 'tag':
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.list })
      break
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.recent })

  return response
}

export async function deleteCollectionEntity(
  type: EntityType,
  id: number,
  queryClient: QueryClient,
): Promise<void> {
  await api.delete(`/${type}s/${id}`)

  queryClient.removeQueries({
    queryKey: queryKeys[`${type}s`].detail(id),
  })

  switch (type) {
    case 'workspace':
      queryClient.refetchQueries({
        queryKey: queryKeys.containers.list,
        exact: true,
      })
      queryClient.invalidateQueries({
        queryKey: ['containers'],
      })
      break

    case 'container':
      queryClient.refetchQueries({
        queryKey: queryKeys.workspaces.list,
        exact: true,
      })
      queryClient.refetchQueries({
        queryKey: queryKeys.items.list,
        exact: true,
      })
      queryClient.invalidateQueries({
        queryKey: ['items'],
      })
      break

    case 'item':
      queryClient.refetchQueries({
        queryKey: queryKeys.containers.list,
        exact: true,
      })
      queryClient.refetchQueries({
        queryKey: queryKeys.tags.list,
        exact: true,
      })
      break

    case 'tag':
      queryClient.refetchQueries({
        queryKey: queryKeys.items.list,
        exact: true,
      })
      break
  }

  queryClient.refetchQueries({
    queryKey: queryKeys[`${type}s`].list,
    exact: true,
  })

  queryClient.refetchQueries({
    queryKey: queryKeys.recent,
    exact: true,
  })
}
