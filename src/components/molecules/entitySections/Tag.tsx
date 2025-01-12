import { Link } from '@tanstack/react-router'
import { Tag } from '@/types'

interface TagsSectionProps {
  tags: Tag[]
  emptyStateComponent?: React.ReactNode
}

export function TagsSection({ tags, emptyStateComponent }: TagsSectionProps) {
  if (!tags?.length) {
    return emptyStateComponent || null
  }

  return (
    <section className="bg-background border rounded-xl p-4" aria-labelledby="tags-section-title">
      <div className="space-y-4">
        <header className="flex justify-between items-center">
          <h2 id="tags-section-title" className="text-lg font-medium">
            Tags
          </h2>
        </header>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              to="/tags/$tagId"
              params={{ tagId: tag.id.toString() }}
              className="inline-flex items-center rounded-full px-3 py-1 hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: tag.colour + '20',
                color: tag.colour,
              }}
            >
              <span className="text-sm font-medium">{tag.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
