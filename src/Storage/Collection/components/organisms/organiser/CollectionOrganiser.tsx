import { EntityType } from '@/Storage/Collection/types'
import { useRecentEntities } from '@/Storage/Collection/queries'
import { EntitySearch, EntityList } from './sections'

interface CollectionOrganiserProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateEntity: (type: EntityType) => void
}

export function CollectionOrganiser({
  searchQuery,
  onSearchChange,
  onCreateEntity,
}: CollectionOrganiserProps) {
  const { data: recentEntities } = useRecentEntities()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <EntitySearch
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onCreateEntity={onCreateEntity}
      />
      <EntityList recentEntities={recentEntities} />
    </div>
  )
}
