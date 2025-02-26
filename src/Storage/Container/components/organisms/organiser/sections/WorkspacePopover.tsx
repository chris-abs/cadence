import { Box } from 'lucide-react'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  ToggleGroup,
  ToggleGroupItem,
} from '@/Global/components/atoms'
import { Muted } from '@/Global/components/molecules'
import { cn } from '@/Global/lib'
import { Workspace } from '@/Workspace/types'

interface WorkspacePopoverProps {
  workspaces: Workspace[]
  visibleWorkspaceIds: Set<number>
  onVisibleWorkspacesChange: (ids: Set<number>) => void
}

export function WorkspacePopover({
  workspaces,
  visibleWorkspaceIds,
  onVisibleWorkspacesChange,
}: WorkspacePopoverProps) {
  const handleValueChange = (value: string[]) => {
    onVisibleWorkspacesChange(new Set(value.map(Number)))
  }

  return (
    <Popover>
      <div className="flex gap-10 items-center">
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Filter Workspaces
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-64 bg-background border-border">
        <ScrollArea className="h-[300px]">
          <ToggleGroup
            type="multiple"
            value={Array.from(visibleWorkspaceIds).map(String)}
            onValueChange={handleValueChange}
            className="flex flex-col space-y-2"
          >
            {workspaces.map((workspace) => (
              <ToggleGroupItem
                key={workspace.id}
                value={String(workspace.id)}
                className={cn(
                  'w-full justify-start px-3 py-2',
                  'bg-background hover:bg-contrast-accent',
                  'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                  'transition-colors duration-200',
                )}
              >
                <Box className="h-4 w-4 shrink-0 mr-2" />
                <Muted className="!text-current truncate">{workspace.name}</Muted>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
