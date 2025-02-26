import { Link } from '@tanstack/react-router'

import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { cn } from '@/Global/lib'
import { Item } from '@/Storage/Item/types'
import { ItemCardContent } from './ItemCardContent'
interface ItemCardProps {
  item: Item | null
}

export function ItemCard({ item }: ItemCardProps) {
  const { isCompact } = useSettingsStore()

  if (!item) {
    return null
  }

  return (
    <Link
      to="/cadence/storage/items/$itemId"
      params={{ itemId: item.id.toString() }}
      className={cn('block', isCompact ? 'w-[200px]' : 'w-[280px]')}
    >
      <ItemCardContent item={item} />
    </Link>
  )
}
