import { Dispatch, SetStateAction } from 'react'

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
import { Workspace } from '@/Workspace/types'
import { ContainerRow } from '@/Container/components/molecules/sections/list/ContainerRow'
import { Item } from '@/Item/types'
import { H2, H3 } from '@/Global/components/molecules/Typography'

interface WorkspaceListSectionProps {
  workspaces: Workspace[]
  items: Item[]
  deselectedWorkspaces: number[]
  setDeselectedWorkspaces: Dispatch<SetStateAction<number[]>>
}

export function WorkspaceListSection({
  workspaces,
  items,
  deselectedWorkspaces,
  setDeselectedWorkspaces,
}: WorkspaceListSectionProps) {
  const unsortedContainers = workspaces
    .flatMap((w) => w.containers || [])
    .filter((c) => !c.workspaceId)

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      <div className="flex justify-between items-center mb-4">
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
                value={deselectedWorkspaces.map(String)}
                onValueChange={(values) => setDeselectedWorkspaces(values.map(Number))}
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
      {workspaces
        .filter((workspace) => !deselectedWorkspaces.includes(workspace.id))
        .map((workspace) => (
          <Collapsible key={workspace.id}>
            <CollapsibleTrigger className="w-full text-left py-2 px-4 hover:bg-accent">
              <H3>{workspace.name}</H3>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {workspace.containers?.map((container) => (
                <ContainerRow
                  key={container.id}
                  container={container}
                  items={items.filter((item) => item.containerId === container.id)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}

      {unsortedContainers.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="w-full text-left py-2 px-4 hover:bg-accent">
            <H3>Unsorted Containers</H3>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {unsortedContainers.map((container) => (
              <ContainerRow
                key={container.id}
                container={container}
                items={items.filter((item) => item.containerId === container.id)}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
