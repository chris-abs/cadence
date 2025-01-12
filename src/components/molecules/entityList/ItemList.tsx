import { Link } from '@tanstack/react-router'
import type { Item } from '@/types'

interface ItemListProps {
  items: Item[]
  isLoading?: boolean
}

export function ItemList({ items, isLoading }: ItemListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No items found. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          to="/items/$itemId"
          params={{ itemId: item.id.toString() }}
          className="flex items-center justify-between rounded-md border p-4 bg-contrast-accent hover:bg-contrast-accent-hover"
        >
          <div className="space-y-1">
            <h3 className="font-medium">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Quantity: {item.quantity}</span>
              {item.container && (
                <span className="text-sm text-muted-foreground">
                  Container: {item.container.name}
                </span>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: tag.colour + '20', color: tag.colour }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Created {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </Link>
      ))}
    </div>
  )
}
