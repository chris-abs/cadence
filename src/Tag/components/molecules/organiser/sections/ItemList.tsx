import { Check, Tags } from 'lucide-react'

import { ScrollArea } from '@/Global/components/atoms'
import { NoContent, Section } from '@/Global/components/molecules'
import { cn } from '@/Global/lib'
import { Item } from '@/Item/types'

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
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <NoContent icon={Tags} message="No items found." />
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2 pr-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemToggle(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between',
                    'rounded-sm border p-4',
                    'bg-background hover:bg-accent/50',
                    'transition-colors duration-200',
                    selectedItemIds.has(item.id) && 'border-border',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {selectedItemIds.has(item.id) && <Check className="h-4 w-4" />}
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
      </div>
    </Section>
  )
}
