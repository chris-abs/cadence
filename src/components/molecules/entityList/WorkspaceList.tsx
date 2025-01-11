import { Link } from '@tanstack/react-router'
import type { Workspace } from '@/types'

interface WorkspaceListProps {
  workspaces: Workspace[]
  isLoading?: boolean
}

export function WorkspaceList({ workspaces, isLoading }: WorkspaceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">
          No workspaces found. Create one to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {workspaces.map((workspace) => (
        <Link
          key={workspace.id}
          to="/workspaces/$workspaceId"
          params={{ workspaceId: workspace.id.toString() }}
          className="flex items-center justify-between rounded-md border p-4 bg-contrast-accent hover:bg-contrast-accent-hover"
        >
          <div className="space-y-1">
            <h3 className="font-medium">{workspace.name}</h3>
            {workspace.description && (
              <p className="text-sm text-muted-foreground">{workspace.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {workspace.containers?.length || 0} containers
            </span>
            <span className="text-sm text-muted-foreground">
              Created {new Date(workspace.createdAt).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
