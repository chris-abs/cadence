import { useState } from 'react'

import { useSearch } from '@/Global/queries/search'
import { useItems } from '@/Item/queries'
import { useUpdateItemTags } from '@/Tag/queries'
import { Tag } from '@/Tag/types'
import { TagSelector, ItemList, ItemSearch } from './sections'

interface TagOrganiserProps {
  tags: Tag[]
  isLoading: boolean
}

export function TagOrganiser({ tags, isLoading: isTagsPropLoading }: TagOrganiserProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const { data: items, isLoading: isItemsLoading } = useItems()
  const { data: searchResults, isLoading: isSearching } = useSearch(searchQuery, {
    enabled: searchQuery.length > 0,
  })
  const updateItemTags = useUpdateItemTags()

  const displayedItems = searchQuery ? searchResults?.items || [] : items || []
  const isLoading = isTagsPropLoading || isItemsLoading || isSearching

  const handleTagToggle = (values: string[]) => {
    setSelectedTagIds(values)
  }

  const handleItemToggle = (itemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const handleSave = async () => {
    const tagIds = selectedTagIds.map(Number)
    const promises = Array.from(selectedItemIds).map((itemId) =>
      updateItemTags.mutateAsync({ itemId, tagIds }),
    )

    await Promise.all(promises)
    setSelectedItemIds(new Set())
    setSelectedTagIds([])
  }

  return (
    <div className="flex flex-col gap-6">
      <ItemSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <TagSelector
        onSave={handleSave}
        tags={tags}
        selectedTagIds={selectedTagIds}
        selectedItemIds={selectedItemIds}
        onTagToggle={handleTagToggle}
      />

      {/* TODO: fix type */}
      <ItemList
        items={displayedItems}
        selectedItemIds={selectedItemIds}
        onItemToggle={handleItemToggle}
        isLoading={isLoading}
      />
    </div>
  )
}
