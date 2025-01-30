import { Box, FolderOpen, Package, Tags } from 'lucide-react'

import { EntityCard } from '@/Collection/components/molecules/entity'
import { RecentResponse } from '@/Collection/types'

interface EntityListProps {
  recentEntities?: RecentResponse
}

export function EntityList({ recentEntities }: EntityListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <EntityCard
        type="workspace"
        icon={Box}
        count={recentEntities?.workspaces.total}
        recentItems={recentEntities?.workspaces.recent}
      />
      <EntityCard
        type="container"
        icon={FolderOpen}
        count={recentEntities?.containers.total}
        recentItems={recentEntities?.containers.recent}
      />
      <EntityCard
        type="item"
        icon={Package}
        count={recentEntities?.items.total}
        recentItems={recentEntities?.items.recent}
      />
      <EntityCard
        type="tag"
        icon={Tags}
        count={recentEntities?.tags.total}
        recentItems={recentEntities?.tags.recent}
      />
    </div>
  )
}
