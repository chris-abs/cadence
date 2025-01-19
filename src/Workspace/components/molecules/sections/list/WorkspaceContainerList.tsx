import {
  ScrollArea,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ToggleGroup,
  ToggleGroupItem,
} from '@/Global/components/atoms'
import { H2, H3 } from '@/Global/components/molecules/Typography'
import { Workspace } from '@/Workspace/types'
import { ContainerRow } from '@/Container/components/molecules/sections/list/ContainerRow'
import { Container } from '@/Container/types'
import { Item } from '@/Item/types'

interface WorkspaceListSectionProps {
  workspaces: Workspace[]
  items: Item[]
  unassignedContainers: Container[]
  visibleWorkspaceIds: Set<number>
  setVisibleWorkspaceIds: (ids: Set<number>) => void
}

export function WorkspaceListSection({
  workspaces,
  items,
  unassignedContainers,
  visibleWorkspaceIds,
  setVisibleWorkspaceIds,
}: WorkspaceListSectionProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <H2>Workspaces</H2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Filter Workspaces
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <ScrollArea className="h-[300px]">
              <ToggleGroup
                type="multiple"
                value={Array.from(visibleWorkspaceIds).map(String)}
                onValueChange={(values) => {
                  setVisibleWorkspaceIds(new Set(values.map(Number)))
                }}
                className="flex flex-col space-y-2"
              >
                {workspaces.map((workspace) => (
                  <ToggleGroupItem
                    key={workspace.id}
                    value={String(workspace.id)}
                    className="w-full justify-start"
                  >
                    {workspace.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {unassignedContainers.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="w-full text-left py-2 px-4 hover:bg-accent">
                <H3>Unassigned Containers</H3>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="max-h-[60vh] overflow-y-auto">
                  {unassignedContainers.map((container) => (
                    <ContainerRow
                      key={container.id}
                      container={container}
                      items={items.filter((item) => item.containerId === container.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {workspaces
            .filter((workspace) => visibleWorkspaceIds.has(workspace.id))
            .map((workspace) => (
              <Collapsible key={workspace.id}>
                <CollapsibleTrigger className="w-full text-left py-2 px-4 hover:bg-accent">
                  <H3>{workspace.name}</H3>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {workspace.containers?.map((container) => (
                      <ContainerRow
                        key={container.id}
                        container={container}
                        items={items.filter((item) => item.containerId === container.id)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
        </div>
      </ScrollArea>
    </div>
  )
}
