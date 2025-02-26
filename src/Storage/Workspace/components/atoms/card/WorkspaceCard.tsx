import { Link } from '@tanstack/react-router'
import { Clock, Layout, Box } from 'lucide-react'

import { H4, Muted } from '@/Global/components/molecules/Typography'
import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { cn } from '@/Global/lib'
import { Workspace } from '@/Storage/Workspace/types'

interface WorkspaceCardProps {
  workspace: Workspace
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Link
      to="/cadence/storage/workspaces/$workspaceId"
      params={{ workspaceId: workspace.id.toString() }}
      className="block w-full"
    >
      <article
        className={cn(
          'rounded-lg border h-[140px]',
          'bg-background hover:bg-accent/5',
          'border-border hover:border-primary/50',
          'transition-all duration-200',
          'flex flex-col relative overflow-hidden group',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 opacity-[0.03]',
            'transition-opacity duration-200',
            'group-hover:opacity-[0.05]',
            'pointer-events-none',
          )}
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(var(--foreground) / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(var(--foreground) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="absolute -right-8 -bottom-8 opacity-[0.02] transition-opacity duration-200 group-hover:opacity-[0.04]">
          <Layout className="w-32 h-32" />
        </div>

        <div className="p-4 flex flex-col flex-1 relative">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-1.5 rounded-md',
                'bg-muted',
                'border border-border/50',
                'group-hover:border-border',
                'transition-all duration-200',
              )}
            >
              <Box className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <H4
                className="truncate font-medium text-foreground"
                id={`workspace-${workspace.id}-name`}
              >
                {workspace.name}
              </H4>
              {workspace.description && (
                <Muted className="text-sm line-clamp-2 mt-0.5">{workspace.description}</Muted>
              )}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-2">
            <span
              className={cn(
                'inline-flex items-center gap-1',
                'px-2 py-1 rounded-md',
                'bg-background/80',
                'text-xs font-medium',
                'border border-border/50',
                'group-hover:border-border',
                'transition-all duration-200',
              )}
            >
              {workspace.containers?.length || 0} containers
            </span>
            <Muted className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(workspace.updatedAt)}</span>
            </Muted>
          </div>
        </div>
      </article>
    </Link>
  )
}
