import { useState } from 'react'
import { toast } from 'sonner'

import { useUpdateItem } from '@/Item/queries'
import { EntityHeader } from '@/Global/components/molecules/headers'
import { ContainerSelectionModal } from '@/Container/components/organisms/modals'
import { useUpdateContainer } from '@/Container/queries'
import { UpdateContainerData } from '@/Container/schemas'
import { CreateTagModal } from '@/Tag/components/organisms/modals'
import { UpdateItemData } from '@/Item/schemas'
import { Item } from '@/Item/types'
import { ContainerDetailsSection, ItemDetailsSection } from './sections'

interface ItemDetailProps {
  item: Item
}

export function ItemDetail({ item }: ItemDetailProps) {
  const updateItem = useUpdateItem()
  const updateContainer = useUpdateContainer()
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false)
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)

  const handleAddTag = () => {
    setIsCreateTagModalOpen(true)
  }

  const handleUpdateItem = async (data: UpdateItemData) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        name: data.name ?? item.name,
        description: data.description ?? item.description,
        quantity: data.quantity ?? item.quantity,
        containerId: data.containerId,
        tags: data.tags || item.tags.map((tag) => tag.id),
        imagesToDelete: data.imagesToDelete || [],
        images: data.images || [],
      })

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

  const handleTagCreated = async (tagId: number) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        containerId: item.containerId,
        tags: [...item.tags.map((tag) => tag.id), tagId],
      })
    } catch (err) {
      toast.error('Failed to assign tag to item')
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
      const updatedItemData: UpdateItemData = {
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        containerId: containerId,
        tags: item.tags.map((tag) => tag.id),
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
    <div className="flex flex-1 flex-col gap-4">
      <EntityHeader title={item.name} entityType="item" onAdd={handleAddTag} />

      <ItemDetailsSection
        item={item}
        onUpdate={handleUpdateItem}
        isUpdating={updateItem.isPending}
      />

      <ContainerDetailsSection
        container={item?.container}
        onUpdateContainer={handleUpdateContainer}
        isUpdating={updateContainer.isPending}
        onAssignOrReassign={handleAssignOrReassignContainer}
      />

      <CreateTagModal
        isOpen={isCreateTagModalOpen}
        onClose={() => setIsCreateTagModalOpen(false)}
        item={item}
        onTagCreated={handleTagCreated}
      />

      <ContainerSelectionModal
        isOpen={isContainerModalOpen}
        onClose={() => setIsContainerModalOpen(false)}
        onSelect={handleContainerSelection}
        currentContainerId={item?.container?.id}
      />
    </div>
  )
}
