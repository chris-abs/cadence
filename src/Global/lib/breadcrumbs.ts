import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

import { queryKeys } from './queryKeys'
import { EntityType } from '../types'

function getQueryKeyForEntity(type: 'workspace' | 'container' | 'item' | 'tag', id: number) {
  switch (type) {
    case 'workspace':
      return queryKeys.workspaces.detail(id)
    case 'container':
      return queryKeys.containers.detail(id)
    case 'item':
      return queryKeys.items.detail(id)
    case 'tag':
      return queryKeys.tags.detail(id)
  }
}

type EntityData = {
  name: string
}

export function useBreadcrumbs() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const pathname = router.state.location.pathname

  if (pathname === '/') {
    return [{ label: 'Dashboard', href: '/' }]
  }

  const listMatch = pathname.match(/^\/(workspaces|containers|items|tags)$/)
  if (listMatch) {
    const entityType = listMatch[1] as EntityType
    return [
      { label: 'Dashboard', href: '/' },
      { label: entityType.charAt(0).toUpperCase() + entityType.slice(1) },
    ]
  }

  const detailMatch = pathname.match(/^\/(workspaces|containers|items|tags)\/(\d+)$/)
  if (detailMatch) {
    const entityTypePlural = detailMatch[1]
    const entityType = entityTypePlural.slice(0, -1) as 'workspace' | 'container' | 'item' | 'tag'
    const id = parseInt(detailMatch[2])
    const queryKey = getQueryKeyForEntity(entityType, id)
    const cachedData = queryClient.getQueryData<EntityData>(queryKey)

    return [
      { label: 'Dashboard', href: '/' },
      {
        label: entityTypePlural.charAt(0).toUpperCase() + entityTypePlural.slice(1),
        href: `/${entityTypePlural}`,
      },
      { label: cachedData?.name || id.toString() },
    ]
  }

  return [{ label: 'Home', href: '/' }]
}
