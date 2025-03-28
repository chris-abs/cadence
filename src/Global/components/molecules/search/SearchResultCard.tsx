import { Box } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { RankedEntity } from '@/Global/types/search'
import { H3, Muted } from '@/Global/components/molecules/Typography'
import { cn } from '@/Global/lib'

interface SearchCardProps {
  result: RankedEntity
  Icon: typeof Box
  onClose?: () => void
}

const typeToRoute = {
  workspace: (id: number) => `/workspaces/${id}`,
  container: (id: number) => `/containers/${id}`,
  item: (id: number) => `/items/${id}`,
  tagged_item: (id: number) => `/items/${id}`,
  tag: (id: number) => `/tags/${id}`,
} as const

export function SearchResultCard({ result, Icon, onClose }: SearchCardProps) {
  const renderExtraInfo = () => {
    switch (result.type) {
      case 'item':
      case 'tagged_item':
        return (
          <Muted className="truncate">
            Container:{' '}
            {result.container
              ? `${result.container.name}${result.container.location ? `, ${result.container.location}` : ''}`
              : 'unassigned'}
          </Muted>
        )
      case 'container':
        return (
          <Muted className="truncate">
            Workspace: {result.workspace?.name || 'unassigned'}
            {result.location && ` • ${result.location}`}
          </Muted>
        )
      case 'tag':
        return <Muted className="truncate">{result.items?.length || 0} items</Muted>
      case 'workspace':
        return <Muted className="truncate">{result.containers?.length || 0} containers</Muted>
    }
  }

  return (
    <div className="border border-border rounded-md bg-background transition-colors duration-200">
      <Link
        to={typeToRoute[result.type](result.id)}
        className={cn(
          'flex items-center gap-3 p-3',
          'hover:bg-contrast-accent',
          'transition-colors duration-200',
        )}
        onClick={onClose}
      >
        <div className="shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col min-w-0">
          <H3 className="truncate text-sm">{result.name}</H3>
          {renderExtraInfo()}
        </div>
      </Link>
    </div>
  )
}
