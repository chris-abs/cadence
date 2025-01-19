import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'

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
    <div ref={setNodeRef}>
      <h2 className="text-xl font-semibold mb-4">Unsorted Items</h2>
      <ScrollArea className="h-[360px]">
        <SortableContext
          items={items.map((item) => `item-${item.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex space-x-4">
            {items.map((item) => (
              <SortableItemCard key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}
