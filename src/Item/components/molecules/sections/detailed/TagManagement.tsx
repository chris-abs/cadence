import { useState } from 'react'

import { Tag } from '@/Tag/types'
import { TagBadge } from './TagBadge'
import { TagSelector } from './TagSelector'

interface TagManagementProps {
  tags: Tag[]
  onChange: (tagIds: number[]) => void
  readOnly: boolean
}

export function TagManagement({ tags, onChange, readOnly }: TagManagementProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTagChange = (newTags: Tag[]) => {
    onChange(newTags.map((tag) => tag.id))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="tag-enter">
            <TagBadge
              tag={tag}
              onRemove={
                readOnly
                  ? undefined
                  : () => {
                      const tagElement = document.getElementById(`tag-${tag.id}`)
                      if (tagElement) {
                        tagElement.classList.remove('tag-enter')
                        tagElement.classList.add('tag-exit')
                        setTimeout(() => {
                          handleTagChange(tags.filter((t) => t.id !== tag.id))
                        }, 200)
                      }
                    }
              }
            />
          </div>
        ))}
        {!readOnly && (
          <TagSelector
            selectedTags={tags}
            onChange={handleTagChange}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
          />
        )}
      </div>
      {tags.length === 0 && <span className="text-sm text-muted-foreground">No tags assigned</span>}
    </div>
  )
}
