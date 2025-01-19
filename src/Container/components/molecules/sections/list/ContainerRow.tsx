import { Link } from '@tanstack/react-router'
import { useDroppable } from '@dnd-kit/core'

import { ScrollArea, ScrollBar } from '@/Global/components/atoms'
import { cn } from '@/Global/lib'
import { Container } from '@/Container/types'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'
import { Item } from '@/Item/types'
import { CompactItemCard } from '@/Item/components/atoms/card/CompactItemCard'

interface ContainerRowProps {
  container: Container
  items: Item[]
  isCompactView: boolean
}

export function ContainerRow({ container, items, isCompactView }: ContainerRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container-${container.id}`,
    data: {
      type: 'container',
      containerId: container.id,
    },
  })

  const ItemComponent = isCompactView ? CompactItemCard : SortableItemCard
  const cardWidth = isCompactView ? '200px' : '280px'
  const cardHeight = isCompactView ? '100px' : '200px'

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'px-4 py-3 border-t first:border-t-0 transition-colors',
        isOver && 'bg-primary/10 border-primary/20',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{container.name}</span>
          <span className="text-xs text-muted-foreground">({items.length} items)</span>
        </div>
        <Link
          to="/containers/$containerId"
          params={{ containerId: container.id.toString() }}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          View Details
        </Link>
      </div>

      <div className="flex">
        <ScrollArea type="always" className="w-1 flex-1">
          <div className="relative">
            {isOver && (
              <div
                className="absolute left-0 top-0 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                }}
              >
                <p className="text-sm text-muted-foreground">Drop here</p>
              </div>
            )}
            <div
              className={cn(
                'flex gap-4 pb-4 transition-transform duration-200',
                isOver && 'translate-x-[calc(100%+1rem)]',
              )}
            >
              {items.map((item) => (
                <ItemComponent key={item.id} item={item} />
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" className="w-full" />
        </ScrollArea>
      </div>
    </div>
  )
}
