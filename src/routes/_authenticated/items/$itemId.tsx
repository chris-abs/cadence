import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { toast } from 'sonner'

import { useItem, useUpdateItem } from '@/Item/queries'
import { useUpdateContainer } from '@/Container/queries'
import { PageLayout } from '@/Global/layout/PageLayout'
import { Alert, AlertDescription, AlertTitle } from '@/Global/components/atoms'
import { EntityPageHeader, NotAssignedSection } from '@/Global/components/molecules'
import { UpdateItemData } from '@/Item/schemas'
import { UpdateContainerData } from '@/Container/schemas'
import { ItemEntry } from '@/Item/components/molecules/sections/detailed'
import { ContainerSection } from '@/Container/components/molecules/sections/detailed/Container'
import { TagsListSection } from '@/Tag/components/molecules/sections/list/Tag'
import { CreateTagModal } from '@/Tag/components/organisms/TagModal'
import { ContainerSelectionModal } from '@/Container/components/organisms/ContainerSelectionModal'

export const Route = createFileRoute('/_authenticated/items/$itemId')({
  component: ItemPage,
})

function ItemPage() {
  const { itemId } = Route.useParams()
  const parsedItemId = parseInt(itemId)
  const { data: item, isLoading } = useItem(parsedItemId)
  const updateItem = useUpdateItem()
  const updateContainer = useUpdateContainer()
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false)
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)

  if (isLoading) {
    return <PageLayout>Loading...</PageLayout>
  }

  if (!item) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <Package className="h-4 w-4" />
            <AlertTitle>No Items have been found...</AlertTitle>
            <AlertDescription>
              You can create Items in the{' '}
              <Link className="underline" to="/">
                Dashboard
              </Link>{' '}
              and store them in Containers for better organising!
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    )
  }

  const handleAddTag = () => {
    setIsCreateTagModalOpen(true)
  }

  const handleUpdateItem = async (data: UpdateItemData) => {
    try {
      const updatedItemData: UpdateItemData = {
        ...item,
        ...data,
        tags: data.tags || item.tags.map((tag) => tag.id),
        containerId: data.containerId ?? item.container_id,
      }
      await updateItem.mutateAsync(updatedItemData)
      toast('Item updated', {
        description: `${data.name || item.name} has been updated successfully`,
      })
    } catch (err) {
      toast('Error', {
        description: 'Failed to update item',
        duration: 3000,
      })
      throw err
    }
  }

  const handleUpdateContainer = async (data: UpdateContainerData) => {
    try {
      await updateContainer.mutateAsync(data)
      toast('Container updated', {
        description: `Container ${data.name} has been updated successfully`,
      })
    } catch (err) {
      toast('Error', {
        description: 'Failed to update container',
        duration: 3000,
      })
      throw err
    }
  }

  const handleAssignOrReassignContainer = () => {
    setIsContainerModalOpen(true)
  }

  const handleContainerSelection = async (containerId: number | undefined) => {
    try {
      if (!item) return

      const updatedItemData: UpdateItemData = {
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        containerId: containerId,
        tags: item.tags.map((tag) => tag.id),
        imgUrl: item.imgUrl,
      }

      await updateItem.mutateAsync(updatedItemData)
      toast('Container updated', {
        description: containerId
          ? `Item has been assigned to a new container`
          : `Item has been removed from its container`,
      })
      setIsContainerModalOpen(false)
    } catch {
      toast('Error', {
        description: 'Failed to update container',
        duration: 3000,
      })
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="bg-background border rounded-xl">
          <EntityPageHeader title={item.name} entityType="item" onAdd={handleAddTag} />
        </div>

        <ItemEntry
          item={item}
          onUpdate={handleUpdateItem}
          isUpdating={updateItem.isPending}
          emptyStateComponent={
            <NotAssignedSection title="Item" message="No item details available." />
          }
        />

        <ContainerSection
          container={item?.container}
          onUpdateContainer={handleUpdateContainer}
          isUpdating={updateContainer.isPending}
          onAssignOrReassign={handleAssignOrReassignContainer}
          emptyStateComponent={
            <NotAssignedSection
              title="Container"
              message="No container assigned to this item yet."
            />
          }
        />

        <TagsListSection
          tags={item.tags}
          emptyStateComponent={
            <NotAssignedSection title="Tags" message="No tags assigned to this item yet." />
          }
        />
      </div>

      <CreateTagModal
        isOpen={isCreateTagModalOpen}
        onClose={() => setIsCreateTagModalOpen(false)}
      />

      <ContainerSelectionModal
        isOpen={isContainerModalOpen}
        onClose={() => setIsContainerModalOpen(false)}
        onSelect={handleContainerSelection}
        currentContainerId={item?.container?.id}
      />
    </PageLayout>
  )
}
