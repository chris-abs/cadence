import { useState } from 'react'
import { Box } from 'lucide-react'

import {
  ScrollArea,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ToggleGroup,
  ToggleGroupItem,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
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
  isCompactView: boolean
}

export function WorkspaceListSection({
  workspaces,
  items,
  unassignedContainers,
  visibleWorkspaceIds,
  setVisibleWorkspaceIds,
  isCompactView,
}: WorkspaceListSectionProps) {
  const [openWorkspaces, setOpenWorkspaces] = useState<string[]>([])

  const handleValueChange = (value: string[]) => {
    setVisibleWorkspaceIds(new Set(value.map(Number)))
  }

  const getContainerIds = (containers: Container[]) =>
    containers.map((container) => `container-${container.id}`)

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
          <PopoverContent className="w-64">
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
                    className="w-full justify-start px-3 py-2 data-[state=on]:bg-slate-900 data-[state=on]:text-white bg-accent/50 hover:bg-pink-100"
                  >
                    <Box className="h-4 w-4 shrink-0 mr-2" />
                    <span className="truncate">{workspace.name}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <ScrollArea className="flex-1">
        <Accordion
          type="multiple"
          value={openWorkspaces}
          onValueChange={setOpenWorkspaces}
          className="space-y-4 pr-4"
        >
          {unassignedContainers.length > 0 && (
            <AccordionItem value="unassigned">
              <AccordionTrigger>
                <H3>Unassigned Containers</H3>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" defaultValue={getContainerIds(unassignedContainers)}>
                  {unassignedContainers.map((container) => (
                    <AccordionItem key={container.id} value={`container-${container.id}`}>
                      <ContainerRow
                        container={container}
                        items={items.filter((item) => item.containerId === container.id)}
                        isCompactView={isCompactView}
                      />
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          )}

          {workspaces
            .filter((workspace) => visibleWorkspaceIds.has(workspace.id))
            .map((workspace) => (
              <AccordionItem key={workspace.id} value={`workspace-${workspace.id}`}>
                <AccordionTrigger>
                  <H3>{workspace.name}</H3>
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion
                    type="multiple"
                    defaultValue={getContainerIds(workspace.containers || [])}
                  >
                    {workspace.containers?.map((container) => (
                      <AccordionItem key={container.id} value={`container-${container.id}`}>
                        <AccordionTrigger>{container.name}</AccordionTrigger>
                        <AccordionContent>
                          <ContainerRow
                            container={container}
                            items={items.filter((item) => item.containerId === container.id)}
                            isCompactView={isCompactView}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      </ScrollArea>
    </div>
  )
}
