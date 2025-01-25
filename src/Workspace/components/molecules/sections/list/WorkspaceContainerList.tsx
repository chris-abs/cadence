import { useState } from 'react'

import {
  ScrollArea,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/Global/components/atoms'
import { H3 } from '@/Global/components/molecules'
import { Workspace } from '@/Workspace/types'
import { ContainerRow } from '@/Container/components/molecules/sections/list/ContainerRow'
import { Container } from '@/Container/types'
import { Item } from '@/Item/types'
import { NoContent } from '@/Global/components/molecules'
import { WorkspacePopover } from './WorkspacePopover'

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

  const getContainerIds = (containers: Container[]) =>
    containers.map((container) => `container-${container.id}`)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-shrink-0">
            <div className="flex flex-col gap-2">
              <CardTitle className="gap-2">Workspaces</CardTitle>
              <CardDescription>
                Expand your workspaces to sort items into their containers!
              </CardDescription>
            </div>
            <WorkspacePopover
              workspaces={workspaces}
              visibleWorkspaceIds={visibleWorkspaceIds}
              onVisibleWorkspacesChange={setVisibleWorkspaceIds}
            />
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-col h-full overflow-hidden">
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
    </>
  )
}
