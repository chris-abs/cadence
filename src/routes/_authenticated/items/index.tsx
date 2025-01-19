import { useEffect, useState } from 'react'
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
import { useContainers } from '@/Container/queries'

export const Route = createFileRoute('/_authenticated/items/')({
  component: ItemsPage,
})

function ItemsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: items } = useItems()
  const { data: workspaces } = useWorkspaces()
  const { data: containers } = useContainers()
  const updateItem = useUpdateItem()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [visibleWorkspaceIds, setVisibleWorkspaceIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (workspaces) {
      setVisibleWorkspaceIds(new Set(workspaces.map((w) => w.id)))
    }
  }, [workspaces])

  const unassignedContainers = containers?.filter((container) => !container.workspaceId) ?? []

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const item = items?.find((item) => `item-${item.id}` === active.id)
      if (!item) return

      let newContainerId = null
      if (over.id.toString().startsWith('container-')) {
        newContainerId = parseInt(over.id.toString().split('-')[1])
      }

      updateItem.mutate({
        id: item.id,
        containerId: newContainerId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        imgUrl: item.imgUrl,
        tags: item.tags.map((tag) => tag.id),
      })
    }
    setActiveId(null)
  }

  return (
    <PageLayout>
      <div className="flex flex-col h-full">
        <div className="flex flex-col gap-4 p-4 h-full">
          <EntityPageHeader
            title="Items"
            entityType="item"
            onAdd={() => setIsCreateModalOpen(true)}
          />
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
              <div className="flex-grow min-h-0">
                <Section className="h-full">
                  <WorkspaceListSection
                    workspaces={workspaces ?? []}
                    items={items ?? []}
                    unassignedContainers={unassignedContainers}
                    visibleWorkspaceIds={visibleWorkspaceIds}
                    setVisibleWorkspaceIds={setVisibleWorkspaceIds}
                  />
                </Section>
              </div>
              <div className="h-[30%] min-h-[200px]">
                <Section className="h-full">
                  <UnsortedItemsSection items={items?.filter((item) => !item.containerId) ?? []} />
                </Section>
              </div>
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
