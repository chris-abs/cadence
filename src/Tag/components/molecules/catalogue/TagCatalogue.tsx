import { useState } from 'react'
import { Check, Tags } from 'lucide-react'

import { Button, Input, ScrollArea, ToggleGroup, ToggleGroupItem } from '@/Global/components/atoms'
import { NoContent } from '@/Global/components/molecules'
import { useSearch } from '@/Global/queries/search'
import { cn } from '@/Global/lib'
import { useItems } from '@/Item/queries'
import { useUpdateItemTags } from '@/Tag/queries'
import { Tag } from '@/Tag/types'

interface TagCatalogueProps {
  tags: Tag[]
  isLoading: boolean
}

export function TagCatalogue({ tags, isLoading: isTagsPropLoading }: TagCatalogueProps) {
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
    <div className="flex flex-col space-y-6">
      <section className="bg-contrast-accent rounded-md p-4">
        <ScrollArea className="w-full">
          <div className="flex gap-2 min-w-fit pb-2">
            <ToggleGroup
              type="multiple"
              value={selectedTagIds}
              onValueChange={handleTagToggle}
              className="flex flex-wrap gap-2 items-center"
            >
              {tags?.map((tag) => (
                <ToggleGroupItem
                  key={tag.id}
                  value={String(tag.id)}
                  className={cn(
                    'h-7 px-2 text-sm rounded-md',
                    'flex items-center gap-2 whitespace-nowrap',
                    'bg-background hover:bg-accent/50',
                    'transition-colors duration-200',
                    'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                  )}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.colour || 'currentColor' }}
                  />
                  {tag.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </ScrollArea>
      </section>

      <section className="bg-contrast-accent rounded-md p-4">
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button
            variant="default"
            onClick={handleSave}
            disabled={selectedTagIds.length === 0 || selectedItemIds.size === 0}
          >
            Save Changes
          </Button>
        </div>
      </section>

      <section className="flex-1 bg-contrast-accent rounded-md p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : displayedItems.length === 0 ? (
          <NoContent icon={Tags} message="No items found." />
        ) : (
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2 pr-4">
              {displayedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemToggle(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between',
                    'rounded-md border p-4',
                    'bg-background hover:bg-accent/50',
                    'transition-colors duration-200',
                    selectedItemIds.has(item.id) && 'border-primary',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {selectedItemIds.has(item.id) && <Check className="h-4 w-4 text-primary" />}
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {item.tags?.length || 0} tags
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </section>
    </div>
  )
}
