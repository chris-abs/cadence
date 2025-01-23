import { useDroppable } from '@dnd-kit/core'
import { ScrollArea } from '@/Global/components/atoms'
import { cn } from '@/Global/lib'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'
import { Item } from '@/Item/types'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'

interface UnsortedItemsSectionProps {
  items: Item[]
}

export function UnsortedItemsSection({ items }: UnsortedItemsSectionProps) {
  const { isCompactView } = useSettingsStore()

  const { setNodeRef, isOver } = useDroppable({
    id: 'unsorted',
  })

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
        <div
          className={cn(
            'grid gap-2 pb-4',
            isCompactView
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
