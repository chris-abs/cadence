import { Link } from '@tanstack/react-router'
import { Clock, FolderOpen, Package } from 'lucide-react'

import { H4, Muted } from '@/Global/components/molecules/Typography'
import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { COLOURS } from '@/Global/types'
import { cn } from '@/Global/lib'
import { Container } from '@/Container/types'

interface ContainerCardProps {
  container: Container
}

export function ContainerCard({ container }: ContainerCardProps) {
  const colorIndex = container.id % COLOURS.length
  const baseColor = COLOURS[colorIndex].value

  return (
    <Link
      to="/containers/$containerId"
      params={{ containerId: container.id.toString() }}
      className="block w-[280px]"
    >
      <article
        className={cn(
          'rounded-lg border h-[120px]',
          'bg-background hover:bg-accent/5',
          'border-border hover:border-primary/50',
          'transition-all duration-200',
          'flex flex-col relative overflow-hidden group',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-40',
            'transition-opacity duration-200',
            'group-hover:opacity-60',
          )}
          style={{
            backgroundImage: `linear-gradient(to bottom right, ${baseColor}20, ${baseColor}10)`,
          }}
        />

        <div className="absolute -right-6 -bottom-6 opacity-5">
          <Package className="w-24 h-24" />
        </div>

        <div className="p-4 flex flex-col flex-1 relative">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-1.5 rounded-md',
                'bg-background/50 backdrop-blur-sm',
                'border border-border/50',
                'group-hover:border-primary/20',
                'transition-all duration-200',
              )}
            >
              <FolderOpen className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <H4
                className="truncate text-foreground font-medium"
                id={`container-${container.id}-name`}
              >
                {container.name}
              </H4>
              {container.location && (
                <Muted className="truncate text-xs">{container.location}</Muted>
              )}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-2">
            <span
              className={cn(
                'inline-flex items-center gap-1',
                'px-2 py-1 rounded-md',
                'bg-background/50 backdrop-blur-sm',
                'text-xs font-medium',
                'border border-border/50',
                'group-hover:border-primary/20',
                'transition-all duration-200',
              )}
            >
              {container.items?.length || 0} items
            </span>
            <Muted className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(container.updatedAt)}</span>
            </Muted>
          </div>
        </div>
      </article>
    </Link>
  )
}
