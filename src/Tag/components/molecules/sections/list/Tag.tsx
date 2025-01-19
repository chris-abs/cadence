import { Link } from '@tanstack/react-router'

import { Section } from '@/Global/components/molecules'
import { Tag } from '@/Tag/types'

interface TagsListSectionProps {
  tags: Tag[]
  emptyStateComponent?: React.ReactNode
}

export function TagsListSection({ tags, emptyStateComponent }: TagsListSectionProps) {
  if (!tags?.length) {
    return emptyStateComponent || null
  }

  return (
    <Section>
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
    </Section>
  )
}
