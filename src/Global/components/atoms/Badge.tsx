import { X } from 'lucide-react'
import { SimplifiedTag } from '@/Tag/types'
import { cn } from '@/Global/lib/utils'

interface BadgeProps {
  tag: SimplifiedTag
  onRemove?: () => void
  className?: string
}

export function Badge({ tag, onRemove, className }: BadgeProps) {
  const hasCustomColor = Boolean(tag.colour)
  const baseColor = hasCustomColor ? tag.colour!.slice(0, 7) : undefined

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 me-2 text-sm font-medium rounded',
        'transition-all duration-200 ease-in-out',
        onRemove ? 'pr-1' : 'pr-2',
        !hasCustomColor && 'bg-muted text-muted-foreground',
        className,
      )}
      style={
        hasCustomColor
          ? {
              backgroundColor: `${baseColor}20`,
              color: baseColor,
            }
          : undefined
      }
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'inline-flex items-center p-0.5 ms-0.5 text-sm bg-transparent rounded-sm',
            'hover:bg-opacity-20 transition-colors duration-200 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50',
          )}
          style={
            hasCustomColor
              ? {
                  color: baseColor,
                  ['--hover-bg-color' as string]: `${baseColor}40`,
                }
              : undefined
          }
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="w-2.5 h-2.5" aria-hidden="true" />
        </button>
      )}
    </span>
  )
}
