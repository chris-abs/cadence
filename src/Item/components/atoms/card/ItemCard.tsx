import { Link } from '@tanstack/react-router'
import { Item } from '@/Item/types'
import { ItemCardContent } from './ItemCardContent'
interface ItemCardProps {
  item: Item | null
}

export function ItemCard({ item }: ItemCardProps) {
  if (!item) {
    return null
  }

  return (
    <Link to="/items/$itemId" params={{ itemId: item.id.toString() }} className="block w-[280px]">
      <ItemCardContent item={item} />
    </Link>
  )
}
