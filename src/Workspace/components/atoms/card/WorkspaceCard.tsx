import { Link } from '@tanstack/react-router'
import { Clock, Boxes } from 'lucide-react'

import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { Workspace } from '@/Workspace/types'
import { H4, Muted } from '@/Global/components/molecules/Typography'
import { cn } from '@/Global/lib'

interface WorkspaceCardProps {
  workspace: Workspace
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Link
      to="/workspaces/$workspaceId"
      params={{ workspaceId: workspace.id.toString() }}
      className="block w-full"
    >
      <article
        className={cn(
          'rounded-lg border overflow-hidden h-[140px]',
          'bg-background hover:bg-contrast-accent',
          'border-border hover:border-primary/50',
          'transition-colors duration-200',
          'flex flex-col',
        )}
      >
        <div className="p-3 flex flex-col flex-1">
          <div className="flex gap-2">
            <Boxes className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <H4 className="truncate text-foreground" id={`workspace-${workspace.id}-name`}>
              {workspace.name}
            </H4>
          </div>

          {workspace.description && (
            <div className="mt-1 mb-2">
              <Muted className="text-sm line-clamp-2">{workspace.description}</Muted>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto">
            <Muted>{workspace.containers?.length || 0} containers</Muted>
            <Muted className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(workspace.updatedAt || workspace.createdAt)}</span>
            </Muted>
          </div>
        </div>
      </article>
    </Link>
  )
}
