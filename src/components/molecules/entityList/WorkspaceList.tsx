import { Link } from '@tanstack/react-router'
import { ScrollArea } from '@/components/atoms'
import type { Workspace } from '@/types'

interface WorkspaceListProps {
  workspaces: Workspace[]
  isLoading?: boolean
}

export function WorkspaceList({ workspaces, isLoading }: WorkspaceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading workspaces">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted animate-pulse" aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (workspaces.length === 0) {
    return (
      <div
        className="flex h-32 items-center justify-center rounded-md border border-dashed"
        role="status"
        aria-label="No workspaces found"
      >
        <p className="text-sm text-muted-foreground">
          No workspaces found. Create one to get started.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pr-4" role="region" aria-label="Workspaces list">
      <ul className="space-y-2">
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <Link
              to="/workspaces/$workspaceId"
              params={{ workspaceId: workspace.id.toString() }}
              className="flex items-center justify-between rounded-md border p-4 bg-contrast-accent hover:bg-contrast-accent-hover"
              aria-labelledby={`workspace-${workspace.id}-name`}
            >
              <div className="space-y-1">
                <h3 id={`workspace-${workspace.id}-name`} className="font-medium">
                  {workspace.name}
                </h3>
                {workspace.description && (
                  <p
                    className="text-sm text-muted-foreground"
                    aria-label={`Description: ${workspace.description}`}
                  >
                    {workspace.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4" aria-label="Workspace stats">
                <span
                  className="text-sm text-muted-foreground"
                  aria-label={`${workspace.containers?.length || 0} containers in workspace`}
                >
                  {workspace.containers?.length || 0} containers
                </span>
                <time
                  className="text-sm text-muted-foreground"
                  dateTime={workspace.createdAt}
                  aria-label={`Created on ${new Date(workspace.createdAt).toLocaleDateString()}`}
                >
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
