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
    <Link to="/containers/$containerId" params={{ containerId: container.id.toString() }}>
      <article className="rounded-lg border bg-white p-4 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Box className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <H4 className="font-medium" id={`container-${container.id}-name`}>
                {container.name}
              </H4>
              {container.location && (
                <p className="text-sm text-muted-foreground">Location: {container.location}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{container.items?.length || 0} items</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(container.updatedAt || container.createdAt)}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
