import { Plus } from 'lucide-react'

import { Button } from '@/Global/components/atoms'
import { H1 } from '../Typography'
import { EntityType } from '@/Collection/types'
import { CollapsibleSearch } from './CollapsibleSearch'

const entityAddRelations: Record<EntityType, EntityType | null> = {
  workspace: 'container',
  container: 'item',
  item: 'tag',
  tag: 'item',
}
interface SearchEntityHeaderProps {
  title: string
  entityType: EntityType
  onAdd?: () => void
  searchValue: string
  onSearch: (value: string) => void
}

export function SearchEntityHeader({
  title,
  entityType,
  onAdd,
  searchValue,
  onSearch,
}: SearchEntityHeaderProps) {
  return (
    <section className="bg-background border rounded-xl px-4 py-2 md:px-6">
      <div className="flex shrink-0 items-center justify-between">
        <H1>{title}</H1>
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          <CollapsibleSearch
            value={searchValue}
            onSearch={onSearch}
            placeholder={`Search ${entityType}s...`}
          />
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {entityAddRelations[entityType] ? `Add ${entityAddRelations[entityType]}` : 'Add'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
