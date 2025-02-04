import { ItemCatalogue } from '@/Tag/components/organisms/detail/sections'
import { Item } from '@/Item/types'

interface ItemsListSectionProps {
  items: Item[]
  emptyStateComponent?: React.ReactNode
}

export function ItemsListSection({ items, emptyStateComponent }: ItemsListSectionProps) {
  if (!items?.length) {
    return emptyStateComponent || null
  }

  return <ItemCatalogue items={items} />
}
