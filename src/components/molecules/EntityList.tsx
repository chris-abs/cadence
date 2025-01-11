import { Link } from '@tanstack/react-router'
import { Container, Workspace } from '@/types'

interface EntityListProps {
  items: (Container | Workspace)[]
  type: 'container' | 'workspace'
  isLoading?: boolean
}

export function EntityList({ items, type, isLoading }: EntityListProps) {
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
        <p className="text-sm text-muted-foreground">
          No {type}s found. Create one to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/${type}s/${item.id}`}
          className="flex items-center justify-between rounded-md border p-4 hover:bg-muted"
        >
          <div>
            <h3 className="font-medium">{item.name}</h3>
            {'location' in item && item.location && (
              <p className="text-sm text-muted-foreground">Location: {item.location}</p>
            )}
            {'description' in item && item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Created {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </Link>
      ))}
    </div>
  )
}
