import { useState } from 'react'

import { TagBadge } from './TagBadge'
import { TagSelector } from './TagSelector'
import { Tag } from '@/Tag/types'

interface TagManagementProps {
  tags: Tag[]
  onChange: (tagIds: number[]) => void
  readOnly: boolean
}

export function TagManagement({ tags, onChange, readOnly }: TagManagementProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (readOnly) {
    return (
      <div className="min-h-9 px-3 py-2 rounded-md border bg-muted flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => <TagBadge key={tag.id} tag={tag} />)
        ) : (
          <span className="text-sm text-muted-foreground">No tags assigned</span>
        )}
      </div>
    )
  }

  const handleChange = (newTags: Tag[]) => {
    onChange(newTags.map((tag) => tag.id))
  }

  return (
    <div className="space-y-2">
      <div className="min-h-9 px-3 py-2 rounded-md border flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => handleChange(tags.filter((t) => t.id !== tag.id))}
            />
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No tags assigned</span>
        )}
      </div>
      <TagSelector
        selectedTags={tags}
        onChange={handleChange}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  )
}
