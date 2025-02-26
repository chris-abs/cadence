import { useState } from 'react'

import { useSearch } from '@/Global/queries/search'
import { useItems } from '@/Item/queries'
import { useAssignTags } from '@/Tag/queries'
import { Tag } from '@/Tag/types'
import { BulkAssignTagsData } from '@/Tag/schemas'
import { TagSelector, ItemList } from './sections'

interface TagOrganiserProps {
  tags: Tag[]
  isLoading: boolean
  searchQuery: string
}

export function TagOrganiser({
  tags,
  isLoading: isTagsPropLoading,
  searchQuery,
}: TagOrganiserProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())

  const { data: items, isLoading: isItemsLoading } = useItems()
  const { data: searchResults, isLoading: isSearching } = useSearch(searchQuery, {
    enabled: searchQuery.length > 0,
  })
  const assignTags = useAssignTags()

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
    try {
      const assignData: BulkAssignTagsData = {
        tagIds: selectedTagIds.map(Number),
        itemIds: Array.from(selectedItemIds),
      }

      await assignTags.mutateAsync(assignData)
      setSelectedItemIds(new Set())
      setSelectedTagIds([])
    } catch (error) {
      console.error('Failed to assign tags:', error)
    }
  }

  const handleCancel = () => {
    setSelectedItemIds(new Set())
    setSelectedTagIds([])
  }

  return (
    <div className="flex flex-col gap-6">
      <TagSelector
        onSave={handleSave}
        onCancel={handleCancel}
        tags={tags}
        selectedTagIds={selectedTagIds}
        selectedItemIds={selectedItemIds}
        onTagToggle={handleTagToggle}
        isUpdating={assignTags.isPending}
      />

      <ItemList
        items={displayedItems}
        selectedItemIds={selectedItemIds}
        onItemToggle={handleItemToggle}
        isLoading={isLoading}
      />
    </div>
  )
}
