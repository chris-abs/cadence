import { Link } from '@tanstack/react-router'
import { Clock, Tag as TagIcon } from 'lucide-react'

import { H4 } from '@/Global/components/molecules/Typography'
import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { cn } from '@/Global/lib'
import { Tag } from '@/Tag/types'

interface TagCardProps {
  tag: Tag
}

export function TagCard({ tag }: TagCardProps) {
  const baseColor = tag.colour?.slice(0, 7) || '#666'

  return (
    <Link
      to="/tags/$tagId"
      params={{ tagId: tag.id.toString() }}
      className="block w-full"
      style={{ '--tag-color': baseColor } as React.CSSProperties}
    >
      <article
        className={cn(
          'rounded-lg border h-[100px]',
          'bg-background hover:bg-accent/5',
          'border-border hover:border-primary/50',
          'transition-all duration-200',
          'p-4 relative',
          'group',
        )}
      >
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
            'transition-all duration-200',
            'group-hover:w-1.5',
            'bg-[var(--tag-color)]',
          )}
        />

        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2">
            <TagIcon
              className={cn(
                'h-4 w-4 flex-shrink-0',
                'transition-transform duration-200',
                'text-[var(--tag-color)]',
              )}
            />
            <H4
              className={cn(
                'font-medium truncate',
                'transition-transform duration-200',
                'text-[var(--tag-color)]',
              )}
            >
              {tag.name}
            </H4>
          </div>

          <div className="mt-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center justify-center',
                  'bg-muted/50 text-muted-foreground',
                  'rounded-md px-2 py-0.5 text-xs font-medium',
                )}
              >
                {tag.items?.length || 0} items
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(tag.updatedAt)}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
