import { useState } from 'react'
import { toast } from 'sonner'

import { EntityPageHeader, NotAssignedSection } from '@/Global/components/molecules'
import { ItemsListSection } from '@/Global/components/organisms/detail/sections'
import { ContainerSelectionModal } from '@/Container/components/organisms/modals'
import { useUpdateContainer } from '@/Container/queries'
import { UpdateContainerData } from '@/Container/schemas'
import { CreateItemModal } from '@/Item/components/organisms/modal'
import { Container } from '@/Container/types'

interface ContainerDetailProps {
  container: Container
}

export function ContainerDetail({ container }: ContainerDetailProps) {
  const updateContainer = useUpdateContainer()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleUpdateContainer = async (data: UpdateContainerData) => {
    try {
      await updateContainer.mutateAsync(data)
      toast('Container updated', {
        description: `${data.name || container.name} has been updated successfully`,
      })
    } catch (err) {
      toast('Error', {
        description: 'Failed to update container',
        duration: 3000,
      })
      throw err
    }
  }

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <EntityPageHeader title={container.name} entityType="item" onAdd={handleAdd} />

      <ContainerSelectionModal
        container={container}
        onUpdateContainer={handleUpdateContainer}
        isUpdating={updateContainer.isPending}
        emptyStateComponent={
          <NotAssignedSection title="Container" message="No container details available." />
        }
      />

      <ItemsListSection
        items={container.items || []}
        emptyStateComponent={
          <NotAssignedSection
            title="Items"
            message="No items in this container yet. Add items to get started."
          />
        }
      />

      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        containerId={container.id}
      />
    </div>
  )
}
