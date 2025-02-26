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
    <div className="relative w-[280px]">
      <button
        onClick={() => onSelect(item.id)}
        className={cn(
          'w-full',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
        )}
      >
        <ItemCardContent
          item={item}
          className={cn(
            'relative',
            isSelected && [
              'ring-2 ring-primary',
              'before:absolute before:inset-0',
              'before:bg-primary/5 before:pointer-events-none',
            ],
          )}
        />
      </button>
    </div>
  )
}
