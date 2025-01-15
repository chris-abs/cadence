import { Link } from '@tanstack/react-router'

import { ScrollArea } from '@/Global/components/atoms'
import { Item } from '@/Item/types'

interface ItemListProps {
  items: Item[]
  isLoading?: boolean
}

export function ItemList({ items, isLoading }: ItemListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading items">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted animate-pulse" aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className="flex h-32 items-center justify-center rounded-md border border-dashed"
        role="status"
        aria-label="No items found"
      >
        <p className="text-sm text-muted-foreground">No items found. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea className="flex-1" role="region" aria-label="Items list">
        <ul className="space-y-2 pr-4">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to="/items/$itemId"
                params={{ itemId: item.id.toString() }}
                className="flex items-center justify-between rounded-md border p-4 bg-contrast-accent hover:bg-contrast-accent-hover"
                aria-labelledby={`item-${item.id}-name`}
              >
                <div className="space-y-1">
                  <h3 id={`item-${item.id}-name`} className="font-medium">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p
                      className="text-sm text-muted-foreground"
                      aria-label={`Description: ${item.description}`}
                    >
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <span
                      className="text-sm text-muted-foreground"
                      aria-label={`Quantity: ${item.quantity}`}
                    >
                      Quantity: {item.quantity}
                    </span>
                    {item.container && (
                      <span
                        className="text-sm text-muted-foreground"
                        aria-label={`Container: ${item.container.name}`}
                      >
                        Container: {item.container.name}
                      </span>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1" role="list" aria-label="Item tags">
                        {item.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: tag.colour + '20', color: tag.colour }}
                            role="listitem"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <time
                  className="text-sm text-muted-foreground"
                  dateTime={item.createdAt}
                  aria-label={`Created on ${new Date(item.createdAt).toLocaleDateString()}`}
                >
                  Created {new Date(item.createdAt).toLocaleDateString()}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
