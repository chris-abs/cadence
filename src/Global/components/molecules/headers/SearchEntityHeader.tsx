import React from 'react'
import { Search, X, Plus } from 'lucide-react'

import { Button } from '@/Global/components/atoms'
import { Input } from '@/Global/components/atoms'
import { EntityType } from '@/Collection/types'
import { H1 } from '../Typography'

interface CollapsibleSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const CollapsibleSearch = ({
  value,
  onChange,
  placeholder = 'Search...',
}: CollapsibleSearchProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleCollapse = () => {
    setIsExpanded(false)
    onChange('')
  }

  if (!isExpanded) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExpand}>
        <Search className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="relative w-64 transition-all duration-200">
      <Input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-4 pr-16"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-12 top-0 h-10 px-2 hover:text-foreground text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCollapse}
        className="absolute right-0 top-0 h-9 w-9"
      >
        <Search className="h-3 w-3" />
      </Button>
    </div>
  )
}

interface SearchEntityHeaderProps {
  title: string
  entityType: EntityType
  onAdd?: () => void
  searchValue: string
  onSearchChange: (value: string) => void
}

export function SearchEntityHeader({
  title,
  entityType,
  onAdd,
  searchValue,
  onSearchChange,
}: SearchEntityHeaderProps) {
  return (
    <section className="bg-background border rounded-xl px-4 py-2 md:px-6">
      <div className="flex shrink-0 items-center justify-between">
        <H1>{title}</H1>
        <div className="flex items-center gap-2">
          <CollapsibleSearch
            value={searchValue}
            onChange={onSearchChange}
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

const entityAddRelations: Record<EntityType, EntityType | null> = {
  workspace: 'container',
  container: 'item',
  item: 'tag',
  tag: 'item',
}
