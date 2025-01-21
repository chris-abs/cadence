import { Link } from '@tanstack/react-router'
import { Box, Clock } from 'lucide-react'

import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { Container } from '@/Container/types'
import { H4 } from '@/Global/components/molecules/Typography'

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
      <article className="rounded-lg border bg-white overflow-hidden h-[120px] flex flex-col hover:border-primary/50 transition-colors">
        <div className="p-3 flex flex-col flex-1">
          <div className="flex items-start gap-3 mb-2">
            <Box className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <H4 className="truncate text-sm" id={`container-${container.id}-name`}>
                {container.name}
              </H4>
              {container.location && (
                <p className="text-xs text-muted-foreground truncate">{container.location}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto text-xs text-muted-foreground">
            <span>{container.items?.length || 0} items</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(container.updatedAt || container.createdAt)}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
