import { useState } from 'react'
import { toast } from 'sonner'

import { NotAssignedSection } from '@/Global/components/molecules'
import { EntityHeader } from '@/Global/components/molecules/headers'
import { useUpdateWorkspace } from '@/Workspace/queries'
import { UpdateWorkspaceData } from '@/Workspace/schemas'
import { CreateContainerModal } from '@/Container/components/organisms/modals'
import { Workspace } from '@/Workspace/types'
import { WorkspaceDetailsSection } from './sections/WorkspaceSection'

interface WorkspaceDetailProps {
  workspace: Workspace
}

export function WorkspaceDetail({ workspace }: WorkspaceDetailProps) {
  const updateWorkspace = useUpdateWorkspace()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  const handleUpdateWorkspace = async (data: UpdateWorkspaceData) => {
    try {
      await updateWorkspace.mutateAsync(data)
      toast('Workspace updated', {
        description: `${data.name || workspace.name} has been updated successfully`,
      })
    } catch (err) {
      toast('Error', {
        description: 'Failed to update workspace',
        duration: 3000,
      })
      throw err
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <EntityHeader
        title={workspace.name}
        entityType="workspace"
        addEntity="container"
        onAdd={handleAdd}
      />

      <WorkspaceDetailsSection
        workspace={workspace}
        onUpdate={handleUpdateWorkspace}
        isUpdating={updateWorkspace.isPending}
        allowReassignment={false}
        emptyStateComponent={
          <NotAssignedSection title="Workspace" message="No workspace details available." />
        }
      />

      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspace.id}
      />
    </div>
  )
}
