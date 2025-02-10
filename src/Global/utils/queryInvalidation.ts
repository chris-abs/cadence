import { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/Global/lib/queryKeys'

export type EntityType = 'workspaces' | 'containers' | 'items' | 'tags'

interface InvalidationConfig {
  lists: EntityType[]
}

export function invalidateQueries(queryClient: QueryClient, config: InvalidationConfig) {
  const { lists } = config

  lists.forEach((listType) => {
    queryClient.refetchQueries({
      queryKey: queryKeys[listType].list,
      exact: true,
    })
  })

  queryClient.invalidateQueries({ queryKey: queryKeys.recent })
}
