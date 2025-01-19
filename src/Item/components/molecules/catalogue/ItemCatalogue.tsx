import { Link } from '@tanstack/react-router'
import { Clock } from 'lucide-react'

import { Badge, ScrollArea } from '@/Global/components/atoms'
import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { Item } from '@/Item/types'
import { Section } from '@/Global/components/molecules'
import { H3 } from '@/Global/components/molecules/Typography'

interface ItemListProps {
  items: Item[]
}

export function ItemList({ items }: ItemListProps) {
  const sortedItems = items.filter((item) => item.container?.name)
  const unsortedItems = items.filter((item) => !item.container?.name)

  if (items.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No items found. Create one to get started.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      {sortedItems.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Sorted Items</h2>
          <ItemGrid items={sortedItems} />
        </>
      )}

      {unsortedItems.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4 mt-8">Unsorted Items</h2>
          <ItemGrid items={unsortedItems} />
        </>
      )}
    </ScrollArea>
  )
}

function ItemGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          to="/items/$itemId"
          params={{ itemId: item.id.toString() }}
          className="block max-w-md"
        >
          <Section className="overflow-hidden h-[320px] flex flex-col hover:border-primary/50 transition-colors">
            <div className="w-full h-40 relative bg-gray-100">
              <img
                src={item.imgUrl || '/placeholder-item.jpg'}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-md text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatRelativeTime(item.updatedAt || item.createdAt)}</span>
              </div>
            </div>

            <div className="px-4 pt-4 flex flex-col flex-1">
              <div className="mb-3">
                <H3 className="font-semibold truncate" id={`item-${item.id}-name`}>
                  {item.name}
                </H3>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Quantity: {item.quantity}</span>
                  {item.container && <span>{item.container.name}</span>}
                </div>
              </div>

              <div className="flex-1 min-h-0">
                {item.tags && item.tags.length > 0 && (
                  <ScrollArea className="h-[4.5rem] -mr-3 pr-3">
                    <div className="space-y-1.5" role="list" aria-label="Item tags">
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
          </Section>
        </Link>
      ))}
    </div>
  )
}

export default ItemList
