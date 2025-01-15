import { X } from 'lucide-react'

import { Tag } from '@/Tag/types'

interface TagBadgeProps {
  tag: Tag
  onRemove?: () => void
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-full text-sm border"
      style={{
        backgroundColor: tag.colour + '20',
        color: tag.colour,
        borderColor: tag.colour,
      }}
    >
      {tag.name}
      {onRemove && (
        <button type="button" onClick={onRemove} className="rounded-full hover:bg-black/10">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
