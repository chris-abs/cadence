import { LayoutGrid, LayoutList } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/Global/components/atoms'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { cn } from '@/Global/lib'
import { Small } from '../Typography'

function ViewToggle() {
  const { isCompact, setCompact } = useSettingsStore()

  return (
    <div className="bg-muted/30 p-1 rounded-lg">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCompact(false)}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                'hover:bg-muted/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                !isCompact && 'bg-background shadow-sm',
                isCompact && 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <Small>Default grid view</Small>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCompact(true)}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                'hover:bg-muted/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isCompact && 'bg-background shadow-sm',
                !isCompact && 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <Small>Compact list view</Small>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export default ViewToggle
