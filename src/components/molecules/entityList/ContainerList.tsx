import { Link } from '@tanstack/react-router'
import type { Container } from '@/types'

interface ContainerListProps {
  containers: Container[]
  isLoading?: boolean
}

export function ContainerList({ containers, isLoading }: ContainerListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (containers.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">
          No containers found. Create one to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {containers.map((container) => (
        <Link
          key={container.id}
          to="/containers/$containerId"
          params={{ containerId: container.id.toString() }}
          className="flex items-center justify-between rounded-md border p-4 bg-contrast-accent hover:bg-contrast-accent-hover"
        >
          <div className="space-y-1">
            <h3 className="font-medium">{container.name}</h3>
            {container.location && (
              <p className="text-sm text-muted-foreground">Location: {container.location}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {container.items?.length || 0} items
            </span>
            <span className="text-sm text-muted-foreground">
              Created {new Date(container.createdAt).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
