import { Link } from '@tanstack/react-router'
import { FolderOpen } from 'lucide-react'

import { ScrollArea } from '@/Global/components/atoms'
import { Container } from '@/Container/types'
import { NoContent } from '@/Global/components/molecules'

interface ContainerListProps {
  containers: Container[]
  isLoading?: boolean
}

export function ContainerList({ containers, isLoading }: ContainerListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading containers">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted animate-pulse" aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (containers.length === 0) {
    return <NoContent icon={FolderOpen} message="No containers found. Create one to get started." />
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea className="flex-1" role="region" aria-label="Containers list">
        <ul className="space-y-2">
          {containers.map((container) => (
            <li key={container.id}>
              <Link
                to="/containers/$containerId"
                params={{ containerId: container.id.toString() }}
                className="flex items-center justify-between rounded-md border p-4 bg-contrast-accent hover:bg-contrast-accent-hover"
                aria-labelledby={`container-${container.id}-name`}
              >
                <div className="space-y-1">
                  <h3 id={`container-${container.id}-name`} className="font-medium">
                    {container.name}
                  </h3>
                  {container.location && (
                    <p
                      className="text-sm text-muted-foreground"
                      aria-label={`Location: ${container.location}`}
                    >
                      Location: {container.location}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4" aria-label="Container stats">
                  <span
                    className="text-sm text-muted-foreground"
                    aria-label={`${container.items?.length || 0} items in container`}
                  >
                    {container.items?.length || 0} items
                  </span>
                  <time
                    className="text-sm text-muted-foreground"
                    dateTime={container.createdAt}
                    aria-label={`Created on ${new Date(container.createdAt).toLocaleDateString()}`}
                  >
                    Created {new Date(container.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
