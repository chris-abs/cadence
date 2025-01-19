import { useDroppable } from '@dnd-kit/core'

import { ScrollArea } from '@/Global/components/atoms'
import { cn } from '@/Global/lib'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'
import { CompactItemCard } from '@/Item/components/atoms/card/CompactItemCard'
import { Item } from '@/Item/types'

interface UnsortedItemsSectionProps {
  items: Item[]
  isCompactView: boolean
}

export function UnsortedItemsSection({ items, isCompactView }: UnsortedItemsSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unsorted',
  })

  const ItemComponent = isCompactView ? CompactItemCard : SortableItemCard

  return (
    <div
      className={cn('h-full flex flex-col transition-colors', isOver && 'bg-primary/5 rounded-lg')}
      ref={setNodeRef}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Unsorted Items</h2>
        <span className="text-sm text-muted-foreground">({items.length} items)</span>
      </div>

      <ScrollArea
        className={cn(
          'flex-1 rounded-lg transition-colors',
          isOver && 'border-2 border-primary/20',
        )}
      >
        <div className={cn('grid gap-4 pr-4 pb-4', isCompactView ? 'grid-cols-4' : 'grid-cols-3')}>
          {items.map((item) => (
            <ItemComponent key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
