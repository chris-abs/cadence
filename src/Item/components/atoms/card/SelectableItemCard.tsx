import { cn } from '@/Global/lib'
import { ItemCardContent } from './ItemCardContent'
import { Item } from '@/Item/types'

interface SelectableItemCardProps {
  item: Item | null
  isSelected: boolean
  onSelect: (itemId: number) => void
}

export function SelectableItemCard({ item, isSelected, onSelect }: SelectableItemCardProps) {
  if (!item) return null

  return (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        'block w-[280px]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isSelected && [
          'ring-2 ring-primary',
          'after:absolute after:inset-0',
          'after:bg-primary/10 after:pointer-events-none',
        ],
      )}
    >
      <ItemCardContent item={item} />
    </button>
  )
}
