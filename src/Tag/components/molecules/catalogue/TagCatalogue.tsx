import { Link } from '@tanstack/react-router'

import { ScrollArea } from '@/Global/components/atoms'
import { Tag } from '@/Tag/types'

interface TagListProps {
  tags: Tag[]
  isLoading?: boolean
}

export function TagList({ tags, isLoading }: TagListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading tags">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted animate-pulse" aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <div
        className="flex h-32 items-center justify-center rounded-md border border-dashed"
        role="status"
        aria-label="No tags found"
      >
        <p className="text-sm text-muted-foreground">No tags found. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea className="flex-1" role="region" aria-label="Tags list">
        <ul className="space-y-2 pr-4">
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link
                to="/tags/$tagId"
                params={{ tagId: tag.id.toString() }}
                className="flex items-center justify-between rounded-md border p-4 bg-contrast-accent hover:bg-contrast-accent-hover"
                aria-labelledby={`tag-${tag.id}-name`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: tag.colour }}
                    aria-hidden="true"
                  />
                  <h3 id={`tag-${tag.id}-name`} className="font-medium">
                    {tag.name}
                  </h3>
                </div>
                <div className="flex items-center gap-4" aria-label="Tag stats">
                  <span
                    className="text-sm text-muted-foreground"
                    aria-label={`${tag.items?.length || 0} items with this tag`}
                  >
                    {tag.items?.length || 0} items
                  </span>
                  <time
                    className="text-sm text-muted-foreground"
                    dateTime={tag.createdAt}
                    aria-label={`Created on ${new Date(tag.createdAt).toLocaleDateString()}`}
                  >
                    Created {new Date(tag.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
