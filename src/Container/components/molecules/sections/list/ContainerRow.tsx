import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'

import { ScrollArea } from '@/Global/components/atoms'
import { Container } from '@/Container/types'
import { Item } from '@/Item/types'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'

interface ContainerRowProps {
  container: Container
  items: Item[]
}

export function ContainerRow({ container, items }: ContainerRowProps) {
  const { setNodeRef } = useDroppable({
    id: `container-${container.id}`,
  })

  return (
    <div ref={setNodeRef} className="mb-4">
      <h4 className="text-md font-medium mb-2">{container.name}</h4>
      <ScrollArea className="h-[340px]">
        <SortableContext
          items={items.map((item) => `item-${item.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex space-x-4 p-4">
            {items.map((item) => (
              <SortableItemCard key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}
