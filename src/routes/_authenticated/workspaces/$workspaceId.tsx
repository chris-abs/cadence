import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Box } from 'lucide-react'
import { toast } from 'sonner'

import { PageLayout } from '@/Global/layout/PageLayout'
import { Alert, AlertDescription, AlertTitle } from '@/Global/components/atoms'
import { EntityPageHeader, NotAssignedSection } from '@/Global/components/molecules'
import { CreateContainerModal } from '@/Container/components/organisms/ContainerModal'
import { WorkspaceSection } from '@/Workspace/components/molecules/sections/detailed/Workspace'
import { useUpdateWorkspace, useWorkspace } from '@/Workspace/queries'
import { UpdateWorkspaceData } from '@/Workspace/schemas'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceId')({
  component: WorkspacePage,
})

function WorkspacePage() {
  const { workspaceId } = Route.useParams()
  const parsedWorkspaceId = parseInt(workspaceId)
  const { data: workspace } = useWorkspace(parsedWorkspaceId)
  const updateWorkspace = useUpdateWorkspace()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (!workspace) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <Box className="h-4 w-4" />
            <AlertTitle>No Workspaces have been found...</AlertTitle>
            <AlertDescription>
              You can create Workspaces in the{' '}
              <Link className="underline" to="/">
                Dashboard
              </Link>{' '}
              and use them to store Containers for better organising!
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    )
  }

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
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <EntityPageHeader title={workspace.name} entityType="container" onAdd={handleAdd} />

        <WorkspaceSection
          workspace={workspace}
          onUpdate={handleUpdateWorkspace}
          isUpdating={updateWorkspace.isPending}
          emptyStateComponent={
            <NotAssignedSection title="Workspace" message="No workspace details available." />
          }
        />
      </div>

      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
