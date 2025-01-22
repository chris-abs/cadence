import { Link } from '@tanstack/react-router'

import { ScrollArea } from '@/Global/components/atoms'
import { Workspace } from '@/Workspace/types'
import { H3, Muted } from '@/Global/components/molecules'

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
        <Muted>No workspaces found. Create one to get started.</Muted>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea className="flex-1" role="region" aria-label="Workspaces list">
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
                  <H3 id={`workspace-${workspace.id}-name`}>{workspace.name}</H3>
                  {workspace.description && (
                    <Muted aria-label={`Description: ${workspace.description}`}>
                      {workspace.description}
                    </Muted>
                  )}
                </div>
                <div className="flex items-center gap-4" aria-label="Workspace stats">
                  <span>
                    <Muted>{workspace.containers?.length || 0} containers</Muted>
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
    </div>
  )
}
