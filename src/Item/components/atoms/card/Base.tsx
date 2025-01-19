import { Link } from '@tanstack/react-router'
import { Clock } from 'lucide-react'

import { Badge, ScrollArea } from '@/Global/components/atoms'
import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { Item } from '@/Item/types'
import { H4 } from '@/Global/components/molecules/Typography'

interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link to="/items/$itemId" params={{ itemId: item.id.toString() }} className="block w-[280px]">
      <article className="rounded-lg border bg-white overflow-hidden h-[200px] flex flex-col hover:border-primary/50 transition-colors">
        <div className="w-full h-24 relative bg-gray-100">
          <img
            src={item.imgUrl || '/placeholder-item.jpg'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 px-2 py-0.5 rounded-md text-xs">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(item.updatedAt || item.createdAt)}</span>
          </div>
        </div>

        <div className="px-3 pt-2 flex flex-col flex-1">
          <div className="mb-2">
            <H4 className="truncate text-sm" id={`item-${item.id}-name`}>
              {item.name}
            </H4>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Qty: {item.quantity}</span>
              {item.container && <span>{item.container.name}</span>}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {item.tags && item.tags.length > 0 && (
              <ScrollArea className="h-[2.5rem] -mr-2 pr-2">
                <div className="space-y-1" role="list" aria-label="Item tags">
                  {item.tags.map((tag) => (
                    <div key={tag.id} className="w-full">
                      <Badge tag={tag} className="w-full text-xs truncate" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
