import { Link } from '@tanstack/react-router'
import { Clock, FolderOpen } from 'lucide-react'

import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { Container } from '@/Container/types'
import { H4, Muted } from '@/Global/components/molecules/Typography'
import { cn } from '@/Global/lib'

interface ContainerCardProps {
  container: Container
}

export function ContainerCard({ container }: ContainerCardProps) {
  return (
    <Link
      to="/containers/$containerId"
      params={{ containerId: container.id.toString() }}
      className="block w-[280px]"
    >
      <article
        className={cn(
          'rounded-lg border overflow-hidden h-[120px]',
          'bg-background hover:bg-contrast-accent',
          'border-border hover:border-primary/50',
          'transition-colors duration-200',
          'flex flex-col',
        )}
      >
        <div className="p-3 flex flex-col flex-1">
          <div className="flex gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <H4 className="truncate text-foreground" id={`container-${container.id}-name`}>
              {container.name}
            </H4>
          </div>
          {container.location && (
            <div className="flex justify-start items-start gap-3 mb-2">
              <Muted className="truncate">{container.location}</Muted>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto">
            <Muted>{container.items?.length || 0} items</Muted>
            <Muted className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(container.updatedAt)}</span>
            </Muted>
          </div>
        </div>
      </article>
    </Link>
  )
}
