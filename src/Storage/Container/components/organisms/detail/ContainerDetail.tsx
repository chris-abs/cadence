import { useState } from 'react'
import { toast } from 'sonner'

import { NotAssignedSection } from '@/Global/components/molecules'
import { EntityHeader } from '@/Global/components/molecules/headers'
import { UpdateWorkspaceData } from '@/Storage/Workspace/schemas'
import { useUpdateWorkspace } from '@/Storage/Workspace/queries'
import { WorkspaceDetailsSection } from '@/Storage/Workspace/components/organisms/detail/sections'
import { WorkspaceSelectionModal } from '@/Storage/Workspace/components/organisms/modals'
import { useUpdateContainer } from '@/Storage/Container/queries'
import { UpdateContainerData } from '@/Storage/Container/schemas'
import { Container } from '@/Storage/Container/types'
import { CreateItemModal } from '@/Storage/Item/components/organisms/modal'
import { ContainerDetailsSection } from '@/Storage/Item/components/organisms/detail/sections'
import { ItemCatalogue } from './sections'

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
        description: container.description,
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
      toast.error('Failed to update workspace')
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
        allowReassignment={false}
      />

      <WorkspaceDetailsSection
        workspace={container?.workspace || null}
        onUpdate={handleUpdateWorkspace}
        onAssignOrReassign={handleAssignOrReassignWorkspace}
        isUpdating={updateWorkspace.isPending}
        allowReassignment={true}
        emptyStateComponent={
          <NotAssignedSection
            title="Workspace"
            message="No workspace assigned to this container yet."
            actionLabel="Assign Workspace"
            onAction={handleAssignOrReassignWorkspace}
          />
        }
      />

      <ItemCatalogue
        items={container.items}
        emptyStateComponent={
          <NotAssignedSection
            title="Items"
            message="No items in this container yet. Create new items or assign existing ones to organise this container."
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
