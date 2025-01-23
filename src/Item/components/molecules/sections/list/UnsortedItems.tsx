import { useDroppable } from '@dnd-kit/core'
import { ScrollArea } from '@/Global/components/atoms'
import { H2, Muted } from '@/Global/components/molecules/Typography'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { cn } from '@/Global/lib'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'
import { Item } from '@/Item/types'

interface UnsortedItemsSectionProps {
  items: Item[]
}

export function UnsortedItemsSection({ items }: UnsortedItemsSectionProps) {
  const { isCompact } = useSettingsStore()
  const { setNodeRef, isOver } = useDroppable({ id: 'unsorted' })

  return (
    <div
      className={cn(
        'h-full flex flex-col',
        'transition-colors duration-200',
        isOver && 'bg-primary/5 rounded-lg',
      )}
      ref={setNodeRef}
    >
      <div className="flex justify-between items-center mb-4">
        <H2>Unsorted Items</H2>
        <Muted>({items.length} items)</Muted>
      </div>

      <ScrollArea
        className={cn(
          'flex-1 rounded-lg',
          'transition-colors duration-200',
          isOver && 'border-2 border-primary/20',
        )}
      >
        <div
          className={cn(
            'grid gap-2 pb-4',
            isCompact
              ? 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]'
              : 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]',
          )}
        >
          {items.map((item) => (
            <SortableItemCard key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
