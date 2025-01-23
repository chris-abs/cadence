import { LayoutGrid, LayoutList } from 'lucide-react'
import {
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/Global/components/atoms'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { Small } from '../Typography'

export function ViewToggle() {
  const { isCompact, setCompact } = useSettingsStore()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToggleGroup
          type="single"
          value={isCompact ? 'compact' : 'default'}
          onValueChange={(value) => setCompact(value === 'compact')}
          aria-label="View mode"
        >
          <ToggleGroupItem value="default" aria-label="Default view" className="p-2 h-8 w-8">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="compact" aria-label="Compact view" className="p-2 h-8 w-8">
            <LayoutList className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </TooltipTrigger>
      <TooltipContent>
        <Small>Toggle between default and compact view</Small>
      </TooltipContent>
    </Tooltip>
  )
}
