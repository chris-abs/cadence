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
import { H2, H3, Muted, ViewToggle } from '@/Global/components/molecules'
import { Workspace } from '@/Workspace/types'
import { ContainerRow } from '@/Container/components/molecules/sections/list/ContainerRow'
import { Container } from '@/Container/types'
import { Item } from '@/Item/types'
import { NoContent } from '@/Global/components/molecules'
import { cn } from '@/Global/lib'

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
          <div className="flex gap-10 items-center">
            <ViewToggle />
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
              <AccordionTrigger parent>
                <H3>Unassigned Containers</H3>
              </AccordionTrigger>
              <AccordionContent className="bg-background">
                <Accordion type="multiple" defaultValue={getContainerIds(unassignedContainers)}>
                  {unassignedContainers.map((container) => (
                    <AccordionItem border key={container.id} value={`container-${container.id}`}>
                      <ContainerRow
                        container={container}
                        items={items.filter((item) => item.containerId === container.id)}
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
                <AccordionTrigger parent>
                  <H3>{workspace.name}</H3>
                </AccordionTrigger>
                <AccordionContent className="bg-background">
                  {workspace.containers?.length === 0 ? (
                    <NoContent
                      message={`No containers found for ${workspace.name}. Assign one to get started`}
                    />
                  ) : (
                    <Accordion
                      type="multiple"
                      defaultValue={getContainerIds(workspace.containers || [])}
                    >
                      {workspace.containers?.map((container) => (
                        <AccordionItem key={container.id} value={`container-${container.id}`}>
                          <ContainerRow
                            container={container}
                            items={items.filter((item) => item.containerId === container.id)}
                          />
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      </ScrollArea>
    </div>
  )
}
