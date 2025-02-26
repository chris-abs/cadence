import { SortableEntityCard } from '@/Global/components/molecules'
import { Item } from '@/Storage/Item/types'
import { ItemCard } from './ItemCard'

export function SortableItemCard({ item }: { item: Item | null }) {
  if (!item) return null
  return (
    <SortableEntityCard entity={item} type="item">
      <ItemCard item={item} />
    </SortableEntityCard>
  )
}
