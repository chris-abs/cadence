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
  CardContent,
} from '@/Global/components/atoms'
import { Muted, NoContent } from '@/Global/components/molecules'
import { Workspace } from '@/Storage/Workspace/types'
import {
  ContainerRow,
  WorkspacePopover,
} from '@/Storage/Container/components/organisms/organiser/sections'
import { Container } from '@/Storage/Container/types'
import { Item } from '@/Storage/Item/types'

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
              <CardTitle className="gap-2 text-xl">Workspaces</CardTitle>
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

      <div className="flex flex-col pt-4 h-full">
        <ScrollArea className="flex-1">
          <Accordion
            type="multiple"
            value={openWorkspaces}
            onValueChange={setOpenWorkspaces}
            className="space-y-4"
          >
            {unassignedContainers.length > 0 && (
              <AccordionItem value="unassigned">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <AccordionTrigger>Unassigned Containers</AccordionTrigger>
                    </CardTitle>
                  </CardHeader>
                  <AccordionContent>
                    <CardContent>
                      <Accordion
                        type="multiple"
                        defaultValue={getContainerIds(unassignedContainers)}
                      >
                        {unassignedContainers.map((container) => (
                          <AccordionItem key={container.id} value={`container-${container.id}`}>
                            <ContainerRow
                              container={container}
                              items={items.filter((item) => item.containerId === container.id)}
                            />
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )}

            {workspaces
              .filter(
                (workspace) =>
                  visibleWorkspaceIds.has(workspace.id) && (workspace.containers?.length ?? 0) > 0,
              )
              .map((workspace) => (
                <AccordionItem key={workspace.id} value={`workspace-${workspace.id}`}>
                  <Card>
                    <CardHeader>
                      <AccordionTrigger parent className="hover:no-underline">
                        <CardTitle>
                          <div className="flex items-center gap-2">
                            <CardTitle>{workspace.name}</CardTitle>
                            <Muted>({workspace?.containers?.length || 0} containers)</Muted>
                          </div>
                        </CardTitle>
                      </AccordionTrigger>
                      {workspace.description && (
                        <CardDescription>{workspace.description}</CardDescription>
                      )}
                    </CardHeader>
                    <AccordionContent>
                      <CardContent>
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
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
          </Accordion>
        </ScrollArea>
      </div>
    </>
  )
}
