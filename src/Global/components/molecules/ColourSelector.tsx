import { Popover, PopoverContent, PopoverTrigger } from '@/Global/components/atoms'
import { Muted } from '@/Global/components/molecules'
import { cn } from '@/Global/lib/utils'
import { COLOURS, ColourOption } from '@/Global/types/colours'

interface ColourSelectorProps {
  selectedColour: string | undefined
  onSelect: (colour: ColourOption) => void
  disabled?: boolean
  className?: string
}

export function ColourSelector({
  selectedColour,
  onSelect,
  disabled,
  className,
}: ColourSelectorProps) {
  const selectedOption = COLOURS.find((c) => c.value === selectedColour)

  if (disabled) {
    return (
      <div
        className={cn(
          'h-9 px-3 rounded-md border',
          'bg-background text-foreground',
          'border-border',
          'flex items-center justify-between',
          className,
        )}
      >
        <Muted className="!text-foreground">{selectedOption?.name || 'No colour selected'}</Muted>
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: selectedColour }}
        />
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'flex h-9 w-full rounded-md border',
            'bg-background text-foreground',
            'border-border',
            'px-3 py-1 text-sm shadow-sm cursor-pointer',
            className,
          )}
        >
          <div className="flex-1 flex items-center justify-between">
            <Muted className="!text-foreground">{selectedOption?.name || 'Select a colour'}</Muted>
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: selectedColour }}
            />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-3 bg-background border-border">
        <div className="flex flex-wrap gap-2">
          {COLOURS.map((colour) => (
            <button
              key={colour.value}
              type="button"
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all',
                'group relative',
                selectedColour === colour.value
                  ? 'border-primary scale-110'
                  : 'border-transparent hover:scale-105',
              )}
              style={{ backgroundColor: colour.value }}
              onClick={() => onSelect(colour)}
            >
              <span className="sr-only">{colour.name}</span>
              <span className="absolute -right-10 -top-8 scale-0 group-hover:scale-100 transition-transform bg-background text-foreground text-xs py-1 px-2 rounded border border-border whitespace-nowrap">
                {colour.name}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
