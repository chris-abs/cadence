import { Tags } from 'lucide-react'
import { ScrollArea } from '@/Global/components/atoms'
import { NoContent, Section } from '@/Global/components/molecules'
import { Item } from '@/Item/types'
import { SelectableItemCard } from '@/Item/components/atoms/card'

interface ItemListProps {
  items: Item[]
  selectedItemIds: Set<number>
  onItemToggle: (itemId: number) => void
  isLoading: boolean
}

export function ItemList({ items, selectedItemIds, onItemToggle, isLoading }: ItemListProps) {
  return (
    <Section>
      <div className="flex-1">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[200px] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <NoContent icon={Tags} message="No items found." />
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="grid grid-cols-3 gap-4 pr-4 pb-4">
              {items.map((item) => (
                <SelectableItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItemIds.has(item.id)}
                  onSelect={onItemToggle}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </Section>
  )
}
