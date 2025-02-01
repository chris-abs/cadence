import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/Global/lib'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  colour?: {
    name: string
    value: string
  }
  onRemove?: () => void
  icon?: React.ReactNode
  isActive?: boolean
  variant?: 'default' | 'toggle'
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      colour,
      onRemove,
      icon,
      isActive = false,
      variant = 'default',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const content = children || colour?.name

    // Style computation based on variant and colour
    const getStyles = () => {
      if (colour?.value) {
        if (variant === 'toggle') {
          return {
            style: {
              backgroundColor: isActive ? colour.value : `${colour.value}1A`,
              colour: isActive ? 'white' : colour.value,
            },
            className: cn(
              'transition-colors duration-200',
              isActive ? 'hover:brightness-110' : 'hover:brightness-95',
            ),
          }
        }
        return {
          style: {
            backgroundColour: colour.value,
            colour: 'white',
          },
          className: 'hover:brightness-110',
        }
      }

      // Default theme-based styling when no colour is provided
      return {
        style: {},
        className: cn(
          variant === 'toggle'
            ? cn(
                'bg-secondary text-secondary-foreground',
                isActive && 'bg-accent text-accent-foreground',
              )
            : 'bg-primary text-primary-foreground',
        ),
      }
    }

    const { style, className: styleClassName } = getStyles()

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
          'transition-all duration-200',
          styleClassName,
          className,
        )}
        style={style}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{content}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-1 rounded-full p-0.5 hover:bg-black/20 dark:hover:bg-white/20"
            aria-label={`Remove ${content} tag`}
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  },
)

Badge.displayName = 'Badge'

export default Badge
