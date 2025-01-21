import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  pointerWithin,
  CollisionDetection,
} from '@dnd-kit/core'

import { ScrollArea } from '@/Global/components/atoms'
import { WorkspaceDropZone } from '@/Workspace/components/molecules/sections/list/WorkspaceDropzoneList'
import { Workspace } from '@/Workspace/types'
import { DraggableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'
import { UnsortedContainersSection } from '@/Container/components/molecules/sections/list/UnsortedContainers'
import { useUpdateContainer } from '@/Container/queries'
import { Container } from '@/Container/types'

interface ContainerOrganiserProps {
  containers: Container[]
  workspaces: Workspace[]
}

export function ContainerOrganiser({ containers, workspaces }: ContainerOrganiserProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDropZoneId, setActiveDropZoneId] = useState<string | null>(null)
  const updateContainer = useUpdateContainer()

  const unassignedContainers = containers.filter((c) => !c.workspaceId)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over) {
      const containerId = parseInt(active.id.toString().split('-')[1])
      const workspaceId = parseInt(over.id.toString().split('-')[1])

      const container = containers.find((c) => c.id === containerId)
      if (!container) return

      updateContainer.mutate({
        id: containerId,
        name: container.name,
        location: container.location || '',
        number: container.number || 0,
        workspaceId,
      })
    }

    setActiveId(null)
    setActiveDropZoneId(null)
  }

  const handleDragOver = (event: DragEndEvent) => {
    const { over } = event
    setActiveDropZoneId((over?.id as string) ?? null)
  }

  const collisionDetection: CollisionDetection = (args) => {
    return pointerWithin(args)
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      collisionDetection={collisionDetection}
    >
      <div className="flex flex-col gap-6">
        <UnsortedContainersSection containers={unassignedContainers} />

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-2">
            {workspaces.map((workspace) => (
              <WorkspaceDropZone
                key={workspace.id}
                workspace={workspace}
                containers={containers}
                isOver={activeDropZoneId === `workspace-${workspace.id}`}
              />
            ))}
          </div>
        </ScrollArea>

        <DragOverlay>
          {activeId && containers && (
            <DraggableContainerCard
              container={containers.find((c) => `container-${c.id}` === activeId) as Container}
            />
          )}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
