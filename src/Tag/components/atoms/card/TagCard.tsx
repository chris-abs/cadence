import { Link } from '@tanstack/react-router'
import { Clock, Tag as TagIcon } from 'lucide-react'

import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { Tag } from '@/Tag/types'
import { H4, Muted } from '@/Global/components/molecules/Typography'
import { cn } from '@/Global/lib'
import { Badge } from '@/Global/components/atoms'

interface TagCardProps {
  tag: Tag
}

export function TagCard({ tag }: TagCardProps) {
  return (
    <Link to="/tags/$tagId" params={{ tagId: tag.id.toString() }} className="block w-full">
      <article
        className={cn(
          'rounded-lg border overflow-hidden h-[100px]',
          'bg-background hover:bg-contrast-accent',
          'border-border hover:border-primary/50',
          'transition-colors duration-200',
          'flex flex-col',
        )}
      >
        <div className="p-3 flex flex-col flex-1">
          <div className="flex gap-2">
            <TagIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex gap-2 items-center">
              <H4 className="truncate text-foreground" id={`tag-${tag.id}-name`}>
                {tag.name}
              </H4>
              <Badge tag={tag} className="shrink-0" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <Muted>{tag.items?.length || 0} items</Muted>
            <Muted className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(tag.updatedAt || tag.createdAt)}</span>
            </Muted>
          </div>
        </div>
      </article>
    </Link>
  )
}
