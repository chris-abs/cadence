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
} from '@dnd-kit/core'

import { Section } from '@/Global/components/molecules'
import { SortableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'
import { UnsortedContainersSection } from '@/Container/components/molecules/sections/list/UnsortedContainers'
import { Container } from '@/Container/types'
import { WorkspaceListSection } from '@/Workspace/components/molecules/sections/list/WorkspaceList'
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 75,
        tolerance: 5,
      },
    }),
  )

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
      }

      onUpdateContainer(containerId, newWorkspaceId)
    }
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
        <div className="flex-1 min-h-0">
          <Section className="h-full overflow-hidden">
            <WorkspaceListSection
              workspaces={workspaces}
              containers={containers}
              visibleWorkspaceIds={visibleWorkspaceIds}
              setVisibleWorkspaceIds={setVisibleWorkspaceIds}
            />
          </Section>
        </div>
        <UnsortedContainersSection containers={unassignedContainers} />
      </div>
      <DragOverlay>
        {activeId && containers && (
          <SortableContainerCard
            container={
              containers.find((container) => `container-${container.id}` === activeId) || null
            }
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
