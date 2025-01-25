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
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'
import { UnsortedItemsSection } from '@/Item/components/molecules/sections/list/UnsortedItems'
import { Item } from '@/Item/types'
import { WorkspaceListSection } from '@/Workspace/components/molecules/sections/list/WorkspaceContainerList'
import { Workspace } from '@/Workspace/types'
import { Container } from '@/Container/types'
import { cn } from '@/Global/lib'

interface ItemOrganiserProps {
  items: Item[]
  workspaces: Workspace[]
  containers: Container[]
  onUpdateItem: (itemId: number, containerId: number | null) => void
}

export function ItemOrganiser({ items, workspaces, containers, onUpdateItem }: ItemOrganiserProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [visibleWorkspaceIds, setVisibleWorkspaceIds] = useState<Set<number>>(new Set())
  const unassignedContainers = containers.filter((container) => !container.workspaceId)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 75,
        tolerance: 5,
      },
    }),
  )

  useEffect(() => {
    if (workspaces) {
      setVisibleWorkspaceIds(new Set(workspaces.map((w) => w.id)))
    }
  }, [workspaces])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const itemId = parseInt(active.id.toString().split('-')[1])
      let newContainerId: number | null = null

      if (over.id.toString().startsWith('container-')) {
        newContainerId = parseInt(over.id.toString().split('-')[1])
      }

      onUpdateItem(itemId, newContainerId)
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
      <div className="flex flex-col gap-4 h-[calc(100vh-10rem)]">
        <div
          className={cn(
            'flex-1 min-h-0',
            !items.some((item) => !item.containerId) &&
              'animate-out slide-out-to-bottom duration-300',
          )}
        >
          <Section className="h-full overflow-hidden">
            <WorkspaceListSection
              workspaces={workspaces}
              items={items}
              unassignedContainers={unassignedContainers}
              visibleWorkspaceIds={visibleWorkspaceIds}
              setVisibleWorkspaceIds={setVisibleWorkspaceIds}
            />
          </Section>
        </div>
        {items.some((item) => !item.containerId) && (
          <div className="h-[300px] shrink-0 animate-in mb-4 slide-in-from-bottom duration-300">
            <Section className="h-full overflow-hidden">
              <UnsortedItemsSection items={items.filter((item) => !item.containerId)} />
            </Section>
          </div>
        )}
      </div>
      <DragOverlay>
        {activeId && items && (
          <SortableItemCard item={items.find((item) => `item-${item.id}` === activeId) || null} />
        )}
      </DragOverlay>
    </DndContext>
  )
}
