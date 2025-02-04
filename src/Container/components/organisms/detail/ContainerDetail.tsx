import { useState } from 'react'
import { toast } from 'sonner'

import { NotAssignedSection } from '@/Global/components/molecules'
import { EntityHeader } from '@/Global/components/molecules/headers'
import { ContainerSelectionModal } from '@/Container/components/organisms/modals'
import { useUpdateContainer } from '@/Container/queries'
import { UpdateContainerData } from '@/Container/schemas'
import { Container } from '@/Container/types'
import { CreateItemModal } from '@/Item/components/organisms/modal'
import { ItemCatalogue } from '@/Tag/components/organisms/detail/sections'

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
      <EntityHeader title={container.name} entityType="item" addEntity="item" onAdd={handleAdd} />

      <ContainerSelectionModal
        container={container}
        onUpdateContainer={handleUpdateContainer}
        isUpdating={updateContainer.isPending}
        emptyStateComponent={
          <NotAssignedSection title="Container" message="No container details available." />
        }
      />

      <ItemCatalogue
        items={container.items || []}
        emptyStateComponent={
          <NotAssignedSection
            title="Items"
            message="No items are using this tag yet. Add this tag to items to see them here."
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
