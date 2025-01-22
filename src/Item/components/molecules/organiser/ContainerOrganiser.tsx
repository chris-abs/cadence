import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  CollisionDetection,
  DroppableContainer,
} from '@dnd-kit/core'

import { Section } from '@/Global/components/molecules'
import { SortableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'
import { UnsortedContainersSection } from '@/Container/components/molecules/sections/list/UnsortedContainers'
import { Container } from '@/Container/types'
import { WorkspaceDropzoneList } from '@/Workspace/components/molecules/sections/list/WorkspaceDropzoneList'
import { Workspace } from '@/Workspace/types'

interface ContainerOrganiserProps {
  containers: Container[]
  workspaces: Workspace[]
  onUpdateContainer: (containerId: number, workspaceId: number | undefined) => void
}

export function ContainerOrganiser({
  containers,
  workspaces,
  onUpdateContainer,
}: ContainerOrganiserProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [visibleWorkspaceIds, setVisibleWorkspaceIds] = useState<Set<number>>(new Set())

  const unassignedContainers = containers?.filter((container) => !container.workspaceId) ?? []

  useEffect(() => {
    if (workspaces) {
      setVisibleWorkspaceIds(new Set(workspaces.map((w) => w.id)))
    }
  }, [workspaces])

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const containerId = parseInt(active.id.toString().split('-')[1])
      let newWorkspaceId: number | undefined = undefined

      if (over.id.toString().startsWith('workspace-')) {
        newWorkspaceId = parseInt(over.id.toString().split('-')[1])
      } else if (over.id === 'unsorted') {
        newWorkspaceId = undefined
      }

      onUpdateContainer(containerId, newWorkspaceId)
    }
    setActiveId(null)
  }

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerIntersections = pointerWithin(args)
    return pointerIntersections.map((intersection) => ({
      ...intersection,
      data: {
        ...intersection.data,
        droppableContainer: args.droppableContainers.find((container: DroppableContainer) => {
          if (intersection.id === 'unsorted') {
            return container.id === 'unsorted'
          }
          if (intersection.id.toString().startsWith('workspace-')) {
            return container.id === intersection.id
          }
          return false
        }),
      },
    }))
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={collisionDetectionStrategy}
    >
      <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
        <div className="flex-grow min-h-0">
          <Section className="h-full">
            <WorkspaceDropzoneList
              workspaces={workspaces}
              containers={containers}
              visibleWorkspaceIds={visibleWorkspaceIds}
              setVisibleWorkspaceIds={setVisibleWorkspaceIds}
            />
          </Section>
        </div>
        <div className="h-[30%] min-h-[200px]">
          <Section className="h-full">
            <UnsortedContainersSection containers={unassignedContainers} />
          </Section>
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeId && containers && (
          <div
            style={{
              transform: 'none',
              cursor: 'grabbing',
            }}
          >
            <SortableContainerCard
              container={
                containers.find((container) => `container-${container.id}` === activeId) || null
              }
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
