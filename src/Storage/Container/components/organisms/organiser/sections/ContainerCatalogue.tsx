import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FolderOpen, Box, Filter } from 'lucide-react'

import {
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Global/components/atoms'
import { NoContent } from '@/Global/components/molecules'
import { Container } from '@/Storage/Container/types'
import { Workspace } from '@/Storage/Workspace/types'
import { useUpdateContainer } from '@/Storage/Container/queries'

interface ContainerCatalogueProps {
  containers: Container[]
  workspaces: Workspace[]
  isLoading?: boolean
}

type FilterType = 'all' | 'assigned' | 'unassigned'

export function ContainerCatalogue({ containers, workspaces, isLoading }: ContainerCatalogueProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const updateContainer = useUpdateContainer()

  const filteredContainers = containers.filter((container) => {
    if (filter === 'all') return true
    if (filter === 'assigned') return container.workspaceId !== undefined
    return container.workspaceId === undefined
  })

  const handleWorkspaceChange = (containerId: number, workspaceId: string) => {
    const targetContainer = containers.find((c) => c.id === containerId)
    if (!targetContainer) return

    updateContainer.mutate({
      id: containerId,
      name: targetContainer.name,
      location: targetContainer.location || '',
      number: targetContainer.number || 0,
      workspaceId: workspaceId === 'none' ? undefined : parseInt(workspaceId),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading containers">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-md bg-muted animate-pulse" aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (containers.length === 0) {
    return <NoContent icon={FolderOpen} message="No containers found. Create one to get started." />
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-4 flex items-center justify-between">
        <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter containers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All containers</SelectItem>
            <SelectItem value="assigned">With workspace</SelectItem>
            <SelectItem value="unassigned">Without workspace</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1" role="region" aria-label="Containers list">
        <ul className="space-y-2">
          {filteredContainers.map((container) => (
            <li key={container.id}>
              <div className="flex flex-col rounded-md border bg-contrast-accent hover:bg-contrast-accent-hover">
                <Link
                  to="/cadence/storage/containers/$containerId"
                  params={{ containerId: container.id.toString() }}
                  className="flex items-center justify-between p-4"
                  aria-labelledby={`container-${container.id}-name`}
                >
                  <div className="space-y-1">
                    <h3 id={`container-${container.id}-name`} className="font-medium">
                      {container.name}
                    </h3>
                    {container.location && (
                      <p className="text-sm text-muted-foreground">
                        Location: {container.location}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {container.items?.length || 0} items
                    </span>
                    <time className="text-sm text-muted-foreground" dateTime={container.createdAt}>
                      Created {new Date(container.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                </Link>

                <div className="px-4 pb-4 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Workspace</span>
                    </div>
                    <Select
                      value={container.workspaceId?.toString() || 'none'}
                      onValueChange={(value) => handleWorkspaceChange(container.id, value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No workspace</SelectItem>
                        {workspaces.map((workspace) => (
                          <SelectItem key={workspace.id} value={workspace.id.toString()}>
                            {workspace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {container.workspaceId && (
                    <div className="mt-2">
                      <div className="inline-flex bg-primary/5 px-2 py-1 rounded-md text-sm">
                        {workspaces.find((w) => w.id === container.workspaceId)?.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
