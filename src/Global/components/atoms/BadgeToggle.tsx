import { cn } from '@/Global/lib'
import { SimplifiedTag } from '@/Storage/Tag/types'
import { ToggleGroup, ToggleGroupItem } from './ToggleGroup'

interface BadgeToggleProps {
  tag: SimplifiedTag
  isActive: boolean
  onToggle: (isActive: boolean) => void
  className?: string
}

export function BadgeToggle({ tag, isActive, onToggle, className }: BadgeToggleProps) {
  const hasCustomColor = Boolean(tag.colour)
  const baseColor = hasCustomColor ? tag.colour?.slice(0, 7) : undefined

  const customColorStyles = hasCustomColor
    ? ({
        backgroundColor: isActive ? baseColor : `${baseColor}15`,
        color: isActive ? 'white' : baseColor,
      } as React.CSSProperties)
    : undefined

  return (
    <ToggleGroup
      type="multiple"
      value={isActive ? ['active'] : []}
      onValueChange={(value) => onToggle(value.includes('active'))}
      className={cn(className)}
    >
      <ToggleGroupItem
        value="active"
        aria-label={`Toggle ${tag.name} tag`}
        style={customColorStyles}
        className={cn(
          'inline-flex items-center px-2 py-1 me-2 text-sm font-medium rounded',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50',
          !hasCustomColor && [
            isActive ? 'bg-zinc-800 text-white' : 'bg-muted text-muted-foreground',
          ],
        )}
      >
        {tag.name}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
