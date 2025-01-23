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
      <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
        <div className="flex-grow min-h-0">
          <Section className="h-full">
            <WorkspaceListSection
              workspaces={workspaces}
              items={items}
              unassignedContainers={unassignedContainers}
              visibleWorkspaceIds={visibleWorkspaceIds}
              setVisibleWorkspaceIds={setVisibleWorkspaceIds}
            />
          </Section>
        </div>
        <div className="h-[32.5%] min-h-[250px]">
          <Section className="h-full">
            <UnsortedItemsSection items={items.filter((item) => !item.containerId)} />
          </Section>
        </div>
      </div>
      <DragOverlay>
        {activeId && items && (
          <SortableItemCard item={items.find((item) => `item-${item.id}` === activeId) || null} />
        )}
      </DragOverlay>
    </DndContext>
  )
}
