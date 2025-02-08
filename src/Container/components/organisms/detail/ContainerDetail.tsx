import { useState } from 'react'
import { toast } from 'sonner'

import { NotAssignedSection } from '@/Global/components/molecules'
import { EntityHeader } from '@/Global/components/molecules/headers'
import { UpdateWorkspaceData } from '@/Workspace/schemas'
import { useUpdateWorkspace } from '@/Workspace/queries'
import { WorkspaceSection } from '@/Workspace/components/organisms/detail/sections'
import { useUpdateContainer } from '@/Container/queries'
import { UpdateContainerData } from '@/Container/schemas'
import { Container } from '@/Container/types'
import { ContainerDetailsSection } from '@/Item/components/organisms/detail/sections'
import { CreateItemModal } from '@/Item/components/organisms/modal'

interface ContainerDetailProps {
  container: Container
}

export function ContainerDetail({ container }: ContainerDetailProps) {
  const updateContainer = useUpdateContainer()
  const updateWorkspace = useUpdateWorkspace()
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false)
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)

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

  const handleUpdateWorkspace = async (data: UpdateWorkspaceData) => {
    try {
      await updateWorkspace.mutateAsync(data)
      toast('Workspace updated', {
        description: `${data.name} has been updated successfully`,
      })
    } catch (err) {
      toast('Error', {
        description: 'Failed to update workspace',
        duration: 3000,
      })
      throw err
    }
  }

  const handleAddItem = () => {
    setIsCreateItemModalOpen(true)
  }

  const handleAssignOrReassignWorkspace = () => {
    setIsWorkspaceModalOpen(true)
  }

  const handleWorkspaceSelection = async (workspaceId: number | undefined) => {
    try {
      const updatedContainerData: UpdateContainerData = {
        id: container.id,
        name: container.name,
        location: container.location,
        workspaceId: workspaceId,
      }

      await updateContainer.mutateAsync(updatedContainerData)
      toast('Workspace updated', {
        description: workspaceId
          ? 'Container has been assigned to a new workspace'
          : 'Container has been removed from its workspace',
      })
      setIsWorkspaceModalOpen(false)
    } catch {
      toast('Error', {
        description: 'Failed to update workspace',
        duration: 3000,
      })
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <EntityHeader
        title={container.name}
        entityType="container"
        addEntity="item"
        onAdd={handleAddItem}
      />

      <ContainerDetailsSection
        container={container}
        onUpdateContainer={handleUpdateContainer}
        isUpdating={updateContainer.isPending}
      />

      <WorkspaceSection
        workspace={container?.workspace}
        onUpdate={handleUpdateWorkspace}
        isUpdating={updateWorkspace.isPending}
        emptyStateComponent={
          <NotAssignedSection
            title="Workspace"
            message="No workspace assigned to this container yet."
            actionLabel="Assign Workspace"
            onAction={handleAssignOrReassignWorkspace}
          />
        }
      />

      <ContainerItemCatalogue
        items={container.items}
        emptyStateComponent={
          <NotAssignedSection
            title="Items"
            message="No items in this container yet. Add items to organize them here."
          />
        }
      />

      <CreateItemModal
        isOpen={isCreateItemModalOpen}
        onClose={() => setIsCreateItemModalOpen(false)}
        containerId={container.id}
      />

      <WorkspaceSelectionModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        currentWorkspaceId={container.workspace?.id}
        onSelect={handleWorkspaceSelection}
      />
    </div>
  )
}
