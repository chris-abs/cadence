import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { ItemCard } from './Base'
import { Item } from '@/Item/types'

interface SortableItemCardProps {
  item: Item | null
}

export function SortableItemCard({ item }: SortableItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item ? `item-${item.id}` : 'placeholder',
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!item) return null

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ItemCard item={item} />
    </div>
  )
}
