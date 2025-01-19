import { Link } from '@tanstack/react-router'

import { Badge } from '@/Global/components/atoms'
import { Item } from '@/Item/types'

interface CompactItemCardProps {
  item: Item | null
}

export function CompactItemCard({ item }: CompactItemCardProps) {
  if (!item) {
    return null
  }

  return (
    <Link to="/items/$itemId" params={{ itemId: item?.id.toString() }} className="block w-[200px]">
      <article className="rounded-lg border bg-white p-2 hover:border-primary/50 transition-colors h-[100px]">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-sm font-medium truncate">{item?.name}</h4>
            <span className="text-xs text-muted-foreground">Qty: {item?.quantity}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate mb-1">{item?.description}</p>
          {item?.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-auto">
              {item?.tags.map((tag) => (
                <Badge key={tag.id} tag={tag} className="text-[10px] px-1 py-0" />
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
