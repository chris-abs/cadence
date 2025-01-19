import { Link } from '@tanstack/react-router'
import { useDroppable } from '@dnd-kit/core'

import { ScrollArea } from '@/Global/components/atoms'
import { cn } from '@/Global/lib'
import { Container } from '@/Container/types'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'
import { Item } from '@/Item/types'

interface ContainerRowProps {
  container: Container
  items: Item[]
}

export function ContainerRow({ container, items }: ContainerRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container-${container.id}`,
    data: {
      type: 'container',
      containerId: container.id,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'px-4 py-3 border-t first:border-t-0 transition-colors',
        isOver && 'bg-primary/10 border-primary/20',
        'hover:bg-accent/5',
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

      {items.length > 0 ? (
        <ScrollArea
          className={cn('w-full whitespace-nowrap rounded-md border', isOver && 'border-primary')}
        >
          <div className="flex p-4 gap-4">
            {items.map((item) => (
              <SortableItemCard key={item.id} item={item} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center h-24 border rounded-md bg-muted/50 transition-colors',
            isOver && 'border-primary bg-primary/5',
            'hover:border-primary/50',
          )}
        >
          <p className="text-sm text-muted-foreground">
            {isOver ? 'Drop item here' : 'No items in this container'}
          </p>
        </div>
      )}
    </div>
  )
}
