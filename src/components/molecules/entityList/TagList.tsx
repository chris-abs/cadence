import { Link } from '@tanstack/react-router'
import type { Tag } from '@/types'

interface TagListProps {
  tags: Tag[]
  isLoading?: boolean
}

export function TagList({ tags, isLoading }: TagListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No tags found. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          to="/tags/$tagId"
          params={{ tagId: tag.id.toString() }}
          className="flex items-center justify-between rounded-md border p-4 bg-contrast-accent hover:bg-contrast-accent-hover"
        >
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.colour }} />
            <h3 className="font-medium">{tag.name}</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{tag.items?.length || 0} items</span>
            <span className="text-sm text-muted-foreground">
              Created {new Date(tag.createdAt).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
