import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  CollisionDetection,
} from '@dnd-kit/core'

import { EntityPageHeader, Section, ViewToggle } from '@/Global/components/molecules'
import { PageLayout } from '@/Global/layout/PageLayout'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'
import { UnsortedItemsSection } from '@/Item/components/molecules/sections/list/UnsortedItems'
import { CreateItemModal } from '@/Item/components/organisms/ItemModal'
import { useItems, useUpdateItem } from '@/Item/queries'
import { useWorkspaces } from '@/Workspace/queries'
import { useContainers } from '@/Container/queries'
import { WorkspaceListSection } from '@/Workspace/components/molecules/sections/list/WorkspaceContainerList'

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
      const itemId = parseInt(active.id.toString().split('-')[1])
      let newContainerId = null

      if (over.id.toString().startsWith('container-')) {
        newContainerId = parseInt(over.id.toString().split('-')[1])
      }

      const item = items?.find((item) => item.id === itemId)
      if (item) {
        updateItem.mutate({
          id: itemId,
          containerId: newContainerId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          imgUrl: item.imgUrl,
          tags: item.tags.map((tag) => tag.id),
        })
      }
    }
    setActiveId(null)
  }

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerIntersections = pointerWithin(args)
    return pointerIntersections.map((intersection) => ({
      ...intersection,
      data: {
        ...intersection.data,
        droppableContainer: args.droppableContainers.find(
          (container) =>
            container.id ===
            (intersection.id.toString().startsWith('container-') ? intersection.id : 'unsorted'),
        ),
      },
    }))
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          <div className="flex justify-between items-center">
            <EntityPageHeader
              title="Items"
              entityType="item"
              onAdd={() => setIsCreateModalOpen(true)}
            />
            <ViewToggle />
          </div>

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={collisionDetectionStrategy}
          >
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
              {activeId && items && (
                <SortableItemCard
                  item={items.find((item) => `item-${item.id}` === activeId) || null}
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
      <CreateItemModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
