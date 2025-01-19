import { useDroppable } from '@dnd-kit/core'

import { ScrollArea } from '@/Global/components/atoms'
import { Item } from '@/Item/types'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'

interface UnsortedItemsSectionProps {
  items: Item[]
}

export function UnsortedItemsSection({ items }: UnsortedItemsSectionProps) {
  const { setNodeRef } = useDroppable({
    id: 'unsorted',
  })

  return (
    <div className="h-full flex flex-col" ref={setNodeRef}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Unsorted Items</h2>
        <span className="text-sm text-muted-foreground">({items.length} items)</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-3 gap-4 pr-4 pb-4">
          {items.map((item) => (
            <SortableItemCard key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
