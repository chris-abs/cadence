import { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/Global/lib/queryKeys'

export type EntityType = 'workspaces' | 'containers' | 'items' | 'tags'

interface EntityIds {
  workspaceId?: number
  containerIds?: number[]
  itemIds?: number[]
  tagIds?: number[]
}

interface InvalidationConfig {
  exactIds?: EntityIds
  lists?: EntityType[]
}

interface EntityInvalidationMap {
  [key: string]: {
    dependencies: EntityType[]
    requiresListUpdate?: boolean
  }
}

const entityInvalidationRules: EntityInvalidationMap = {
  workspaces: {
    dependencies: ['containers'],
    requiresListUpdate: true,
  },
  containers: {
    dependencies: ['items', 'workspaces'],
    requiresListUpdate: true,
  },
  items: {
    dependencies: ['containers', 'tags'],
    requiresListUpdate: true,
  },
  tags: {
    dependencies: ['items'],
    requiresListUpdate: true,
  },
}

export function invalidateQueries(queryClient: QueryClient, config: InvalidationConfig) {
  const { exactIds, lists = [] } = config

  if (exactIds?.workspaceId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.workspaces.detail(exactIds.workspaceId),
      exact: true,
    })
  }

  if (exactIds?.containerIds?.length) {
    exactIds.containerIds.forEach((id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.containers.detail(id),
        exact: true,
      })
    })
  }

  if (exactIds?.itemIds?.length) {
    exactIds.itemIds.forEach((id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.detail(id),
        exact: true,
      })
    })
  }

  if (exactIds?.tagIds?.length) {
    exactIds.tagIds.forEach((id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags.detail(id),
        exact: true,
      })
    })
  }

  const listsToInvalidate = new Set<EntityType>(lists)

  lists.forEach((entityType) => {
    const rules = entityInvalidationRules[entityType]
    if (rules?.dependencies) {
      rules.dependencies.forEach((dep) => listsToInvalidate.add(dep))
    }
  })

  listsToInvalidate.forEach((listType) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys[listType].list,
      exact: true,
    })
  })

  queryClient.invalidateQueries({ queryKey: queryKeys.recent })
}
