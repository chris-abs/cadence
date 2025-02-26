import { useState } from 'react'

import { Badge } from '@/Global/components/atoms'
import { Tag } from '@/Storage/Tag/types'
import { TagSelector } from './TagSelector'

interface TagManagementProps {
  tags: Tag[]
  onChange: (tagIds: number[]) => void
  readOnly: boolean
}

export function TagManagement({ tags, onChange, readOnly }: TagManagementProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTagRemove = (tagToRemove: Tag) => {
    const updatedTags = tags.filter((tag) => tag.id !== tagToRemove.id)
    onChange(updatedTags.map((tag) => tag.id))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            tag={tag}
            onRemove={readOnly ? undefined : () => handleTagRemove(tag)}
          />
        ))}
        {!readOnly && (
          <TagSelector
            selectedTags={tags}
            onChange={(newTags) => onChange(newTags.map((tag) => tag.id))}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
          />
        )}
      </div>
      {tags.length === 0 && <span className="text-sm text-muted-foreground">No tags assigned</span>}
    </div>
  )
}
