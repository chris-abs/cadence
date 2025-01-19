import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import { EntityPageHeader, Section } from '@/Global/components/molecules'
import { PageLayout } from '@/Global/layout/PageLayout'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'
import { UnsortedItemsSection } from '@/Item/components/molecules/sections/list/UnsortedItems'
import { CreateItemModal } from '@/Item/components/organisms/ItemModal'
import { useItems, useUpdateItem } from '@/Item/queries'
import { useWorkspaces } from '@/Workspace/queries'
import { WorkspaceListSection } from '@/Workspace/components/molecules/sections/list/WorkspaceContainerList'

export const Route = createFileRoute('/_authenticated/items/')({
  component: ItemsPage,
})

function ItemsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: items } = useItems()
  const { data: workspaces } = useWorkspaces()
  const updateItem = useUpdateItem()

  const [deselectedWorkspaces, setDeselectedWorkspaces] = useState<number[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const itemId = typeof active.id === 'string' ? parseInt(active.id.split('-')[1]) : active.id
      const newContainerId =
        over.id === 'unsorted'
          ? null
          : typeof over.id === 'string'
            ? parseInt(over.id.split('-')[1])
            : over.id

      updateItem.mutate({ id: itemId, containerId: newContainerId })
    }

    setActiveId(null)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          <EntityPageHeader title="Items" entityType="item" onAdd={handleAdd} />
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
              <div className="min-h-0 overflow-hidden">
                <Section>
                  <WorkspaceListSection
                    workspaces={workspaces ?? []}
                    items={items ?? []}
                    deselectedWorkspaces={deselectedWorkspaces}
                    setDeselectedWorkspaces={setDeselectedWorkspaces}
                  />
                </Section>
              </div>
              <Section>
                <UnsortedItemsSection items={items?.filter((item) => !item.containerId) ?? []} />
              </Section>
            </div>
            <DragOverlay>
              {activeId ? (
                <SortableItemCard
                  item={items?.find((item) => `item-${item.id}` === activeId) || null}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
      <CreateItemModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
